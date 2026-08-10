using System.Diagnostics;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddSingleton<StateStore>();
builder.Services.AddSingleton<LocalUserCredentialStore>();
builder.Services.AddSingleton<VersionManagementStore>();
builder.Services.AddSingleton<VersionBackupService>();
builder.Services.AddSingleton<SmartNotificationSource>();
builder.Services.AddSingleton<SmartNotificationHub>();
builder.Services.AddSingleton<SmartAssistantPreferenceStore>();
builder.Services.AddHostedService<SmartNotificationMonitor>();
builder.Services.AddSingleton<MachineDashboardSource>();
builder.Services.AddSingleton<MachineDashboardHub>();
builder.Services.AddSingleton<MachineImageStore>();
builder.Services.AddHostedService<MachineDashboardMonitor>();

var app = builder.Build();
app.UseCors();
app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromSeconds(20)
});
app.MapVersionManagementApi();
app.MapSmartAssistantApi();
app.MapMachineDashboardApi();
app.MapUserManagementApi();

app.MapGet("/api/health", (StateStore store) => Results.Ok(new
{
    status = "online",
    runtime = ".NET 10",
    database_exists = store.Exists,
    message = "PredictaCore ASP.NET Core Web API is ready."
}));

app.MapPost("/api/auth/login", async (
    LoginRequest credentials,
    StateStore store,
    LocalUserCredentialStore credentialStore,
    IConfiguration configuration,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(credentials.Username) || string.IsNullOrWhiteSpace(credentials.Password))
        return Results.BadRequest(new { status = "error", message = "Username dan password wajib diisi." });

    var state = await store.ReadAsync(cancellationToken);
    var user = state["users"]?.AsArray()
        .Select(item => item as JsonObject)
        .FirstOrDefault(item =>
            string.Equals(item?["username"]?.GetValue<string>(), credentials.Username.Trim(), StringComparison.OrdinalIgnoreCase) ||
            (item?["full_name"]?.GetValue<string>()?.Contains(credentials.Username.Trim(), StringComparison.OrdinalIgnoreCase) ?? false));

    if (user is null)
        return Results.Json(new { status = "error", message = "Username atau password tidak sesuai." }, statusCode: StatusCodes.Status401Unauthorized);

    var username = user["username"]?.GetValue<string>() ?? string.Empty;
    var passwordHash = await credentialStore.GetHashAsync(username, cancellationToken)
        ?? configuration[$"LocalAuthentication:Users:{username}:PasswordHash"];
    if (!LocalUserCredentialStore.VerifyPassword(credentials.Password, passwordHash))
        return Results.Json(new { status = "error", message = "Username atau password tidak sesuai." }, statusCode: StatusCodes.Status401Unauthorized);

    return Results.Ok(new
    {
        status = "success",
        user = new
        {
            id = user["id"]?.GetValue<int>() ?? 0,
            username,
            role = user["role"]?.GetValue<string>() ?? "TECHNICIAN",
            full_name = user["full_name"]?.GetValue<string>() ?? username
        }
    });
});

app.MapGet("/api/state", async (StateStore store, CancellationToken cancellationToken) =>
    Results.Json(await store.ReadAsync(cancellationToken)));

app.MapPut("/api/state", async (HttpRequest request, StateStore store, CancellationToken cancellationToken) =>
{
    var state = await ReadJsonObjectAsync(request, cancellationToken);
    if (state is null)
        return Results.BadRequest(new { status = "error", message = "Payload input kosong / tidak valid." });

    await store.WriteAsync(state, cancellationToken);
    return Results.Ok(new { status = "success", message = "Data terpusat berhasil tersimpan melalui ASP.NET Core Web API." });
});

app.MapGet("/api/telemetry/poll", () => Results.Ok(new
{
    status = "success",
    latency_ms = 0,
    machines = Array.Empty<object>(),
    source = "dotnet-web-api"
}));

app.MapGet("/api/plc/test", TestPlcAsync);

// Compatibility endpoint retained while the browser code is migrated from api.php URLs.
app.MapMethods("/api.php", ["GET", "POST", "OPTIONS"], async (
    HttpRequest request,
    StateStore store,
    CancellationToken cancellationToken) =>
{
    if (HttpMethods.IsOptions(request.Method))
        return Results.NoContent();

    var body = HttpMethods.IsPost(request.Method)
        ? await ReadJsonObjectAsync(request, cancellationToken)
        : null;

    var action = request.Query["action"].FirstOrDefault()
        ?? body?["action"]?.GetValue<string>()
        ?? (HttpMethods.IsPost(request.Method) ? "save_state" : "get_state");

    return action switch
    {
        "check_db" => Results.Ok(new
        {
            status = "online",
            runtime = ".NET 10",
            json_file_writable = true,
            database_exists = store.Exists,
            message = "ASP.NET Core Web API siap menyimpan data."
        }),
        "save_state" => await SaveCompatibilityStateAsync(body, store, cancellationToken),
        "poll_all_machines" => Results.Ok(new
        {
            status = "success",
            latency_ms = 0,
            machines = Array.Empty<object>(),
            source = "dotnet-web-api"
        }),
        "test_plc_ping" => await TestPlcAsync(request, cancellationToken),
        _ => Results.Json(await store.ReadAsync(cancellationToken))
    };
});

app.MapGet("/sse.php", StreamTelemetryAsync);
app.MapGet("/api/telemetry/stream", StreamTelemetryAsync);

app.Run();

static async Task<IResult> SaveCompatibilityStateAsync(
    JsonObject? body,
    StateStore store,
    CancellationToken cancellationToken)
{
    if (body is null)
        return Results.BadRequest(new { status = "error", message = "Payload input kosong / tidak valid." });

    body.Remove("action");
    await store.WriteAsync(body, cancellationToken);
    return Results.Ok(new { status = "success", message = "Data terpusat berhasil tersimpan melalui ASP.NET Core Web API." });
}

static async Task<IResult> TestPlcAsync(HttpRequest request, CancellationToken cancellationToken)
{
    var ip = request.Query["ip"].FirstOrDefault() ?? "127.0.0.1";
    var protocol = request.Query["protocol"].FirstOrDefault() ?? "TCP";
    var address = request.Query["address"].FirstOrDefault() ?? "DB1.DBX0.0";
    var port = int.TryParse(request.Query["port"], out var parsedPort) ? parsedPort : 102;
    var timer = Stopwatch.StartNew();

    try
    {
        using var client = new TcpClient();
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(3));
        await client.ConnectAsync(ip, port, timeout.Token);
        timer.Stop();
        return Results.Ok(new
        {
            status = "success",
            connected = true,
            ip,
            port,
            protocol,
            address,
            latency_ms = Math.Round(timer.Elapsed.TotalMilliseconds, 1),
            bit_value = 1,
            counter_value = 0,
            signal_quality = "Connected",
            message = $"TCP connection to {ip}:{port} succeeded."
        });
    }
    catch (Exception exception) when (exception is SocketException or TimeoutException or OperationCanceledException)
    {
        timer.Stop();
        return Results.Ok(new
        {
            status = "warning",
            connected = false,
            ip,
            port,
            protocol,
            address,
            latency_ms = Math.Round(timer.Elapsed.TotalMilliseconds, 1),
            bit_value = 0,
            counter_value = 0,
            error_message = exception.Message,
            message = $"TCP connection to {ip}:{port} did not respond."
        });
    }
}

static async Task StreamTelemetryAsync(HttpContext context, CancellationToken cancellationToken)
{
    context.Response.StatusCode = StatusCodes.Status200OK;
    context.Response.ContentType = "text/event-stream";
    context.Response.Headers.CacheControl = "no-cache, no-store";
    context.Response.Headers.Connection = "keep-alive";
    context.Response.Headers["X-Accel-Buffering"] = "no";

    await WriteSseEventAsync(context.Response, "telemetry_delta", new
    {
        status = "success",
        timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        deltas = Array.Empty<object>()
    }, cancellationToken);

    using var heartbeat = new PeriodicTimer(TimeSpan.FromSeconds(1));
    while (await heartbeat.WaitForNextTickAsync(cancellationToken))
    {
        await WriteSseEventAsync(context.Response, "heartbeat", new
        {
            status = "alive",
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        }, cancellationToken);
    }
}

static async Task WriteSseEventAsync(
    HttpResponse response,
    string eventName,
    object payload,
    CancellationToken cancellationToken)
{
    await response.WriteAsync($"event: {eventName}\n", cancellationToken);
    await response.WriteAsync($"data: {JsonSerializer.Serialize(payload)}\n\n", cancellationToken);
    await response.Body.FlushAsync(cancellationToken);
}

static async Task<JsonObject?> ReadJsonObjectAsync(HttpRequest request, CancellationToken cancellationToken)
{
    try
    {
        return await JsonNode.ParseAsync(request.Body, cancellationToken: cancellationToken) as JsonObject;
    }
    catch (JsonException)
    {
        return null;
    }
}

sealed record LoginRequest(string Username, string Password);

sealed class StateStore(IWebHostEnvironment environment)
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly string _path = Path.Combine(environment.ContentRootPath, "data", "database.json");

    public bool Exists => File.Exists(_path);

    public async Task<JsonObject> ReadAsync(CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (!File.Exists(_path))
                return EmptyState();

            await using var stream = File.OpenRead(_path);
            var state = await JsonNode.ParseAsync(stream, cancellationToken: cancellationToken) as JsonObject
                ?? EmptyState();
            state["status"] = "success";
            return state;
        }
        catch (JsonException)
        {
            return EmptyState();
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task WriteAsync(JsonObject state, CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
            state.Remove("status");
            var temporaryPath = _path + ".tmp";
            await File.WriteAllTextAsync(
                temporaryPath,
                state.ToJsonString(new JsonSerializerOptions { WriteIndented = true }),
                cancellationToken);
            File.Move(temporaryPath, _path, true);
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<T> UpdateAsync<T>(
        Func<JsonObject, T> update,
        CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            JsonObject state;
            if (!File.Exists(_path))
            {
                state = EmptyState();
            }
            else
            {
                try
                {
                    await using var stream = File.OpenRead(_path);
                    state = await JsonNode.ParseAsync(stream, cancellationToken: cancellationToken) as JsonObject
                        ?? EmptyState();
                }
                catch (JsonException)
                {
                    state = EmptyState();
                }
            }

            state.Remove("status");
            var result = update(state);
            Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
            var temporaryPath = _path + ".tmp";
            await File.WriteAllTextAsync(
                temporaryPath,
                state.ToJsonString(new JsonSerializerOptions { WriteIndented = true }),
                cancellationToken);
            File.Move(temporaryPath, _path, true);
            return result;
        }
        finally
        {
            _gate.Release();
        }
    }

    private static JsonObject EmptyState() => new()
    {
        ["status"] = "success",
        ["machines"] = new JsonArray(),
        ["spare_parts"] = new JsonArray(),
        ["users"] = new JsonArray()
    };
}

public partial class Program { }
