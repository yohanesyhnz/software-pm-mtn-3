using System.Diagnostics;
using System.Net.Sockets;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;

var builder = WebApplication.CreateBuilder(args);

var dataProtectionDirectory = new DirectoryInfo(Path.Combine(builder.Environment.ContentRootPath, "data", "keys"));
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(dataProtectionDirectory)
    .SetApplicationName("PredictaCore.CMMS");
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "PredictaCore.Session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
        options.Events.OnValidatePrincipal = async context =>
        {
            var rbac = context.HttpContext.RequestServices.GetRequiredService<RbacStore>();
            if (await rbac.GetCurrentAccessAsync(context.Principal!, context.HttpContext.RequestAborted) is null)
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            }
        };
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});
builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "PredictaCore.Csrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 8,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1),
                AutoReplenishment = true
            }));
});
builder.Services.AddSingleton<StateStore>();
builder.Services.AddSingleton<LocalUserCredentialStore>();
builder.Services.AddSingleton<RbacStore>();
builder.Services.AddSingleton<SecurityAuditStore>();
builder.Services.AddHostedService<RbacBootstrapService>();
builder.Services.AddSingleton<VersionManagementStore>();
builder.Services.AddSingleton<VersionBackupService>();
builder.Services.AddSingleton<SmartNotificationSource>();
builder.Services.AddSingleton<SmartNotificationHub>();
builder.Services.AddSingleton<SmartAssistantPreferenceStore>();
builder.Services.AddHostedService<SmartNotificationMonitor>();
builder.Services.AddSingleton<MachineDashboardSource>();
builder.Services.AddSingleton<MachineDashboardHub>();
builder.Services.AddSingleton<MachineImageStore>();
builder.Services.AddSingleton<PostgreSqlDataSourceProvider>();
builder.Services.AddSingleton<MachineRealtimeRegistry>();
builder.Services.AddSingleton<MachineStatusEngine>();
builder.Services.AddSingleton<MachineConfigurationStore>();
builder.Services.AddSingleton<MachineStatePersistence>();
builder.Services.AddHostedService<MachineDataAcquisitionService>();

var app = builder.Build();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.Use(async (context, next) =>
{
    if ((context.Request.Path.StartsWithSegments("/api") || context.Request.Path.Equals("/api.php")) &&
        (HttpMethods.IsPost(context.Request.Method) ||
         HttpMethods.IsPut(context.Request.Method) ||
         HttpMethods.IsPatch(context.Request.Method) ||
         HttpMethods.IsDelete(context.Request.Method)))
    {
        try
        {
            await context.RequestServices.GetRequiredService<IAntiforgery>().ValidateRequestAsync(context);
        }
        catch (AntiforgeryValidationException)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.Headers["X-CSRF-Error"] = "1";
            await context.Response.WriteAsJsonAsync(new { status = "error", message = "Token keamanan CSRF tidak valid atau telah kedaluwarsa." });
            return;
        }
    }
    await next();
});
app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromSeconds(20)
});
app.MapVersionManagementApi();
app.MapSmartAssistantApi();
app.MapMachineDashboardApi();
app.MapMachineMonitoringApi();
app.MapUserManagementApi();
app.MapSparePartManagementApi();
app.MapRbacApi();
app.MapMaintenanceOperationsApi();

app.MapGet("/api/health", (StateStore store) => Results.Ok(new
{
    status = "online",
    runtime = ".NET 10",
    database_exists = store.Exists,
    message = "PredictaCore ASP.NET Core Web API is ready."
})).AllowAnonymous();

app.MapGet("/api/auth/csrf", (HttpContext context, IAntiforgery antiforgery) =>
{
    var tokens = antiforgery.GetAndStoreTokens(context);
    return Results.Ok(new { token = tokens.RequestToken });
}).AllowAnonymous();

app.MapPost("/api/auth/login", async (
    LoginRequest credentials,
    HttpContext context,
    StateStore store,
    LocalUserCredentialStore credentialStore,
    RbacStore rbacStore,
    SecurityAuditStore auditStore,
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
    {
        await auditStore.WriteAsync(new SecurityAuditEntry(DateTimeOffset.UtcNow, credentials.Username.Trim(), "UNKNOWN", "LOGIN", "session", "DENIED"), cancellationToken);
        return Results.Json(new { status = "error", message = "Username atau password tidak sesuai." }, statusCode: StatusCodes.Status401Unauthorized);
    }

    var username = user["username"]?.GetValue<string>() ?? string.Empty;
    var passwordHash = await credentialStore.GetHashAsync(username, cancellationToken)
        ?? configuration[$"LocalAuthentication:Users:{username}:PasswordHash"];
    if (!LocalUserCredentialStore.VerifyPassword(credentials.Password, passwordHash))
    {
        await auditStore.WriteAsync(new SecurityAuditEntry(DateTimeOffset.UtcNow, username, user["role"]?.GetValue<string>() ?? "UNKNOWN", "LOGIN", "session", "DENIED"), cancellationToken);
        return Results.Json(new { status = "error", message = "Username atau password tidak sesuai." }, statusCode: StatusCodes.Status401Unauthorized);
    }

    await rbacStore.EnsureDefaultsAsync(cancellationToken);
    var role = user["role"]?.GetValue<string>()?.Trim().ToUpperInvariant() ?? "TECHNICIAN";
    var fullName = user["full_name"]?.GetValue<string>() ?? username;
    var identity = new ClaimsIdentity(
    [
        new Claim(ClaimTypes.NameIdentifier, (user["id"]?.GetValue<int>() ?? 0).ToString()),
        new Claim(ClaimTypes.Name, username),
        new Claim(ClaimTypes.GivenName, fullName),
        new Claim(ClaimTypes.Role, role)
    ], CookieAuthenticationDefaults.AuthenticationScheme);
    var principal = new ClaimsPrincipal(identity);
    await context.SignInAsync(
        CookieAuthenticationDefaults.AuthenticationScheme,
        principal,
        new AuthenticationProperties { IsPersistent = false, AllowRefresh = true });
    var access = await rbacStore.GetCurrentAccessAsync(principal, cancellationToken);
    await auditStore.WriteAsync(new SecurityAuditEntry(DateTimeOffset.UtcNow, username, role, "LOGIN", "session", "SUCCESS"), cancellationToken);

    return Results.Ok(new
    {
        status = "success",
        user = new
        {
            id = user["id"]?.GetValue<int>() ?? 0,
            username,
            role,
            full_name = fullName
        },
        permissions = access?.Permissions ?? []
    });
}).RequireRateLimiting("login").AllowAnonymous();

app.MapGet("/api/auth/me", async (HttpContext context, RbacStore rbacStore, CancellationToken cancellationToken) =>
{
    var access = await rbacStore.GetCurrentAccessAsync(context.User, cancellationToken);
    return access is null
        ? Results.Unauthorized()
        : Results.Ok(new
        {
            status = "success",
            user = new { id = access.UserId, username = access.Username, role = access.Role, full_name = access.FullName },
            permissions = access.Permissions
        });
}).RequireAuthorization();

app.MapPost("/api/auth/logout", async (HttpContext context, SecurityAuditStore auditStore, CancellationToken cancellationToken) =>
{
    var username = context.User.Identity?.Name ?? "unknown";
    var role = context.User.FindFirstValue(ClaimTypes.Role) ?? "UNKNOWN";
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    await auditStore.WriteAsync(new SecurityAuditEntry(DateTimeOffset.UtcNow, username, role, "LOGOUT", "session", "SUCCESS"), cancellationToken);
    return Results.Ok(new { status = "success" });
}).RequireAuthorization();

app.MapPost("/api/auth/reauthorize", async (
    ReauthorizeRequest request,
    HttpContext context,
    LocalUserCredentialStore credentialStore,
    IConfiguration configuration,
    SecurityAuditStore auditStore,
    CancellationToken cancellationToken) =>
{
    var username = context.User.Identity?.Name ?? string.Empty;
    var role = context.User.FindFirstValue(ClaimTypes.Role) ?? "UNKNOWN";
    var passwordHash = await credentialStore.GetHashAsync(username, cancellationToken)
        ?? configuration[$"LocalAuthentication:Users:{username}:PasswordHash"];
    var valid = !string.IsNullOrWhiteSpace(request.Password) &&
                LocalUserCredentialStore.VerifyPassword(request.Password, passwordHash);
    await auditStore.WriteAsync(new SecurityAuditEntry(
        DateTimeOffset.UtcNow, username, role, "REAUTHORIZE", "sensitive-operation", valid ? "SUCCESS" : "DENIED"), cancellationToken);
    return valid
        ? Results.Ok(new { status = "success", validUntil = DateTimeOffset.UtcNow.AddMinutes(2) })
        : Results.Json(new { status = "error", message = "Password/PIN tidak sesuai dengan session aktif." }, statusCode: StatusCodes.Status401Unauthorized);
}).RequireAuthorization();

app.MapGet("/api/state", async (StateStore store, CancellationToken cancellationToken) =>
    Results.Json(await store.ReadAsync(cancellationToken)))
    .RequirePermission(PermissionNames.DashboardView);

app.MapPut("/api/state", async (HttpRequest request, StateStore store, CancellationToken cancellationToken) =>
{
    var state = await ReadJsonObjectAsync(request, cancellationToken);
    if (state is null)
        return Results.BadRequest(new { status = "error", message = "Payload input kosong / tidak valid." });

    await store.WriteAsync(state, cancellationToken);
    return Results.Ok(new { status = "success", message = "Data terpusat berhasil tersimpan melalui ASP.NET Core Web API." });
}).RequirePermission(PermissionNames.SystemRestore);

app.MapGet("/api/telemetry/poll", () => Results.Ok(new
{
    status = "success",
    latency_ms = 0,
    machines = Array.Empty<object>(),
    source = "dotnet-web-api"
})).RequirePermission(PermissionNames.DashboardView);

app.MapGet("/api/plc/test", TestPlcAsync).RequirePermission(PermissionNames.IntegrationsManage);

// Compatibility endpoint retained while the browser code is migrated from api.php URLs.
app.MapMethods("/api.php", ["GET", "POST", "OPTIONS"], async (
    HttpRequest request,
    HttpContext context,
    IAuthorizationService authorizationService,
    StateStore store,
    CancellationToken cancellationToken) =>
{
    if (HttpMethods.IsOptions(request.Method))
        return Results.NoContent();

    var body = HttpMethods.IsPost(request.Method)
        ? await ReadJsonObjectAsync(request, cancellationToken)
        : null;

    if (HttpMethods.IsPost(request.Method))
    {
        var authorization = await authorizationService.AuthorizeAsync(
            context.User,
            null,
            new PermissionRequirement(PermissionNames.SystemRestore));
        if (!authorization.Succeeded) return Results.Forbid();
    }

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
}).RequireAuthorization();

app.MapGet("/sse.php", StreamTelemetryAsync).RequirePermission(PermissionNames.DashboardView);
app.MapGet("/api/telemetry/stream", StreamTelemetryAsync).RequirePermission(PermissionNames.DashboardView);

app.Run();

static async Task<IResult> SaveCompatibilityStateAsync(
    JsonObject? body,
    StateStore store,
    CancellationToken cancellationToken)
{
    if (body is null)
        return Results.BadRequest(new { status = "error", message = "Payload input kosong / tidak valid." });

    body.Remove("action");
    var existing = await store.ReadAsync(cancellationToken);
    var existingMachines = (existing["machines"] as JsonArray)?.OfType<JsonObject>()
        .Select(machine => (Key: CompatibilityMachineKey(machine), Machine: machine))
        .Where(item => item.Key is not null)
        .ToDictionary(item => item.Key!, item => item.Machine, StringComparer.OrdinalIgnoreCase)
        ?? new Dictionary<string, JsonObject>(StringComparer.OrdinalIgnoreCase);

    foreach (var incoming in (body["machines"] as JsonArray)?.OfType<JsonObject>() ?? [])
    {
        var key = CompatibilityMachineKey(incoming);
        if (key is null || !existingMachines.TryGetValue(key, out var persisted)) continue;

        // A dashboard tab opened before a backend configuration bootstrap does not
        // know the marker yet. Preserve the backend-owned activation decision once;
        // subsequent payloads carry the marker and can express an admin change.
        var incomingBootstrap = incoming["acquisition_bootstrap_version"]?.GetValue<string>();
        var persistedBootstrap = persisted["acquisition_bootstrap_version"]?.GetValue<string>();
        if (!string.Equals(incomingBootstrap, persistedBootstrap, StringComparison.Ordinal) &&
            !string.IsNullOrWhiteSpace(persistedBootstrap))
        {
            foreach (var field in new[]
            {
                "machine_id", "line_code", "area", "source_table_name", "source_timestamp_column",
                "parameter_name", "parameter_label", "parameter_type", "parameter_unit",
                "secondary_parameter_name", "secondary_parameter_label", "secondary_parameter_unit",
                "running_threshold", "stop_timeout_seconds", "acquisition_enabled",
                "acquisition_bootstrap_version"
            })
            {
                incoming[field] = persisted[field]?.DeepClone();
            }
        }
    }
    await store.WriteAsync(body, cancellationToken);
    return Results.Ok(new { status = "success", message = "Data terpusat berhasil tersimpan melalui ASP.NET Core Web API." });
}

static string? CompatibilityMachineKey(JsonObject machine)
{
    var machineId = machine["machine_id"]?.GetValue<string>()?.Trim();
    if (!string.IsNullOrWhiteSpace(machineId)) return $"machine:{machineId}";
    return machine["id"] is JsonValue idValue && idValue.TryGetValue<int>(out var id) ? $"legacy:{id}" : null;
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
sealed record ReauthorizeRequest(string Password);

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
