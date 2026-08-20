using System.Collections.Concurrent;
using System.Globalization;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Npgsql;

public static class SmartAssistantEndpoints
{
    public static IEndpointRouteBuilder MapSmartAssistantApi(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/smart-assistant");

        group.MapGet("/notifications", async (
            SmartNotificationSource source,
            CancellationToken cancellationToken) =>
            Results.Ok(await source.GetSnapshotAsync(cancellationToken)))
            .RequirePermission(PermissionNames.DashboardView);

        group.MapGet("/preferences", async (
            string? username,
            SmartAssistantPreferenceStore preferences,
            CancellationToken cancellationToken) =>
            Results.Ok(await preferences.ReadAsync(username, cancellationToken)))
            .RequirePermission(PermissionNames.SettingsView);

        group.MapPut("/preferences", async (
            string? username,
            SmartAssistantPreferences request,
            SmartAssistantPreferenceStore preferences,
            CancellationToken cancellationToken) =>
        {
            var saved = await preferences.WriteAsync(username, request, cancellationToken);
            return Results.Ok(new { status = "success", preferences = saved });
        }).RequirePermission(PermissionNames.SettingsManage);

        group.Map("/ws", async (
            HttpContext context,
            SmartNotificationHub hub,
            SmartNotificationSource source) =>
        {
            if (!context.WebSockets.IsWebSocketRequest)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new
                {
                    status = "error",
                    message = "WebSocket upgrade is required."
                }, context.RequestAborted);
                return;
            }

            using var socket = await context.WebSockets.AcceptWebSocketAsync();
            var connectionId = hub.Register(socket);

            try
            {
                await hub.SendAsync(socket, await source.GetSnapshotAsync(context.RequestAborted), context.RequestAborted);
                var buffer = new byte[256];

                while (socket.State == WebSocketState.Open && !context.RequestAborted.IsCancellationRequested)
                {
                    var result = await socket.ReceiveAsync(buffer, context.RequestAborted);
                    if (result.MessageType == WebSocketMessageType.Close)
                        break;
                }
            }
            catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
            {
                // Browser disconnected or the application is stopping.
            }
            catch (WebSocketException)
            {
                // Browsers and reverse proxies may terminate a socket without a close handshake.
            }
            finally
            {
                hub.Unregister(connectionId);
                if (socket.State is WebSocketState.Open or WebSocketState.CloseReceived)
                {
                    try { await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None); }
                    catch (WebSocketException) { }
                }
            }
        }).RequirePermission(PermissionNames.DashboardView);

        return endpoints;
    }
}

public sealed record SmartNotificationItem(
    string Id,
    string MachineName,
    string PartName,
    double RemainingHours,
    double RemainingPercentage,
    string Status,
    DateOnly? NextReplacementDate,
    DateOnly? LastReplacementDate);

public sealed record SmartNotificationSnapshot(
    IReadOnlyList<SmartNotificationItem> Notifications,
    int Total,
    int CriticalCount,
    int WarningCount,
    string HighestSeverity,
    string Source,
    DateTimeOffset UpdatedAt);

public sealed record SmartAssistantPreferences(
    bool EnableSmartAssistant = true,
    bool EnableRobotAnimation = true,
    bool EnableAutoPopup = true);

sealed class SmartNotificationSource(
    StateStore stateStore,
    IConfiguration configuration,
    ILogger<SmartNotificationSource> logger)
{
    public async Task<SmartNotificationSnapshot> GetSnapshotAsync(CancellationToken cancellationToken)
    {
        var connectionStringName = configuration["SmartAssistant:PostgreSqlConnectionStringName"] ?? "PostgreSQL";
        var connectionString = configuration.GetConnectionString(connectionStringName);

        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            try
            {
                return BuildSnapshot(await ReadPostgreSqlAsync(connectionString, cancellationToken), "postgresql");
            }
            catch (Exception exception) when (exception is NpgsqlException or InvalidOperationException)
            {
                logger.LogWarning(exception, "Smart Assistant PostgreSQL source is unavailable; using the synchronized state-store fallback.");
            }
        }

        return BuildSnapshot(await ReadStateStoreAsync(cancellationToken), "state-store-fallback");
    }

    private static SmartNotificationSnapshot BuildSnapshot(
        IEnumerable<SmartNotificationItem> items,
        string source)
    {
        var sorted = items
            .Where(item => item.Status is "CRITICAL" or "WARNING")
            .OrderBy(item => item.Status == "CRITICAL" ? 0 : 1)
            .ThenBy(item => item.RemainingPercentage)
            .ThenBy(item => item.RemainingHours)
            .ThenBy(item => item.PartName, StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var criticalCount = sorted.Count(item => item.Status == "CRITICAL");
        var warningCount = sorted.Length - criticalCount;

        return new SmartNotificationSnapshot(
            sorted,
            sorted.Length,
            criticalCount,
            warningCount,
            criticalCount > 0 ? "CRITICAL" : warningCount > 0 ? "WARNING" : "HEALTHY",
            source,
            DateTimeOffset.UtcNow);
    }

    private static async Task<IReadOnlyList<SmartNotificationItem>> ReadPostgreSqlAsync(
        string connectionString,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                machine_name,
                part_name,
                remaining_hours,
                remaining_percentage,
                status,
                next_replacement_date,
                last_replacement_date
            FROM spare_parts
            WHERE UPPER(status) IN ('WARNING', 'CRITICAL')
            ORDER BY
                CASE WHEN UPPER(status) = 'CRITICAL' THEN 0 ELSE 1 END,
                remaining_percentage ASC,
                remaining_hours ASC;
            """;

        var items = new List<SmartNotificationItem>();
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            var machineName = ReadString(reader, "machine_name", "Mesin tidak diketahui");
            var partName = ReadString(reader, "part_name", "Spare part tidak diketahui");
            var remainingHours = ReadDouble(reader, "remaining_hours");
            var remainingPercentage = Math.Clamp(ReadDouble(reader, "remaining_percentage"), 0, 100);
            var status = NormalizeStatus(ReadString(reader, "status", "WARNING"));

            items.Add(new SmartNotificationItem(
                $"pg:{machineName}:{partName}",
                machineName,
                partName,
                remainingHours,
                remainingPercentage,
                status,
                ReadDate(reader, "next_replacement_date"),
                ReadDate(reader, "last_replacement_date")));
        }

        return items;
    }

    private async Task<IReadOnlyList<SmartNotificationItem>> ReadStateStoreAsync(CancellationToken cancellationToken)
    {
        var state = await stateStore.ReadAsync(cancellationToken);
        var machines = state["machines"]?.AsArray()
            .OfType<JsonObject>()
            .Where(machine => ReadInt(machine, "id") is not null)
            .ToDictionary(machine => ReadInt(machine, "id")!.Value);
        var items = new List<SmartNotificationItem>();

        foreach (var part in state["spare_parts"]?.AsArray().OfType<JsonObject>() ?? [])
        {
            var machineId = ReadInt(part, "machine_id");
            JsonObject? machine = null;
            if (machines is not null)
                machines.TryGetValue(machineId ?? -1, out machine);
            var lifetimeHours = ReadDouble(part, "lifetime_hours") ?? 0;
            var currentHours = ReadDouble(part, "current_running_hours") ?? 0;
            var remainingHours = ReadDouble(part, "remaining_hours")
                ?? Math.Max(0, lifetimeHours - currentHours);
            var remainingPercentage = ReadDouble(part, "remaining_percentage", "remaining_life_pct")
                ?? (lifetimeHours > 0 ? Math.Max(0, (lifetimeHours - currentHours) / lifetimeHours * 100) : 100);
            remainingPercentage = Math.Round(Math.Clamp(remainingPercentage, 0, 100), 1);
            var explicitStatus = ReadString(part, "status");
            var status = string.IsNullOrWhiteSpace(explicitStatus)
                ? remainingPercentage < 10 ? "CRITICAL" : remainingPercentage <= 50 ? "WARNING" : "HEALTHY"
                : NormalizeStatus(explicitStatus);

            if (status is not ("CRITICAL" or "WARNING"))
                continue;

            var machineName = ReadString(part, "machine_name")
                ?? (machine is null ? null : ReadString(machine, "name"))
                ?? "Mesin tidak diketahui";
            var partName = ReadString(part, "part_name", "name") ?? "Spare part tidak diketahui";
            var nextReplacementDate = ReadDate(part, "next_replacement_date");

            if (nextReplacementDate is null && remainingHours > 0)
            {
                var dailyHours = machine is null ? 20 : ReadDouble(machine, "running_hours_daily") ?? 20;
                if (dailyHours <= 0) dailyHours = 20;
                nextReplacementDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(Math.Ceiling(remainingHours / dailyHours)));
            }

            items.Add(new SmartNotificationItem(
                $"state:{ReadInt(part, "id") ?? items.Count + 1}",
                machineName,
                partName,
                Math.Round(remainingHours, 1),
                remainingPercentage,
                status,
                nextReplacementDate,
                ReadDate(part, "last_replacement_date")));
        }

        return items;
    }

    private static string NormalizeStatus(string value)
    {
        var normalized = value.Trim().ToUpperInvariant();
        if (normalized.Contains("CRITICAL", StringComparison.Ordinal) ||
            normalized.Contains("OVERDUE", StringComparison.Ordinal) ||
            normalized.Contains("ACTION REQUIRED", StringComparison.Ordinal))
            return "CRITICAL";
        if (normalized.Contains("WARNING", StringComparison.Ordinal))
            return "WARNING";
        return "HEALTHY";
    }

    private static string ReadString(NpgsqlDataReader reader, string name, string fallback)
    {
        var ordinal = reader.GetOrdinal(name);
        return reader.IsDBNull(ordinal) ? fallback : Convert.ToString(reader.GetValue(ordinal), CultureInfo.InvariantCulture) ?? fallback;
    }

    private static double ReadDouble(NpgsqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        if (reader.IsDBNull(ordinal)) return 0;
        return Convert.ToDouble(reader.GetValue(ordinal), CultureInfo.InvariantCulture);
    }

    private static DateOnly? ReadDate(NpgsqlDataReader reader, string name)
    {
        var ordinal = reader.GetOrdinal(name);
        if (reader.IsDBNull(ordinal)) return null;
        return ConvertToDate(reader.GetValue(ordinal));
    }

    private static string? ReadString(JsonObject source, params string[] names)
    {
        foreach (var name in names)
        {
            if (source[name] is JsonValue value && value.TryGetValue<string>(out var result))
                return result;
        }
        return null;
    }

    private static int? ReadInt(JsonObject source, string name)
    {
        if (source[name] is not JsonValue value) return null;
        if (value.TryGetValue<int>(out var integer)) return integer;
        if (value.TryGetValue<long>(out var longInteger)) return checked((int)longInteger);
        return int.TryParse(value.ToString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out integer) ? integer : null;
    }

    private static double? ReadDouble(JsonObject source, params string[] names)
    {
        foreach (var name in names)
        {
            if (source[name] is not JsonValue value) continue;
            if (value.TryGetValue<double>(out var number)) return number;
            if (value.TryGetValue<decimal>(out var decimalNumber)) return (double)decimalNumber;
            if (double.TryParse(value.ToString(), NumberStyles.Float, CultureInfo.InvariantCulture, out number)) return number;
        }
        return null;
    }

    private static DateOnly? ReadDate(JsonObject source, string name) =>
        source[name] is JsonValue value ? ConvertToDate(value.ToString()) : null;

    private static DateOnly? ConvertToDate(object value)
    {
        if (value is DateOnly dateOnly) return dateOnly;
        if (value is DateTime dateTime) return DateOnly.FromDateTime(dateTime);
        return DateOnly.TryParse(Convert.ToString(value, CultureInfo.InvariantCulture), CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed)
            ? parsed
            : null;
    }
}

sealed class SmartNotificationHub
{
    private readonly ConcurrentDictionary<Guid, WebSocket> _connections = new();
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public Guid Register(WebSocket socket)
    {
        var id = Guid.NewGuid();
        _connections[id] = socket;
        return id;
    }

    public void Unregister(Guid id) => _connections.TryRemove(id, out _);

    public Task SendAsync(WebSocket socket, SmartNotificationSnapshot snapshot, CancellationToken cancellationToken) =>
        SendPayloadAsync(socket, snapshot, cancellationToken);

    public async Task BroadcastAsync(SmartNotificationSnapshot snapshot, CancellationToken cancellationToken)
    {
        foreach (var (id, socket) in _connections.ToArray())
        {
            try
            {
                await SendPayloadAsync(socket, snapshot, cancellationToken);
            }
            catch (Exception exception) when (exception is WebSocketException or OperationCanceledException)
            {
                Unregister(id);
            }
        }
    }

    private static async Task SendPayloadAsync(
        WebSocket socket,
        SmartNotificationSnapshot snapshot,
        CancellationToken cancellationToken)
    {
        if (socket.State != WebSocketState.Open) return;
        var payload = JsonSerializer.SerializeToUtf8Bytes(new { type = "smart-notifications", data = snapshot }, JsonOptions);
        await socket.SendAsync(payload, WebSocketMessageType.Text, true, cancellationToken);
    }
}

sealed class SmartNotificationMonitor(
    SmartNotificationSource source,
    SmartNotificationHub hub,
    IConfiguration configuration,
    ILogger<SmartNotificationMonitor> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var seconds = Math.Clamp(configuration.GetValue("SmartAssistant:PollIntervalSeconds", 3), 1, 60);
        var interval = TimeSpan.FromSeconds(seconds);
        string? previousFingerprint = null;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var snapshot = await source.GetSnapshotAsync(stoppingToken);
                var fingerprint = string.Join('|', snapshot.Notifications.Select(item =>
                    $"{item.Id}:{item.Status}:{item.RemainingPercentage:F1}:{item.RemainingHours:F1}"));

                if (!string.Equals(previousFingerprint, fingerprint, StringComparison.Ordinal))
                {
                    previousFingerprint = fingerprint;
                    await hub.BroadcastAsync(snapshot, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Smart Assistant notification monitor failed; the next polling cycle will retry.");
            }

            await Task.Delay(interval, stoppingToken);
        }
    }
}

sealed class SmartAssistantPreferenceStore(IWebHostEnvironment environment)
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly string _path = Path.Combine(environment.ContentRootPath, "data", "smart-assistant-preferences.json");
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    public async Task<SmartAssistantPreferences> ReadAsync(string? username, CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var all = await ReadAllAsync(cancellationToken);
            return all.TryGetValue(NormalizeUsername(username), out var preferences)
                ? preferences
                : new SmartAssistantPreferences();
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<SmartAssistantPreferences> WriteAsync(
        string? username,
        SmartAssistantPreferences preferences,
        CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var all = await ReadAllAsync(cancellationToken);
            all[NormalizeUsername(username)] = preferences;
            Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
            var temporaryPath = _path + ".tmp";
            await File.WriteAllTextAsync(temporaryPath, JsonSerializer.Serialize(all, JsonOptions), cancellationToken);
            File.Move(temporaryPath, _path, true);
            return preferences;
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task<Dictionary<string, SmartAssistantPreferences>> ReadAllAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(_path)) return new(StringComparer.OrdinalIgnoreCase);
        try
        {
            await using var stream = File.OpenRead(_path);
            return await JsonSerializer.DeserializeAsync<Dictionary<string, SmartAssistantPreferences>>(stream, JsonOptions, cancellationToken)
                ?? new(StringComparer.OrdinalIgnoreCase);
        }
        catch (JsonException)
        {
            return new(StringComparer.OrdinalIgnoreCase);
        }
    }

    private static string NormalizeUsername(string? username) =>
        string.IsNullOrWhiteSpace(username) ? "default" : username.Trim().ToLowerInvariant();
}
