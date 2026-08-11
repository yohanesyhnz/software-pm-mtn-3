using System.Collections.Concurrent;
using System.Globalization;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Npgsql;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Processing;

public static class MachineDashboardEndpoints
{
    public static IEndpointRouteBuilder MapMachineDashboardApi(this IEndpointRouteBuilder endpoints)
    {
        var dashboard = endpoints.MapGroup("/api/machine-dashboard");

        dashboard.MapGet("", async (
            bool? includeInactive,
            MachineDashboardSource source,
            CancellationToken cancellationToken) =>
            Results.Ok(await source.GetSnapshotAsync(includeInactive == true, cancellationToken)));

        dashboard.MapPut("/order", async (
            MachineOrderRequest request,
            MachineDashboardSource source,
            CancellationToken cancellationToken) =>
        {
            if (request.MachineIds is null || request.MachineIds.Count == 0 ||
                request.MachineIds.Any(string.IsNullOrWhiteSpace) ||
                request.MachineIds.Distinct(StringComparer.OrdinalIgnoreCase).Count() != request.MachineIds.Count)
            {
                return Results.BadRequest(new { status = "error", message = "Urutan mesin tidak valid atau mengandung duplikasi." });
            }

            await source.SaveOrderAsync(request.MachineIds, cancellationToken);
            return Results.Ok(new { status = "success", message = "Urutan Machine Card berhasil disimpan." });
        });

        dashboard.Map("/ws", async (HttpContext context, MachineDashboardHub hub, MachineDashboardSource source) =>
        {
            if (!context.WebSockets.IsWebSocketRequest)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new { status = "error", message = "WebSocket upgrade is required." }, context.RequestAborted);
                return;
            }

            using var socket = await context.WebSockets.AcceptWebSocketAsync();
            var id = hub.Register(socket);
            try
            {
                await hub.SendAsync(socket, await source.GetSnapshotAsync(false, context.RequestAborted), context.RequestAborted);
                var buffer = new byte[256];
                while (socket.State == WebSocketState.Open && !context.RequestAborted.IsCancellationRequested)
                {
                    var result = await socket.ReceiveAsync(buffer, context.RequestAborted);
                    if (result.MessageType == WebSocketMessageType.Close) break;
                }
            }
            catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
            {
                // Normal browser disconnect.
            }
            finally
            {
                hub.Unregister(id);
                if (socket.State is WebSocketState.Open or WebSocketState.CloseReceived)
                    await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
            }
        });

        var machines = endpoints.MapGroup("/api/machines");
        machines.MapPut("/master/{machineId}", async (
            string machineId,
            MachineMasterRequest request,
            MachineDashboardSource source,
            CancellationToken cancellationToken) =>
        {
            var error = ValidateMasterRequest(machineId, request);
            if (error is not null) return Results.BadRequest(new { status = "error", message = error });

            var saved = await source.SaveMasterAsync(machineId, request, cancellationToken);
            return Results.Ok(new { status = "success", machine = saved });
        });

        machines.MapDelete("/master/{machineId}", async (
            string machineId,
            MachineDashboardSource source,
            CancellationToken cancellationToken) =>
        {
            var deactivated = await source.DeactivateAsync(machineId, cancellationToken);
            return deactivated
                ? Results.Ok(new { status = "success", message = "Mesin dinonaktifkan. Histori dan relasi tetap dipertahankan." })
                : Results.NotFound(new { status = "error", message = "Mesin tidak ditemukan." });
        });

        machines.MapPost("/images", async (
            HttpRequest request,
            MachineImageStore images,
            CancellationToken cancellationToken) =>
        {
            var result = await images.SaveAsync(request, cancellationToken);
            return result.Error is null
                ? Results.Ok(new { status = "success", machineImageUrl = result.Url })
                : Results.Json(new { status = "error", message = result.Error }, statusCode: result.StatusCode);
        });

        machines.MapGet("/images/files/{fileName}", async (
            string fileName,
            HttpContext context,
            MachineImageStore images,
            CancellationToken cancellationToken) =>
        {
            var result = await images.OpenReadAsync(fileName, cancellationToken);
            if (result is null) return Results.NotFound();
            context.Response.Headers.CacheControl = "public,max-age=31536000,immutable";
            return Results.File(result.Value.Stream, result.Value.ContentType, enableRangeProcessing: true);
        });

        return endpoints;
    }

    private static string? ValidateMasterRequest(string machineId, MachineMasterRequest request)
    {
        if (string.IsNullOrWhiteSpace(machineId) || machineId.Length > 100 || machineId.Any(character => !char.IsAsciiLetterOrDigit(character) && character is not ('.' or '_' or '-')))
            return "Machine ID hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung (maksimal 100 karakter).";
        if (string.IsNullOrWhiteSpace(request.MachineName) || request.MachineName.Length > 200) return "Nama mesin wajib diisi dan maksimal 200 karakter.";
        if (string.IsNullOrWhiteSpace(request.MachineCode) || request.MachineCode.Length > 100) return "Machine Code wajib diisi dan maksimal 100 karakter.";
        if (string.IsNullOrWhiteSpace(request.Line) || request.Line.Length > 100) return "Line wajib diisi dan maksimal 100 karakter.";
        if (request.DisplayOrder < 0 || request.DisplayOrder > 100000) return "Display Order harus berada pada rentang 0–100000.";
        if (!MachineStatuses.Contains(NormalizeStatus(request.Status))) return "Status mesin tidak dikenali.";
        if (!DisplayModes.Contains(request.DisplayMode.Trim().ToUpperInvariant())) return "Display Mode harus AUTO, COMPACT, STANDARD, atau LARGE.";
        if (!string.IsNullOrWhiteSpace(request.RealtimeDashboardUrl) &&
            (!Uri.TryCreate(request.RealtimeDashboardUrl, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https")))
            return "Realtime Dashboard URL harus menggunakan http atau https.";
        if (request.AcquisitionEnabled)
        {
            if (string.IsNullOrWhiteSpace(request.SourceTableName) || string.IsNullOrWhiteSpace(request.ParameterName))
                return "Source Table dan Parameter wajib diisi ketika akuisisi PostgreSQL diaktifkan.";
            if (!Enum.TryParse<MachineParameterType>(request.ParameterType, true, out _))
                return "Parameter Type harus COUNTER, SPEED, atau WEIGHT.";
            if (request.StopTimeoutSeconds is < 1 or > 3600)
                return "Stop Timeout harus berada pada rentang 1–3600 detik.";
            if (!IsSafeIdentifier(MachineConfigurationStore.NormalizeTableName(request.SourceTableName)) ||
                !IsSafeIdentifier(request.ParameterName) ||
                !IsSafeIdentifier(request.SourceTimestampColumn ?? "timestamp_zone"))
                return "Nama tabel/kolom PostgreSQL mengandung karakter yang tidak diperbolehkan.";
        }
        return null;
    }

    private static bool IsSafeIdentifier(string? value) => !string.IsNullOrWhiteSpace(value) && value.Length <= 128 &&
        value.All(character => char.IsAsciiLetterOrDigit(character) || character is '_' or ' ' or '-');
    internal static readonly HashSet<string> MachineStatuses = ["RUNNING", "STOPPED", "IDLE", "ALARM", "MAINTENANCE", "DATA OFFLINE", "DATA UNAVAILABLE", "DATABASE OFFLINE"];
    internal static readonly HashSet<string> DisplayModes = ["AUTO", "COMPACT", "STANDARD", "LARGE"];

    internal static string NormalizeStatus(string? value)
    {
        var status = value?.Trim().ToUpperInvariant() ?? "DATA OFFLINE";
        return status switch
        {
            "STANDBY" => "IDLE",
            "OFFLINE" => "DATA OFFLINE",
            _ when MachineStatuses.Contains(status) => status,
            _ => "DATA OFFLINE"
        };
    }
}

public sealed record MachineCardConfiguration(
    bool ShowImage = true,
    bool ShowMachineName = true,
    bool ShowMachineCode = true,
    bool ShowLine = true,
    bool ShowArea = true,
    bool ShowStatus = true,
    bool ShowCounter = true,
    bool ShowSpeed = true,
    bool ShowRunningHours = true,
    bool ShowHealth = true,
    bool ShowRealtimeValue = true);

public sealed record MachineMasterRequest(
    int? LegacyId,
    string MachineName,
    string MachineCode,
    string Line,
    string? Area,
    string? Department,
    string? MachineType,
    string? MachineImageUrl,
    string? StatusTag,
    string? CounterTag,
    string? SpeedTag,
    string? RunningHoursTag,
    string? RealtimeDashboardUrl,
    int DisplayOrder,
    string DisplayMode,
    bool IsActive,
    string Status,
    MachineCardConfiguration CardConfiguration,
    string? SourceTableName = null,
    string? SourceTimestampColumn = null,
    string? ParameterName = null,
    string? ParameterType = null,
    string? ParameterUnit = null,
    double? RunningThreshold = null,
    int StopTimeoutSeconds = 10,
    bool AcquisitionEnabled = false);

public sealed record MachineOrderRequest(IReadOnlyList<string> MachineIds);

public sealed record MachineDashboardItem(
    int? LegacyId,
    string MachineId,
    string MachineName,
    string MachineCode,
    string Line,
    string Area,
    string Department,
    string MachineType,
    string? MachineImageUrl,
    string Status,
    double? Counter,
    double? Speed,
    string CounterUnit,
    string SpeedUnit,
    string? ParameterName,
    string? ParameterType,
    string? ParameterUnit,
    double? ParameterValue,
    double? RunningHours,
    double? Health,
    string HealthStatus,
    string? RealtimeDashboardUrl,
    int DisplayOrder,
    string DisplayMode,
    bool IsActive,
    MachineCardConfiguration CardConfiguration,
    string ConnectionStatus,
    DateTimeOffset? SourceTimestamp,
    DateTimeOffset? RealtimeUpdatedAt,
    DateTimeOffset UpdatedAt);

public sealed record MachineDashboardSnapshot(
    IReadOnlyList<MachineDashboardItem> Machines,
    int Total,
    string Source,
    string ConnectionStatus,
    DateTimeOffset UpdatedAt);

sealed class MachineDashboardSource(
    StateStore stateStore,
    PostgreSqlDataSourceProvider postgreSql,
    MachineStatePersistence persistence,
    MachineImageStore imageStore,
    MachineRealtimeRegistry realtimeRegistry,
    ILogger<MachineDashboardSource> logger)
{
    private static readonly JsonSerializerOptions WebJson = new(JsonSerializerDefaults.Web);
    private readonly SemaphoreSlim _schemaGate = new(1, 1);
    private DateTimeOffset _nextSchemaCheck = DateTimeOffset.MinValue;
    private bool _applicationSchemaReady;

    public async Task<MachineDashboardSnapshot> GetSnapshotAsync(bool includeInactive, CancellationToken cancellationToken)
    {
        if (await ApplicationSchemaReadyAsync(cancellationToken))
        {
            try
            {
                return BuildSnapshot(await ReadPostgreSqlAsync(postgreSql, includeInactive, cancellationToken), "postgresql");
            }
            catch (Exception exception) when (exception is NpgsqlException or InvalidOperationException or PostgresException)
            {
                logger.LogWarning(exception, "Dynamic Machine Dashboard PostgreSQL source is unavailable; using synchronized state fallback.");
            }
        }

        return BuildSnapshot(await ReadStateAsync(includeInactive, cancellationToken), "state-store-fallback");
    }

    public async Task SaveOrderAsync(IReadOnlyList<string> machineIds, CancellationToken cancellationToken)
    {
        var order = machineIds.Select((id, index) => (id: id.Trim(), order: index + 1)).ToArray();
        await stateStore.UpdateAsync(state =>
        {
            foreach (var machine in state["machines"]?.AsArray().OfType<JsonObject>() ?? [])
            {
                var id = GetMachineId(machine);
                var match = order.FirstOrDefault(item => string.Equals(item.id, id, StringComparison.OrdinalIgnoreCase));
                if (match.id is not null) machine["display_order"] = match.order;
            }
            return true;
        }, cancellationToken);

        if (!await ApplicationSchemaReadyAsync(cancellationToken)) return;
        try
        {
            await using var connection = await postgreSql.OpenConnectionAsync(cancellationToken);
            await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
            foreach (var item in order)
            {
                await using var command = new NpgsqlCommand("UPDATE master_machine SET display_order = @display_order, updated_at = NOW() WHERE machine_id = @machine_id", connection, transaction);
                command.Parameters.AddWithValue("display_order", item.order);
                command.Parameters.AddWithValue("machine_id", item.id);
                await command.ExecuteNonQueryAsync(cancellationToken);
            }
            await transaction.CommitAsync(cancellationToken);
        }
        catch (Exception exception) when (exception is NpgsqlException or InvalidOperationException)
        {
            logger.LogWarning("Machine order remains saved in the durable state fallback because PostgreSQL application tables are unavailable: {Reason}", exception.Message);
        }
    }

    public async Task<MachineDashboardItem> SaveMasterAsync(string machineId, MachineMasterRequest request, CancellationToken cancellationToken)
    {
        machineId = machineId.Trim();
        string? oldImageUrl = null;
        await stateStore.UpdateAsync(state =>
        {
            var machines = state["machines"] as JsonArray ?? new JsonArray();
            state["machines"] = machines;
            var machine = machines.OfType<JsonObject>().FirstOrDefault(item =>
                string.Equals(GetMachineId(item), machineId, StringComparison.OrdinalIgnoreCase) ||
                (request.LegacyId is not null && ReadInt(item, "id") == request.LegacyId));
            if (machine is null)
            {
                machine = new JsonObject();
                machines.Add(machine);
            }
            oldImageUrl = ReadString(machine, "machine_image_url");
            var legacyId = request.LegacyId ?? machines.OfType<JsonObject>().Select(item => ReadInt(item, "id") ?? 0).DefaultIfEmpty().Max() + 1;
            machine["id"] = legacyId;
            machine["machine_id"] = machineId;
            machine["machine_code"] = request.MachineCode.Trim();
            machine["name"] = request.MachineName.Trim();
            machine["asset_number"] = request.MachineCode.Trim();
            machine["line_code"] = request.Line.Trim();
            machine["line"] = request.Line.Trim();
            machine["area"] = request.Area?.Trim() ?? string.Empty;
            machine["department"] = request.Department?.Trim() ?? string.Empty;
            machine["machine_type"] = request.MachineType?.Trim() ?? string.Empty;
            machine["machine_image_url"] = request.MachineImageUrl;
            machine["status_tag"] = request.StatusTag;
            machine["counter_tag"] = request.CounterTag;
            machine["speed_tag"] = request.SpeedTag;
            machine["running_hours_tag"] = request.RunningHoursTag;
            machine["source_table_name"] = MachineConfigurationStore.NormalizeTableName(request.SourceTableName);
            machine["source_timestamp_column"] = request.SourceTimestampColumn?.Trim() ?? "timestamp_zone";
            machine["parameter_name"] = request.ParameterName?.Trim();
            machine["parameter_type"] = request.ParameterType?.Trim().ToUpperInvariant();
            machine["parameter_unit"] = request.ParameterUnit?.Trim() ?? string.Empty;
            machine["running_threshold"] = request.RunningThreshold;
            machine["stop_timeout_seconds"] = Math.Clamp(request.StopTimeoutSeconds, 1, 3600);
            machine["acquisition_enabled"] = request.AcquisitionEnabled;
            machine["realtime_dashboard_url"] = request.RealtimeDashboardUrl;
            machine["display_order"] = request.DisplayOrder;
            machine["display_mode"] = request.DisplayMode.Trim().ToUpperInvariant();
            machine["is_active"] = request.IsActive;
            machine["status"] = MachineDashboardEndpoints.NormalizeStatus(request.Status);
            machine["card_config"] = JsonSerializer.SerializeToNode(request.CardConfiguration, WebJson);
            machine["updated_at"] = DateTimeOffset.UtcNow;
            if (!string.Equals(oldImageUrl, request.MachineImageUrl, StringComparison.Ordinal))
                machine["image_updated_at"] = DateTimeOffset.UtcNow;
            return true;
        }, cancellationToken);

        if (await ApplicationSchemaReadyAsync(cancellationToken))
        {
            try { await UpsertPostgreSqlAsync(postgreSql, machineId, request, cancellationToken); }
            catch (Exception exception) when (exception is NpgsqlException or InvalidOperationException)
            {
                logger.LogWarning("Master Machine remains saved in the durable state fallback because PostgreSQL application tables are unavailable: {Reason}", exception.Message);
            }
        }

        if (!string.IsNullOrWhiteSpace(oldImageUrl) && !string.Equals(oldImageUrl, request.MachineImageUrl, StringComparison.Ordinal))
            await imageStore.DeleteIfUnreferencedAsync(oldImageUrl, cancellationToken);

        var snapshot = await GetSnapshotAsync(true, cancellationToken);
        return snapshot.Machines.First(item => string.Equals(item.MachineId, machineId, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<bool> DeactivateAsync(string machineId, CancellationToken cancellationToken)
    {
        var found = await stateStore.UpdateAsync(state =>
        {
            var machine = state["machines"]?.AsArray().OfType<JsonObject>()
                .FirstOrDefault(item => string.Equals(GetMachineId(item), machineId, StringComparison.OrdinalIgnoreCase));
            if (machine is null) return false;
            machine["is_active"] = false;
            machine["updated_at"] = DateTimeOffset.UtcNow;
            return true;
        }, cancellationToken);

        if (await ApplicationSchemaReadyAsync(cancellationToken))
        {
            try
            {
                await using var connection = await postgreSql.OpenConnectionAsync(cancellationToken);
                await using var command = new NpgsqlCommand("UPDATE master_machine SET is_active = FALSE, updated_at = NOW() WHERE machine_id = @machine_id", connection);
                command.Parameters.AddWithValue("machine_id", machineId);
                found = await command.ExecuteNonQueryAsync(cancellationToken) > 0 || found;
            }
            catch (Exception exception) when (exception is NpgsqlException or InvalidOperationException)
            {
                logger.LogWarning("Machine deactivation remains saved in the durable state fallback because PostgreSQL application tables are unavailable: {Reason}", exception.Message);
            }
        }
        return found;
    }

    private async Task<bool> ApplicationSchemaReadyAsync(CancellationToken cancellationToken)
    {
        if (!postgreSql.IsConfigured) return false;
        if (DateTimeOffset.UtcNow < _nextSchemaCheck) return _applicationSchemaReady;
        await _schemaGate.WaitAsync(cancellationToken);
        try
        {
            if (DateTimeOffset.UtcNow < _nextSchemaCheck) return _applicationSchemaReady;
            try { _applicationSchemaReady = await persistence.HasApplicationSchemaAsync(cancellationToken); }
            catch (Exception exception) when (exception is NpgsqlException or InvalidOperationException)
            {
                _applicationSchemaReady = false;
                logger.LogWarning("PostgreSQL application schema check failed; using durable state fallback: {Reason}", exception.Message);
            }
            _nextSchemaCheck = DateTimeOffset.UtcNow.AddMinutes(1);
            return _applicationSchemaReady;
        }
        finally { _schemaGate.Release(); }
    }

    private MachineDashboardSnapshot BuildSnapshot(IEnumerable<MachineDashboardItem> items, string source)
    {
        var now = DateTimeOffset.UtcNow;
        var machines = items.Select(item => ApplyRealtime(item, now))
            .OrderBy(item => item.DisplayOrder)
            .ThenBy(item => item.MachineName, StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var connectionStatus = machines.Any(machine => machine.ConnectionStatus == "DATABASE OFFLINE")
            ? "OFFLINE"
            : machines.Any(machine => machine.ConnectionStatus == "REALTIME CONNECTED") ? "CONNECTED" : "UNAVAILABLE";
        return new MachineDashboardSnapshot(machines, machines.Length, source, connectionStatus, now);
    }

    private MachineDashboardItem ApplyRealtime(MachineDashboardItem item, DateTimeOffset now)
    {
        if (!realtimeRegistry.TryGet(item.MachineId, out var runtime)) return item;
        var value = runtime.CurrentValue is not null && double.IsFinite(runtime.CurrentValue.Value) ? runtime.CurrentValue : null;
        return item with
        {
            MachineName = runtime.MachineName,
            Status = MachineDashboardEndpoints.NormalizeStatus(runtime.DisplayStatus),
            Counter = runtime.ParameterType == MachineParameterType.Counter ? value : item.Counter,
            Speed = runtime.ParameterType == MachineParameterType.Speed ? value : item.Speed,
            CounterUnit = runtime.ParameterType == MachineParameterType.Counter ? runtime.ParameterUnit : item.CounterUnit,
            SpeedUnit = runtime.ParameterType == MachineParameterType.Speed ? runtime.ParameterUnit : item.SpeedUnit,
            ParameterName = runtime.ParameterName,
            ParameterType = runtime.ParameterType.ToString().ToUpperInvariant(),
            ParameterUnit = runtime.ParameterUnit,
            ParameterValue = value,
            RunningHours = runtime.RunningHoursAt(now),
            ConnectionStatus = runtime.ConnectionStatus,
            SourceTimestamp = runtime.SourceTimestamp,
            RealtimeUpdatedAt = runtime.LastUpdate
        };
    }

    private async Task<IReadOnlyList<MachineDashboardItem>> ReadStateAsync(bool includeInactive, CancellationToken cancellationToken)
    {
        var state = await stateStore.ReadAsync(cancellationToken);
        var machines = state["machines"]?.AsArray().OfType<JsonObject>().ToArray() ?? [];
        var parts = state["spare_parts"]?.AsArray().OfType<JsonObject>().ToArray() ?? [];
        var result = new List<MachineDashboardItem>(machines.Length);

        for (var index = 0; index < machines.Length; index++)
        {
            var machine = machines[index];
            var active = ReadBool(machine, "is_active") ?? true;
            if (!includeInactive && !active) continue;
            var legacyId = ReadInt(machine, "id");
            var healthValues = parts
                .Where(part => (ReadBool(part, "is_active") ?? true) && ReadInt(part, "machine_id") == legacyId)
                .Select(CalculateRemainingPercentage)
                .Where(value => value is not null)
                .Select(value => value!.Value)
                .ToArray();
            double? health = healthValues.Length == 0 ? null : Math.Round(healthValues.Average(), 1);
            var status = MachineDashboardEndpoints.NormalizeStatus(ReadString(machine, "telemetry_status", "status"));
            var updatedAt = ReadDateTime(machine, "updated_at", "last_updated") ?? DateTimeOffset.UtcNow;
            result.Add(new MachineDashboardItem(
                legacyId,
                GetMachineId(machine),
                ReadString(machine, "name", "machine_name") ?? "Mesin tanpa nama",
                ReadString(machine, "machine_code", "asset_number") ?? GetMachineId(machine),
                ReadString(machine, "line", "line_code") ?? "Tanpa Line",
                ReadString(machine, "area") ?? string.Empty,
                ReadString(machine, "department") ?? string.Empty,
                ReadString(machine, "machine_type") ?? string.Empty,
                ReadString(machine, "machine_image_url"),
                status,
                FiniteOrNull(ReadDouble(machine, "counter", "counter_product")),
                FiniteOrNull(ReadDouble(machine, "speed", "machine_speed")),
                ReadString(machine, "counter_unit") ?? "pcs",
                ReadString(machine, "speed_unit") ?? "unit/min",
                ReadString(machine, "parameter_name"),
                ReadString(machine, "parameter_type"),
                ReadString(machine, "parameter_unit"),
                FiniteOrNull(ReadDouble(machine, "parameter_value")),
                FiniteOrNull(ReadDouble(machine, "running_hours", "running_hours_total")),
                health,
                HealthStatus(health),
                ReadString(machine, "realtime_dashboard_url"),
                ReadInt(machine, "display_order") ?? index + 1,
                NormalizeDisplayMode(ReadString(machine, "display_mode")),
                active,
                ReadCardConfiguration(machine),
                ReadString(machine, "connection_status") ?? "DATA UNAVAILABLE",
                ReadDateTime(machine, "source_timestamp"),
                ReadDateTime(machine, "realtime_updated_at", "last_updated"),
                updatedAt));
        }
        return result;
    }

    private static async Task<IReadOnlyList<MachineDashboardItem>> ReadPostgreSqlAsync(PostgreSqlDataSourceProvider postgreSql, bool includeInactive, CancellationToken cancellationToken)
    {
        const string sql = """
            WITH spare_health AS (
                SELECT machine_id, AVG(GREATEST(0, LEAST(100, remaining_percentage))) AS health
                FROM spare_parts
                WHERE COALESCE(is_active, TRUE) = TRUE AND remaining_percentage IS NOT NULL
                GROUP BY machine_id
            )
            SELECT m.machine_id, m.legacy_id, m.machine_name, m.machine_code, m.line, m.area,
                   m.department, m.machine_type, m.machine_image_url,
                   COALESCE(r.status, m.status, 'DATA OFFLINE') AS status,
                   r.counter_value, r.speed_value, r.counter_unit, r.speed_unit,
                   r.parameter_name, r.parameter_type, r.parameter_unit, r.parameter_value,
                   r.running_hours, r.connection_status, r.source_timestamp,
                   h.health, m.realtime_dashboard_url, m.display_order, m.display_mode,
                   m.is_active, m.card_config, r.updated_at AS realtime_updated_at, m.updated_at
            FROM master_machine m
            LEFT JOIN machine_realtime r ON r.machine_id = m.machine_id
            LEFT JOIN spare_health h ON h.machine_id = m.machine_id
            WHERE (@include_inactive OR m.is_active = TRUE)
            ORDER BY m.display_order, m.machine_name;
            """;

        var result = new List<MachineDashboardItem>();
        await using var connection = await postgreSql.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("include_inactive", includeInactive);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var health = DbDouble(reader, "health");
            result.Add(new MachineDashboardItem(
                DbInt(reader, "legacy_id"),
                DbString(reader, "machine_id") ?? string.Empty,
                DbString(reader, "machine_name") ?? "Mesin tanpa nama",
                DbString(reader, "machine_code") ?? string.Empty,
                DbString(reader, "line") ?? "Tanpa Line",
                DbString(reader, "area") ?? string.Empty,
                DbString(reader, "department") ?? string.Empty,
                DbString(reader, "machine_type") ?? string.Empty,
                DbString(reader, "machine_image_url"),
                MachineDashboardEndpoints.NormalizeStatus(DbString(reader, "status")),
                FiniteOrNull(DbDouble(reader, "counter_value")),
                FiniteOrNull(DbDouble(reader, "speed_value")),
                DbString(reader, "counter_unit") ?? "pcs",
                DbString(reader, "speed_unit") ?? "unit/min",
                DbString(reader, "parameter_name"),
                DbString(reader, "parameter_type"),
                DbString(reader, "parameter_unit"),
                FiniteOrNull(DbDouble(reader, "parameter_value")),
                FiniteOrNull(DbDouble(reader, "running_hours")),
                health,
                HealthStatus(health),
                DbString(reader, "realtime_dashboard_url"),
                DbInt(reader, "display_order") ?? 0,
                NormalizeDisplayMode(DbString(reader, "display_mode")),
                DbBool(reader, "is_active") ?? true,
                ParseCardConfiguration(DbString(reader, "card_config")),
                DbString(reader, "connection_status") ?? "DATA UNAVAILABLE",
                DbDateTime(reader, "source_timestamp"),
                DbDateTime(reader, "realtime_updated_at"),
                DbDateTime(reader, "updated_at") ?? DateTimeOffset.UtcNow));
        }
        return result;
    }

    private static async Task UpsertPostgreSqlAsync(PostgreSqlDataSourceProvider postgreSql, string machineId, MachineMasterRequest request, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO master_machine
                (machine_id, legacy_id, machine_name, machine_code, line, area, department, machine_type,
                 machine_image_url, status_tag, counter_tag, speed_tag, running_hours_tag,
                 source_table_name, source_timestamp_column, parameter_name, parameter_type,
                 parameter_unit, running_threshold, stop_timeout_seconds, acquisition_enabled,
                 realtime_dashboard_url, display_order, display_mode, is_active, status, card_config,
                 created_at, updated_at, image_updated_at)
            VALUES
                (@machine_id, @legacy_id, @machine_name, @machine_code, @line, @area, @department, @machine_type,
                 @image_url, @status_tag, @counter_tag, @speed_tag, @running_hours_tag,
                 @source_table_name, @source_timestamp_column, @parameter_name, @parameter_type,
                 @parameter_unit, @running_threshold, @stop_timeout_seconds, @acquisition_enabled,
                 @dashboard_url, @display_order, @display_mode, @is_active, @status, CAST(@card_config AS jsonb),
                 NOW(), NOW(), NOW())
            ON CONFLICT (machine_id) DO UPDATE SET
                legacy_id = EXCLUDED.legacy_id, machine_name = EXCLUDED.machine_name,
                machine_code = EXCLUDED.machine_code, line = EXCLUDED.line, area = EXCLUDED.area,
                department = EXCLUDED.department, machine_type = EXCLUDED.machine_type,
                machine_image_url = EXCLUDED.machine_image_url, status_tag = EXCLUDED.status_tag,
                counter_tag = EXCLUDED.counter_tag, speed_tag = EXCLUDED.speed_tag,
                running_hours_tag = EXCLUDED.running_hours_tag,
                source_table_name = EXCLUDED.source_table_name,
                source_timestamp_column = EXCLUDED.source_timestamp_column,
                parameter_name = EXCLUDED.parameter_name,
                parameter_type = EXCLUDED.parameter_type,
                parameter_unit = EXCLUDED.parameter_unit,
                running_threshold = EXCLUDED.running_threshold,
                stop_timeout_seconds = EXCLUDED.stop_timeout_seconds,
                acquisition_enabled = EXCLUDED.acquisition_enabled,
                realtime_dashboard_url = EXCLUDED.realtime_dashboard_url,
                display_order = EXCLUDED.display_order, display_mode = EXCLUDED.display_mode,
                is_active = EXCLUDED.is_active, status = EXCLUDED.status,
                card_config = EXCLUDED.card_config, updated_at = NOW(),
                image_updated_at = CASE WHEN master_machine.machine_image_url IS DISTINCT FROM EXCLUDED.machine_image_url THEN NOW() ELSE master_machine.image_updated_at END;
            """;
        await using var connection = await postgreSql.OpenConnectionAsync(cancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("machine_id", machineId);
        command.Parameters.AddWithValue("legacy_id", (object?)request.LegacyId ?? DBNull.Value);
        command.Parameters.AddWithValue("machine_name", request.MachineName.Trim());
        command.Parameters.AddWithValue("machine_code", request.MachineCode.Trim());
        command.Parameters.AddWithValue("line", request.Line.Trim());
        command.Parameters.AddWithValue("area", request.Area?.Trim() ?? string.Empty);
        command.Parameters.AddWithValue("department", request.Department?.Trim() ?? string.Empty);
        command.Parameters.AddWithValue("machine_type", request.MachineType?.Trim() ?? string.Empty);
        command.Parameters.AddWithValue("image_url", (object?)request.MachineImageUrl ?? DBNull.Value);
        command.Parameters.AddWithValue("status_tag", (object?)request.StatusTag ?? DBNull.Value);
        command.Parameters.AddWithValue("counter_tag", (object?)request.CounterTag ?? DBNull.Value);
        command.Parameters.AddWithValue("speed_tag", (object?)request.SpeedTag ?? DBNull.Value);
        command.Parameters.AddWithValue("running_hours_tag", (object?)request.RunningHoursTag ?? DBNull.Value);
        command.Parameters.AddWithValue("source_table_name", (object?)MachineConfigurationStore.NormalizeTableName(request.SourceTableName) ?? DBNull.Value);
        command.Parameters.AddWithValue("source_timestamp_column", (object?)request.SourceTimestampColumn?.Trim() ?? "timestamp_zone");
        command.Parameters.AddWithValue("parameter_name", (object?)request.ParameterName?.Trim() ?? DBNull.Value);
        command.Parameters.AddWithValue("parameter_type", (object?)request.ParameterType?.Trim().ToUpperInvariant() ?? DBNull.Value);
        command.Parameters.AddWithValue("parameter_unit", request.ParameterUnit?.Trim() ?? string.Empty);
        command.Parameters.AddWithValue("running_threshold", (object?)request.RunningThreshold ?? DBNull.Value);
        command.Parameters.AddWithValue("stop_timeout_seconds", Math.Clamp(request.StopTimeoutSeconds, 1, 3600));
        command.Parameters.AddWithValue("acquisition_enabled", request.AcquisitionEnabled);
        command.Parameters.AddWithValue("dashboard_url", (object?)request.RealtimeDashboardUrl ?? DBNull.Value);
        command.Parameters.AddWithValue("display_order", request.DisplayOrder);
        command.Parameters.AddWithValue("display_mode", request.DisplayMode.Trim().ToUpperInvariant());
        command.Parameters.AddWithValue("is_active", request.IsActive);
        command.Parameters.AddWithValue("status", MachineDashboardEndpoints.NormalizeStatus(request.Status));
        command.Parameters.AddWithValue("card_config", JsonSerializer.Serialize(request.CardConfiguration, WebJson));
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static string GetMachineId(JsonObject machine)
    {
        var value = ReadString(machine, "machine_id", "machine_code", "asset_number");
        if (!string.IsNullOrWhiteSpace(value)) return value.Trim();
        return $"MACHINE-{ReadInt(machine, "id") ?? 0:000}";
    }

    private static double? CalculateRemainingPercentage(JsonObject part)
    {
        var explicitValue = ReadDouble(part, "remaining_percentage", "remaining_life_pct");
        if (explicitValue is not null) return Math.Clamp(explicitValue.Value, 0, 100);
        var lifetime = ReadDouble(part, "lifetime_hours");
        if (lifetime is null || lifetime <= 0) return null;
        var current = ReadDouble(part, "current_running_hours") ?? 0;
        return Math.Clamp((lifetime.Value - current) / lifetime.Value * 100, 0, 100);
    }

    private static string HealthStatus(double? health) => health switch
    {
        null => "N/A",
        >= 90 => "HEALTHY",
        >= 75 => "GOOD",
        >= 50 => "WARNING",
        _ => "CRITICAL"
    };

    private static string NormalizeDisplayMode(string? value)
    {
        var normalized = value?.Trim().ToUpperInvariant() ?? "AUTO";
        return MachineDashboardEndpoints.DisplayModes.Contains(normalized) ? normalized : "AUTO";
    }

    private static MachineCardConfiguration ReadCardConfiguration(JsonObject machine)
    {
        if (machine["card_config"] is JsonObject config)
            return ParseCardConfiguration(config.ToJsonString());
        return new MachineCardConfiguration(
            ReadBool(machine, "show_image") ?? true,
            ReadBool(machine, "show_machine_name") ?? true,
            ReadBool(machine, "show_machine_code") ?? true,
            ReadBool(machine, "show_line") ?? true,
            ReadBool(machine, "show_area") ?? true,
            ReadBool(machine, "show_status") ?? true,
            ReadBool(machine, "show_counter") ?? true,
            ReadBool(machine, "show_speed") ?? true,
            ReadBool(machine, "show_running_hours") ?? true,
            ReadBool(machine, "show_health") ?? true);
    }

    private static MachineCardConfiguration ParseCardConfiguration(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return new MachineCardConfiguration();
        try { return JsonSerializer.Deserialize<MachineCardConfiguration>(value, WebJson) ?? new MachineCardConfiguration(); }
        catch (JsonException) { return new MachineCardConfiguration(); }
    }

    private static double? FiniteOrNull(double? value) => value is not null && double.IsFinite(value.Value) ? value : null;
    private static string? ReadString(JsonObject source, params string[] names)
    {
        foreach (var name in names)
            if (source[name] is JsonValue value && value.TryGetValue<string>(out var result) && !string.IsNullOrWhiteSpace(result)) return result;
        return null;
    }
    private static int? ReadInt(JsonObject source, string name)
    {
        if (source[name] is not JsonValue value) return null;
        if (value.TryGetValue<int>(out var result)) return result;
        return int.TryParse(value.ToString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out result) ? result : null;
    }
    private static bool? ReadBool(JsonObject source, string name)
    {
        if (source[name] is not JsonValue value) return null;
        if (value.TryGetValue<bool>(out var result)) return result;
        return bool.TryParse(value.ToString(), out result) ? result : null;
    }
    private static double? ReadDouble(JsonObject source, params string[] names)
    {
        foreach (var name in names)
        {
            if (source[name] is not JsonValue value) continue;
            if (value.TryGetValue<double>(out var result)) return result;
            if (double.TryParse(value.ToString(), NumberStyles.Float, CultureInfo.InvariantCulture, out result)) return result;
        }
        return null;
    }
    private static DateTimeOffset? ReadDateTime(JsonObject source, params string[] names)
    {
        foreach (var name in names)
            if (source[name] is JsonValue value && DateTimeOffset.TryParse(value.ToString(), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var result)) return result;
        return null;
    }
    private static int Ordinal(NpgsqlDataReader reader, string name) => reader.GetOrdinal(name);
    private static string? DbString(NpgsqlDataReader reader, string name) { var i = Ordinal(reader, name); return reader.IsDBNull(i) ? null : Convert.ToString(reader.GetValue(i), CultureInfo.InvariantCulture); }
    private static int? DbInt(NpgsqlDataReader reader, string name) { var i = Ordinal(reader, name); return reader.IsDBNull(i) ? null : Convert.ToInt32(reader.GetValue(i), CultureInfo.InvariantCulture); }
    private static double? DbDouble(NpgsqlDataReader reader, string name) { var i = Ordinal(reader, name); return reader.IsDBNull(i) ? null : Convert.ToDouble(reader.GetValue(i), CultureInfo.InvariantCulture); }
    private static bool? DbBool(NpgsqlDataReader reader, string name) { var i = Ordinal(reader, name); return reader.IsDBNull(i) ? null : Convert.ToBoolean(reader.GetValue(i), CultureInfo.InvariantCulture); }
    private static DateTimeOffset? DbDateTime(NpgsqlDataReader reader, string name)
    {
        var i = Ordinal(reader, name);
        if (reader.IsDBNull(i)) return null;
        return reader.GetValue(i) switch
        {
            DateTimeOffset value => value,
            DateTime value => new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Utc)),
            var value when DateTimeOffset.TryParse(Convert.ToString(value, CultureInfo.InvariantCulture), out var parsed) => parsed,
            _ => null
        };
    }
}

sealed class MachineDashboardHub
{
    private readonly ConcurrentDictionary<Guid, WebSocket> _connections = new();
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    public Guid Register(WebSocket socket) { var id = Guid.NewGuid(); _connections[id] = socket; return id; }
    public void Unregister(Guid id) => _connections.TryRemove(id, out _);
    public Task SendAsync(WebSocket socket, MachineDashboardSnapshot snapshot, CancellationToken cancellationToken) => SendPayloadAsync(socket, snapshot, cancellationToken);
    public async Task BroadcastAsync(MachineDashboardSnapshot snapshot, CancellationToken cancellationToken)
    {
        foreach (var (id, socket) in _connections.ToArray())
        {
            try { await SendPayloadAsync(socket, snapshot, cancellationToken); }
            catch (Exception exception) when (exception is WebSocketException or OperationCanceledException) { Unregister(id); }
        }
    }
    private static async Task SendPayloadAsync(WebSocket socket, MachineDashboardSnapshot snapshot, CancellationToken cancellationToken)
    {
        if (socket.State != WebSocketState.Open) return;
        var payload = JsonSerializer.SerializeToUtf8Bytes(new { type = "machine-dashboard", data = snapshot }, JsonOptions);
        await socket.SendAsync(payload, WebSocketMessageType.Text, true, cancellationToken);
    }
}

sealed class MachineDashboardMonitor(
    MachineDashboardSource source,
    MachineDashboardHub hub,
    IConfiguration configuration,
    ILogger<MachineDashboardMonitor> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromSeconds(Math.Clamp(configuration.GetValue("MachineDashboard:RealtimeIntervalSeconds", 2), 1, 30));
        string? previous = null;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var snapshot = await source.GetSnapshotAsync(false, stoppingToken);
                var fingerprint = string.Join('|', snapshot.Machines.Select(machine =>
                    $"{machine.MachineId}:{machine.Status}:{machine.Counter}:{machine.Speed}:{machine.RunningHours}:{machine.Health}:{machine.DisplayOrder}:{machine.UpdatedAt:O}"));
                if (!string.Equals(previous, fingerprint, StringComparison.Ordinal))
                {
                    previous = fingerprint;
                    await hub.BroadcastAsync(snapshot, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception exception) { logger.LogError(exception, "Machine Dashboard realtime monitor failed; retrying next cycle."); }
            await Task.Delay(interval, stoppingToken);
        }
    }
}

sealed class MachineImageStore(IWebHostEnvironment environment, StateStore stateStore, IConfiguration configuration)
{
    private readonly string _root = Path.Combine(environment.ContentRootPath, "data", "uploads", "machines");
    private static readonly HashSet<string> AllowedExtensions = [".png", ".jpg", ".jpeg"];
    private static readonly HashSet<string> AllowedMimeTypes = ["image/png", "image/jpeg"];

    public async Task<(string? Url, string? Error, int StatusCode)> SaveAsync(HttpRequest request, CancellationToken cancellationToken)
    {
        if (!request.HasFormContentType) return (null, "Gunakan multipart/form-data untuk upload gambar.", StatusCodes.Status415UnsupportedMediaType);
        var form = await request.ReadFormAsync(cancellationToken);
        var file = form.Files.GetFile("file");
        var machineId = form["machineId"].FirstOrDefault();
        if (file is null || file.Length == 0) return (null, "Pilih file PNG, JPG, atau JPEG.", StatusCodes.Status400BadRequest);
        if (string.IsNullOrWhiteSpace(machineId)) return (null, "Machine ID wajib dikirim bersama gambar.", StatusCodes.Status400BadRequest);
        var maxBytes = Math.Clamp(configuration.GetValue("MachineDashboard:MaxImageMegabytes", 5), 1, 20) * 1024L * 1024L;
        if (file.Length > maxBytes) return (null, $"Ukuran gambar maksimal {maxBytes / 1024 / 1024} MB.", StatusCodes.Status413PayloadTooLarge);
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension) || !AllowedMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
            return (null, "Format tidak valid. Hanya PNG, JPG, dan JPEG yang diperbolehkan.", StatusCodes.Status415UnsupportedMediaType);

        try
        {
            await using var source = file.OpenReadStream();
            using var image = await Image.LoadAsync(source, cancellationToken);
            var decodedIsPng = image.Metadata.DecodedImageFormat?.Name.Equals("PNG", StringComparison.OrdinalIgnoreCase) == true;
            var decodedIsJpeg = image.Metadata.DecodedImageFormat?.Name.Equals("JPEG", StringComparison.OrdinalIgnoreCase) == true;
            if ((!decodedIsPng && !decodedIsJpeg) || (file.ContentType == "image/png" && !decodedIsPng) || (file.ContentType == "image/jpeg" && !decodedIsJpeg))
                return (null, "Isi file tidak sesuai dengan MIME type PNG/JPEG.", StatusCodes.Status415UnsupportedMediaType);

            image.Mutate(context => context.AutoOrient());
            image.Metadata.ExifProfile = null;
            image.Metadata.IccProfile = null;
            image.Metadata.XmpProfile = null;
            if (image.Width > 1600 || image.Height > 1200)
                image.Mutate(context => context.Resize(new ResizeOptions { Mode = ResizeMode.Max, Size = new Size(1600, 1200) }));

            Directory.CreateDirectory(_root);
            var safeMachineId = string.Concat(machineId.Where(character => char.IsAsciiLetterOrDigit(character) || character is '-' or '_')).Trim('-');
            if (string.IsNullOrWhiteSpace(safeMachineId)) safeMachineId = "machine";
            if (safeMachineId.Length > 60) safeMachineId = safeMachineId[..60];
            var outputExtension = decodedIsPng ? ".png" : ".jpg";
            var fileName = $"{safeMachineId}-{Guid.NewGuid():N}{outputExtension}";
            var path = Path.Combine(_root, fileName);
            if (decodedIsPng)
                await image.SaveAsync(path, new PngEncoder(), cancellationToken);
            else
                await image.SaveAsync(path, new JpegEncoder { Quality = 84 }, cancellationToken);
            return ($"/api/machines/images/files/{fileName}", null, StatusCodes.Status200OK);
        }
        catch (UnknownImageFormatException)
        {
            return (null, "File tidak dapat dikenali sebagai PNG atau JPEG yang valid.", StatusCodes.Status415UnsupportedMediaType);
        }
        catch (InvalidImageContentException)
        {
            return (null, "Isi gambar rusak atau tidak valid.", StatusCodes.Status415UnsupportedMediaType);
        }
    }

    public Task<(Stream Stream, string ContentType)?> OpenReadAsync(string fileName, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (string.IsNullOrWhiteSpace(fileName) || Path.GetFileName(fileName) != fileName || fileName.Contains("..", StringComparison.Ordinal))
            return Task.FromResult<(Stream, string)?>(null);
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension)) return Task.FromResult<(Stream, string)?>(null);
        var path = Path.Combine(_root, fileName);
        if (!File.Exists(path)) return Task.FromResult<(Stream, string)?>(null);
        return Task.FromResult<(Stream, string)?>(new(File.OpenRead(path), extension == ".png" ? "image/png" : "image/jpeg"));
    }

    public async Task DeleteIfUnreferencedAsync(string imageUrl, CancellationToken cancellationToken)
    {
        const string prefix = "/api/machines/images/files/";
        if (!imageUrl.StartsWith(prefix, StringComparison.Ordinal)) return;
        var state = await stateStore.ReadAsync(cancellationToken);
        var referenced = state["machines"]?.AsArray().OfType<JsonObject>().Any(machine =>
            string.Equals(machine["machine_image_url"]?.GetValue<string>(), imageUrl, StringComparison.Ordinal)) == true;
        if (referenced) return;
        var fileName = imageUrl[prefix.Length..];
        if (Path.GetFileName(fileName) != fileName) return;
        var path = Path.GetFullPath(Path.Combine(_root, fileName));
        var root = Path.GetFullPath(_root) + Path.DirectorySeparatorChar;
        if (path.StartsWith(root, StringComparison.OrdinalIgnoreCase) && File.Exists(path)) File.Delete(path);
    }
}
