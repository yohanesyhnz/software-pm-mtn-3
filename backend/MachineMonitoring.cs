using System.Collections.Concurrent;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using Npgsql;

public enum MachineParameterType
{
    Counter,
    Speed,
    Weight
}

public sealed record MachineAcquisitionConfiguration(
    string MachineId,
    int? LegacyId,
    string MachineName,
    string SourceTableName,
    string SourceTimestampColumn,
    string ParameterName,
    MachineParameterType ParameterType,
    string ParameterUnit,
    double RunningThreshold,
    int StopTimeoutSeconds,
    bool IsEnabled);

public sealed record MachineRuntimeState
{
    public required string MachineId { get; init; }
    public required string MachineName { get; init; }
    public required string ParameterName { get; init; }
    public required MachineParameterType ParameterType { get; init; }
    public string ParameterUnit { get; init; } = string.Empty;
    public double? CurrentValue { get; init; }
    public double? PreviousValue { get; init; }
    public DateTimeOffset? LastChangeTime { get; init; }
    public string OperationalStatus { get; init; } = "DATA UNAVAILABLE";
    public DateTimeOffset? RunningStartedAt { get; init; }
    public double TotalRunningSeconds { get; init; }
    public DateTimeOffset? StopCandidateStartedAt { get; init; }
    public DateTimeOffset? SourceTimestamp { get; init; }
    public DateTimeOffset LastUpdate { get; init; } = DateTimeOffset.UtcNow;
    public string ConnectionStatus { get; init; } = "DATA UNAVAILABLE";

    public string DisplayStatus => ConnectionStatus switch
    {
        "DATABASE OFFLINE" => "DATABASE OFFLINE",
        "DATA UNAVAILABLE" => "DATA UNAVAILABLE",
        _ => OperationalStatus
    };

    public double RunningHoursAt(DateTimeOffset now)
    {
        var seconds = TotalRunningSeconds;
        if (ConnectionStatus == "REALTIME CONNECTED" && OperationalStatus == "RUNNING" && RunningStartedAt is not null)
            seconds += Math.Max(0, (now - RunningStartedAt.Value).TotalSeconds);
        return Math.Max(0, seconds) / 3600d;
    }
}

public sealed record MachineStatusEvaluation(
    MachineRuntimeState State,
    bool StatusChanged,
    string? CounterEvent);

public sealed class MachineStatusEngine
{
    public MachineStatusEvaluation Evaluate(
        MachineAcquisitionConfiguration configuration,
        MachineRuntimeState previous,
        double currentValue,
        DateTimeOffset sourceTimestamp,
        DateTimeOffset observedAt)
    {
        if (!double.IsFinite(currentValue))
            return new(previous with { ConnectionStatus = "DATA UNAVAILABLE", LastUpdate = observedAt }, false, null);

        if (previous.SourceTimestamp == sourceTimestamp && previous.CurrentValue == currentValue)
        {
            return new(previous with
            {
                ConnectionStatus = "REALTIME CONNECTED",
                LastUpdate = observedAt
            }, false, null);
        }

        var status = previous.OperationalStatus;
        var lastChange = previous.LastChangeTime;
        var stopCandidate = previous.StopCandidateStartedAt;
        string? counterEvent = null;
        var priorValue = previous.CurrentValue;

        switch (configuration.ParameterType)
        {
            case MachineParameterType.Counter:
                if (priorValue is null)
                {
                    lastChange = sourceTimestamp;
                    stopCandidate = sourceTimestamp;
                }
                else if (currentValue > priorValue.Value)
                {
                    status = "RUNNING";
                    lastChange = sourceTimestamp;
                    stopCandidate = null;
                }
                else if (currentValue < priorValue.Value)
                {
                    counterEvent = "COUNTER_RESET";
                    lastChange = sourceTimestamp;
                    stopCandidate = sourceTimestamp;
                }
                else
                {
                    stopCandidate ??= lastChange ?? sourceTimestamp;
                    if ((sourceTimestamp - stopCandidate.Value).TotalSeconds >= configuration.StopTimeoutSeconds)
                        status = "STOPPED";
                }
                break;

            case MachineParameterType.Speed:
                if (currentValue > configuration.RunningThreshold)
                {
                    status = "RUNNING";
                    lastChange = sourceTimestamp;
                    stopCandidate = null;
                }
                else
                {
                    stopCandidate ??= sourceTimestamp;
                    if ((sourceTimestamp - stopCandidate.Value).TotalSeconds >= configuration.StopTimeoutSeconds)
                        status = "STOPPED";
                }
                break;

            case MachineParameterType.Weight:
                status = currentValue > configuration.RunningThreshold ? "RUNNING" : "STOPPED";
                lastChange = status == previous.OperationalStatus ? previous.LastChangeTime : sourceTimestamp;
                stopCandidate = status == "STOPPED" ? sourceTimestamp : null;
                break;
        }

        var totalSeconds = previous.TotalRunningSeconds;
        var runningStartedAt = previous.RunningStartedAt;
        var operationalChanged = status != previous.OperationalStatus && status is "RUNNING" or "STOPPED";
        if (operationalChanged)
        {
            if (previous.OperationalStatus == "RUNNING" && runningStartedAt is not null)
                totalSeconds += Math.Max(0, (sourceTimestamp - runningStartedAt.Value).TotalSeconds);
            runningStartedAt = status == "RUNNING" ? sourceTimestamp : null;
        }

        var next = previous with
        {
            MachineName = configuration.MachineName,
            ParameterName = configuration.ParameterName,
            ParameterType = configuration.ParameterType,
            ParameterUnit = configuration.ParameterUnit,
            PreviousValue = priorValue,
            CurrentValue = currentValue,
            LastChangeTime = lastChange,
            OperationalStatus = status,
            RunningStartedAt = runningStartedAt,
            TotalRunningSeconds = totalSeconds,
            StopCandidateStartedAt = stopCandidate,
            SourceTimestamp = sourceTimestamp,
            LastUpdate = observedAt,
            ConnectionStatus = "REALTIME CONNECTED"
        };
        return new(next, operationalChanged, counterEvent);
    }
}

sealed class PostgreSqlDataSourceProvider : IAsyncDisposable
{
    private readonly NpgsqlDataSource? _dataSource;

    public PostgreSqlDataSourceProvider(IConfiguration configuration)
    {
        var host = Environment.GetEnvironmentVariable("POSTGRES_HOST");
        var portText = Environment.GetEnvironmentVariable("POSTGRES_PORT");
        var database = Environment.GetEnvironmentVariable("POSTGRES_DATABASE");
        var username = Environment.GetEnvironmentVariable("POSTGRES_USER");
        var password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD");
        string? connectionString = null;

        if (!string.IsNullOrWhiteSpace(host) &&
            int.TryParse(portText, NumberStyles.Integer, CultureInfo.InvariantCulture, out var port) &&
            !string.IsNullOrWhiteSpace(database) &&
            !string.IsNullOrWhiteSpace(username) &&
            !string.IsNullOrWhiteSpace(password))
        {
            connectionString = new NpgsqlConnectionStringBuilder
            {
                Host = host,
                Port = port,
                Database = database,
                Username = username,
                Password = password,
                Pooling = true,
                MinPoolSize = 1,
                MaxPoolSize = Math.Clamp(configuration.GetValue("MachineMonitoring:PostgreSqlPoolSize", 8), 2, 50),
                Timeout = 5,
                CommandTimeout = 10,
                ApplicationName = "PredictaCoreMachineMonitoring"
            }.ConnectionString;
        }
        else
        {
            connectionString = configuration.GetConnectionString("PostgreSQL");
        }

        if (!string.IsNullOrWhiteSpace(connectionString))
            _dataSource = NpgsqlDataSource.Create(connectionString);
    }

    public bool IsConfigured => _dataSource is not null;

    public async ValueTask<NpgsqlConnection> OpenConnectionAsync(CancellationToken cancellationToken)
    {
        if (_dataSource is null) throw new InvalidOperationException("PostgreSQL backend environment is not configured.");
        return await _dataSource.OpenConnectionAsync(cancellationToken);
    }

    public async ValueTask DisposeAsync()
    {
        if (_dataSource is not null) await _dataSource.DisposeAsync();
    }
}

sealed class MachineRealtimeRegistry
{
    private readonly ConcurrentDictionary<string, MachineRuntimeState> _states = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<int, string> _legacyAliases = new();

    public MachineRuntimeState GetOrCreate(MachineAcquisitionConfiguration configuration)
    {
        if (configuration.LegacyId is not null)
            _legacyAliases[configuration.LegacyId.Value] = configuration.MachineId;

        return _states.GetOrAdd(configuration.MachineId, _ => new MachineRuntimeState
        {
            MachineId = configuration.MachineId,
            MachineName = configuration.MachineName,
            ParameterName = configuration.ParameterName,
            ParameterType = configuration.ParameterType,
            ParameterUnit = configuration.ParameterUnit
        });
    }

    public void Set(MachineRuntimeState state) => _states[state.MachineId] = state;

    public bool TryGet(string machineId, out MachineRuntimeState state) => _states.TryGetValue(machineId, out state!);

    public bool TryGet(string machineId, int? legacyId, out MachineRuntimeState state)
    {
        if (TryGet(machineId, out state)) return true;
        return legacyId is not null &&
            _legacyAliases.TryGetValue(legacyId.Value, out var runtimeMachineId) &&
            TryGet(runtimeMachineId, out state);
    }

    public IReadOnlyList<MachineRuntimeState> Snapshot() => _states.Values.OrderBy(state => state.MachineId, StringComparer.OrdinalIgnoreCase).ToArray();

    public void MarkUnavailable(MachineAcquisitionConfiguration configuration, string connectionStatus, DateTimeOffset now)
    {
        var previous = GetOrCreate(configuration);
        Set(previous with
        {
            MachineName = configuration.MachineName,
            ParameterName = configuration.ParameterName,
            ParameterType = configuration.ParameterType,
            ParameterUnit = configuration.ParameterUnit,
            ConnectionStatus = connectionStatus,
            LastUpdate = now
        });
    }
}

sealed class MachineConfigurationStore(StateStore stateStore)
{
    private static readonly MachineAcquisitionConfiguration[] Defaults =
    [
        Default("WASHING_RRU_A", 17, "WASHING RRU_A", "ILE7_D0710_BOSCH_RRU_3085_01_A", "counting_product", MachineParameterType.Counter, "pcs", 0, 10),
        Default("TUNNEL_HQL_A", 15, "TUNNEL HQL_A", "ILE7_D0710_BOSCH_RRU_3085_01_A", "velocity_belt", MachineParameterType.Speed, "", 0, 10),
        Default("WASHING_RRU_B", 18, "WASHING RRU_B", "ILE7_D0710_BOSCH_RRU_3085_01_B", "counting_product", MachineParameterType.Counter, "pcs", 0, 10),
        Default("TUNNEL_HQL_B", 16, "TUNNEL HQL_B", "ILE7_D0710_BOSCH_RRU_3085_01_B", "velocity_belt", MachineParameterType.Speed, "", 0, 10),
        Default("FILLING_ALF_A", 19, "FILLING ALF_A", "ILE7_D0703_BOSCH_ALF_4080_01_A", "counting_product", MachineParameterType.Counter, "pcs", 0, 10),
        Default("FILLING_ALF_B", 20, "FILLING ALF_B", "ILE7_D0703_BOSCH_ALF_4080_01_B", "counting_product", MachineParameterType.Counter, "pcs", 0, 10),
        Default("MIXING_AR_TK101_A", 22, "MIXING AR/TK101_A", "ILE7_MIXING_AUSTAR_A", "bobot_actual", MachineParameterType.Weight, "kg", 1, 10),
        Default("MIXING_AR_TK101_B", 23, "MIXING AR/TK101_B", "ILE7_MIXING_AUSTAR_B", "bobot_actual", MachineParameterType.Weight, "kg", 1, 10),
        Default("LABELING_RE400_A", 1, "LABELING RE-400_A", "ILE7_LABELLING_ROTA_A", "infeed_counter", MachineParameterType.Counter, "pcs", 0, 10),
        Default("LABELING_RE400_B", 2, "LABELING RE-400_B", "ILE7_LABELLING_ROTA_B", "infeed_counter", MachineParameterType.Counter, "pcs", 0, 10)
    ];

    public async Task EnsureDefaultsAsync(CancellationToken cancellationToken)
    {
        await stateStore.UpdateAsync(state =>
        {
            var machines = state["machines"] as JsonArray ?? new JsonArray();
            state["machines"] = machines;
            state["machine_realtime_state"] ??= new JsonObject();
            state["machine_status_history"] ??= new JsonArray();
            state["machine_events"] ??= new JsonArray();

            foreach (var configuration in Defaults)
            {
                var machine = machines.OfType<JsonObject>().FirstOrDefault(item =>
                    ReadInt(item, "id") == configuration.LegacyId ||
                    string.Equals(ReadString(item, "machine_id"), configuration.MachineId, StringComparison.OrdinalIgnoreCase));
                if (machine is null)
                {
                    machine = new JsonObject
                    {
                        ["id"] = configuration.LegacyId,
                        ["asset_number"] = configuration.MachineId,
                        ["line_code"] = "LINE 07",
                        ["manufacturer"] = "",
                        ["install_date"] = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                        ["status"] = "DATA UNAVAILABLE",
                        ["display_order"] = machines.Count + 1,
                        ["is_active"] = true
                    };
                    machines.Add(machine);
                }

                var firstConfiguration = string.IsNullOrWhiteSpace(ReadString(machine, "source_table_name"));
                machine["machine_id"] = configuration.MachineId;
                if (firstConfiguration)
                {
                    machine["name"] = configuration.MachineName;
                    machine["machine_code"] = configuration.MachineId;
                    machine["area"] = AreaFor(configuration.ParameterType);
                }
                machine["source_table_name"] ??= configuration.SourceTableName;
                machine["source_timestamp_column"] ??= configuration.SourceTimestampColumn;
                machine["parameter_name"] ??= configuration.ParameterName;
                machine["parameter_type"] ??= configuration.ParameterType.ToString().ToUpperInvariant();
                machine["parameter_unit"] ??= configuration.ParameterUnit;
                machine["running_threshold"] ??= configuration.RunningThreshold;
                machine["stop_timeout_seconds"] ??= configuration.StopTimeoutSeconds;
                machine["acquisition_enabled"] ??= true;
            }
            return true;
        }, cancellationToken);
    }

    public async Task<IReadOnlyList<MachineAcquisitionConfiguration>> LoadAsync(CancellationToken cancellationToken)
    {
        var state = await stateStore.ReadAsync(cancellationToken);
        var machines = state["machines"]?.AsArray().OfType<JsonObject>().ToArray() ?? [];
        var result = new List<MachineAcquisitionConfiguration>(machines.Length + Defaults.Length);
        var defaultLegacyIds = Defaults.Where(item => item.LegacyId is not null).Select(item => item.LegacyId!.Value).ToHashSet();
        var defaultMachineIds = Defaults.Select(item => item.MachineId).ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var fallback in Defaults)
        {
            var machine = machines.FirstOrDefault(item =>
                ReadInt(item, "id") == fallback.LegacyId ||
                string.Equals(ReadString(item, "machine_id"), fallback.MachineId, StringComparison.OrdinalIgnoreCase));
            var configured = machine is null ? null : Parse(machine);
            var enabled = machine is null ? fallback.IsEnabled : ReadBool(machine, "acquisition_enabled") ?? fallback.IsEnabled;
            var merged = configured is null
                ? fallback with { IsEnabled = enabled }
                : configured with
                {
                    MachineId = fallback.MachineId,
                    LegacyId = fallback.LegacyId,
                    IsEnabled = enabled
                };
            if (merged.IsEnabled) result.Add(merged);
        }

        result.AddRange(machines
            .Where(machine =>
            {
                var legacyId = ReadInt(machine, "id");
                var machineId = ReadString(machine, "machine_id");
                return (legacyId is null || !defaultLegacyIds.Contains(legacyId.Value)) &&
                    (string.IsNullOrWhiteSpace(machineId) || !defaultMachineIds.Contains(machineId));
            })
            .Select(Parse)
            .Where(configuration => configuration is not null && configuration.IsEnabled)
            .Cast<MachineAcquisitionConfiguration>());

        return result;
    }

    public async Task<IReadOnlyList<MachineRuntimeState>> LoadRuntimeAsync(CancellationToken cancellationToken)
    {
        var state = await stateStore.ReadAsync(cancellationToken);
        if (state["machine_realtime_state"] is not JsonObject realtime) return [];
        return realtime.Select(item => item.Value as JsonObject)
            .Where(item => item is not null)
            .Select(item => ParseRuntime(item!))
            .Where(item => item is not null)
            .Cast<MachineRuntimeState>()
            .ToArray();
    }

    private static MachineAcquisitionConfiguration? Parse(JsonObject machine)
    {
        var machineId = ReadString(machine, "machine_id");
        var table = NormalizeTableName(ReadString(machine, "source_table_name"));
        var parameter = ReadString(machine, "parameter_name");
        var timestamp = ReadString(machine, "source_timestamp_column") ?? "timestamp_zone";
        if (string.IsNullOrWhiteSpace(machineId) || string.IsNullOrWhiteSpace(table) || string.IsNullOrWhiteSpace(parameter)) return null;
        if (!Enum.TryParse<MachineParameterType>(ReadString(machine, "parameter_type"), true, out var type)) return null;
        return new MachineAcquisitionConfiguration(
            machineId,
            ReadInt(machine, "id"),
            ReadString(machine, "name", "machine_name") ?? machineId,
            table,
            timestamp,
            parameter,
            type,
            ReadString(machine, "parameter_unit") ?? string.Empty,
            ReadDouble(machine, "running_threshold") ?? (type == MachineParameterType.Weight ? 1 : 0),
            Math.Clamp(ReadInt(machine, "stop_timeout_seconds") ?? 10, 1, 3600),
            ReadBool(machine, "acquisition_enabled") ?? false);
    }

    private static MachineRuntimeState? ParseRuntime(JsonObject item)
    {
        var machineId = ReadString(item, "machine_id");
        var typeText = ReadString(item, "parameter_type");
        if (string.IsNullOrWhiteSpace(machineId) || !Enum.TryParse<MachineParameterType>(typeText, true, out var type)) return null;
        return new MachineRuntimeState
        {
            MachineId = machineId,
            MachineName = ReadString(item, "machine_name") ?? machineId,
            ParameterName = ReadString(item, "parameter_name") ?? string.Empty,
            ParameterType = type,
            ParameterUnit = ReadString(item, "parameter_unit") ?? string.Empty,
            CurrentValue = ReadDouble(item, "current_value"),
            PreviousValue = ReadDouble(item, "previous_value"),
            LastChangeTime = ReadDate(item, "last_change_time"),
            OperationalStatus = ReadString(item, "operational_status") ?? "DATA UNAVAILABLE",
            RunningStartedAt = ReadDate(item, "running_started_at"),
            TotalRunningSeconds = Math.Max(0, ReadDouble(item, "total_running_seconds") ?? 0),
            StopCandidateStartedAt = ReadDate(item, "stop_candidate_started_at"),
            SourceTimestamp = ReadDate(item, "source_timestamp"),
            LastUpdate = ReadDate(item, "last_update") ?? DateTimeOffset.UtcNow,
            ConnectionStatus = ReadString(item, "connection_status") ?? "DATA UNAVAILABLE"
        };
    }

    private static MachineAcquisitionConfiguration Default(string id, int legacyId, string name, string table, string parameter, MachineParameterType type, string unit, double threshold, int timeout) =>
        new(id, legacyId, name, table, "timestamp_zone", parameter, type, unit, threshold, timeout, true);
    private static string AreaFor(MachineParameterType type) => type switch { MachineParameterType.Weight => "Mixing", MachineParameterType.Speed => "Tunnel", _ => "Production" };
    internal static string NormalizeTableName(string? value)
    {
        var table = value?.Trim() ?? string.Empty;
        if (table.StartsWith("public.", StringComparison.OrdinalIgnoreCase)) table = table[7..];
        if (table.Length >= 2 && table[0] == '"' && table[^1] == '"') table = table[1..^1].Replace("\"\"", "\"");
        return table;
    }
    private static string? ReadString(JsonObject source, params string[] names)
    {
        foreach (var name in names)
            if (source[name] is JsonValue value && value.TryGetValue<string>(out var text) && !string.IsNullOrWhiteSpace(text)) return text.Trim();
        return null;
    }
    private static int? ReadInt(JsonObject source, string name) => source[name] is JsonValue value && int.TryParse(value.ToString(), CultureInfo.InvariantCulture, out var parsed) ? parsed : null;
    private static double? ReadDouble(JsonObject source, string name) => source[name] is JsonValue value && double.TryParse(value.ToString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed) && double.IsFinite(parsed) ? parsed : null;
    private static bool? ReadBool(JsonObject source, string name) => source[name] is JsonValue value && bool.TryParse(value.ToString(), out var parsed) ? parsed : null;
    private static DateTimeOffset? ReadDate(JsonObject source, string name) => source[name] is JsonValue value && DateTimeOffset.TryParse(value.ToString(), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed) ? parsed : null;
}

sealed class MachineStatePersistence(
    StateStore stateStore,
    PostgreSqlDataSourceProvider postgreSql,
    ILogger<MachineStatePersistence> logger)
{
    private DateTimeOffset _nextPostgreSqlSchemaCheck = DateTimeOffset.MinValue;
    private bool _postgreSqlSchemaReady;

    public async Task PersistAsync(
        IReadOnlyList<MachineRuntimeState> states,
        IReadOnlyList<JsonObject> statusHistory,
        IReadOnlyList<JsonObject> events,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        await stateStore.UpdateAsync(state =>
        {
            var realtime = state["machine_realtime_state"] as JsonObject ?? new JsonObject();
            state["machine_realtime_state"] = realtime;
            var machines = state["machines"]?.AsArray().OfType<JsonObject>().ToArray() ?? [];
            foreach (var runtime in states)
            {
                realtime[runtime.MachineId] = SerializeRuntime(runtime);
                var machine = machines.FirstOrDefault(item => string.Equals(ReadString(item, "machine_id"), runtime.MachineId, StringComparison.OrdinalIgnoreCase));
                if (machine is null) continue;
                machine["telemetry_status"] = runtime.DisplayStatus;
                machine["status"] = runtime.DisplayStatus;
                machine["parameter_value"] = runtime.CurrentValue;
                machine["parameter_name"] = runtime.ParameterName;
                machine["parameter_type"] = runtime.ParameterType.ToString().ToUpperInvariant();
                machine["parameter_unit"] = runtime.ParameterUnit;
                machine["running_hours_total"] = runtime.RunningHoursAt(now);
                machine["connection_status"] = runtime.ConnectionStatus;
                machine["realtime_updated_at"] = runtime.LastUpdate;
                machine["source_timestamp"] = runtime.SourceTimestamp;
                if (runtime.ParameterType == MachineParameterType.Counter) machine["counter"] = runtime.CurrentValue;
                if (runtime.ParameterType == MachineParameterType.Speed) machine["speed"] = runtime.CurrentValue;
            }

            AppendBounded(state, "machine_status_history", statusHistory, 5000);
            AppendBounded(state, "machine_events", events, 5000);
            return true;
        }, cancellationToken);

        if (!postgreSql.IsConfigured) return;
        try
        {
            if (DateTimeOffset.UtcNow >= _nextPostgreSqlSchemaCheck)
            {
                _postgreSqlSchemaReady = await HasApplicationSchemaAsync(cancellationToken);
                _nextPostgreSqlSchemaCheck = DateTimeOffset.UtcNow.AddMinutes(1);
            }
            if (_postgreSqlSchemaReady) await PersistPostgreSqlAsync(states, statusHistory, events, cancellationToken);
        }
        catch (Exception exception) when (exception is NpgsqlException or InvalidOperationException)
        {
            _postgreSqlSchemaReady = false;
            _nextPostgreSqlSchemaCheck = DateTimeOffset.UtcNow.AddMinutes(1);
            logger.LogWarning("PostgreSQL application persistence is not available yet; durable server-state fallback remains active. Reason: {Reason}", exception.Message);
        }
    }

    public async Task<bool> HasApplicationSchemaAsync(CancellationToken cancellationToken)
    {
        if (!postgreSql.IsConfigured) return false;
        await using var connection = await postgreSql.OpenConnectionAsync(cancellationToken);
        const string sql = """
            SELECT COUNT(*) = 3
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('master_machine', 'machine_realtime', 'machine_status_history');
            """;
        await using var command = new NpgsqlCommand(sql, connection);
        return Convert.ToBoolean(await command.ExecuteScalarAsync(cancellationToken), CultureInfo.InvariantCulture);
    }

    private async Task PersistPostgreSqlAsync(IReadOnlyList<MachineRuntimeState> states, IReadOnlyList<JsonObject> histories, IReadOnlyList<JsonObject> events, CancellationToken cancellationToken)
    {
        await using var connection = await postgreSql.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        foreach (var runtime in states)
        {
            const string sql = """
                INSERT INTO machine_realtime
                    (machine_id, status, parameter_name, parameter_type, parameter_value, previous_value,
                     last_change_time, running_started_at, total_running_seconds, running_hours,
                     source_timestamp, connection_status, updated_at)
                VALUES
                    (@machine_id, @status, @parameter_name, @parameter_type, @parameter_value, @previous_value,
                     @last_change_time, @running_started_at, @total_seconds, @running_hours,
                     @source_timestamp, @connection_status, @updated_at)
                ON CONFLICT (machine_id) DO UPDATE SET
                    status = EXCLUDED.status, parameter_name = EXCLUDED.parameter_name,
                    parameter_type = EXCLUDED.parameter_type, parameter_value = EXCLUDED.parameter_value,
                    previous_value = EXCLUDED.previous_value, last_change_time = EXCLUDED.last_change_time,
                    running_started_at = EXCLUDED.running_started_at,
                    total_running_seconds = EXCLUDED.total_running_seconds,
                    running_hours = EXCLUDED.running_hours, source_timestamp = EXCLUDED.source_timestamp,
                    connection_status = EXCLUDED.connection_status, updated_at = EXCLUDED.updated_at;
                """;
            await using var command = new NpgsqlCommand(sql, connection, transaction);
            command.Parameters.AddWithValue("machine_id", runtime.MachineId);
            command.Parameters.AddWithValue("status", runtime.DisplayStatus);
            command.Parameters.AddWithValue("parameter_name", runtime.ParameterName);
            command.Parameters.AddWithValue("parameter_type", runtime.ParameterType.ToString().ToUpperInvariant());
            command.Parameters.AddWithValue("parameter_value", (object?)runtime.CurrentValue ?? DBNull.Value);
            command.Parameters.AddWithValue("previous_value", (object?)runtime.PreviousValue ?? DBNull.Value);
            command.Parameters.AddWithValue("last_change_time", (object?)runtime.LastChangeTime ?? DBNull.Value);
            command.Parameters.AddWithValue("running_started_at", (object?)runtime.RunningStartedAt ?? DBNull.Value);
            command.Parameters.AddWithValue("total_seconds", runtime.TotalRunningSeconds);
            command.Parameters.AddWithValue("running_hours", runtime.RunningHoursAt(DateTimeOffset.UtcNow));
            command.Parameters.AddWithValue("source_timestamp", (object?)runtime.SourceTimestamp ?? DBNull.Value);
            command.Parameters.AddWithValue("connection_status", runtime.ConnectionStatus);
            command.Parameters.AddWithValue("updated_at", runtime.LastUpdate);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        foreach (var history in histories)
        {
            const string sql = """
                INSERT INTO machine_status_history
                    (machine_id, machine_name, previous_status, status, parameter_value, parameter_name, changed_at, duration_seconds)
                VALUES (@machine_id, @machine_name, @previous_status, @status, @parameter_value, @parameter_name, @changed_at, @duration_seconds);
                """;
            await using var command = new NpgsqlCommand(sql, connection, transaction);
            AddJsonParameters(command, history, ["machine_id", "machine_name", "previous_status", "status", "parameter_name"]);
            command.Parameters.AddWithValue("parameter_value", JsonDouble(history, "parameter_value") is { } value ? value : DBNull.Value);
            command.Parameters.AddWithValue("changed_at", JsonDate(history, "changed_at") ?? DateTimeOffset.UtcNow);
            command.Parameters.AddWithValue("duration_seconds", JsonDouble(history, "duration_seconds") is { } duration ? duration : DBNull.Value);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        if (await RelationExistsAsync(connection, transaction, "machine_events", cancellationToken))
        {
            foreach (var item in events)
            {
                const string sql = """
                    INSERT INTO machine_events (machine_id, machine_name, event_type, parameter_name, previous_value, current_value, occurred_at)
                    VALUES (@machine_id, @machine_name, @event_type, @parameter_name, @previous_value, @current_value, @occurred_at);
                    """;
                await using var command = new NpgsqlCommand(sql, connection, transaction);
                AddJsonParameters(command, item, ["machine_id", "machine_name", "event_type", "parameter_name"]);
                command.Parameters.AddWithValue("previous_value", JsonDouble(item, "previous_value") is { } previous ? previous : DBNull.Value);
                command.Parameters.AddWithValue("current_value", JsonDouble(item, "current_value") is { } current ? current : DBNull.Value);
                command.Parameters.AddWithValue("occurred_at", JsonDate(item, "occurred_at") ?? DateTimeOffset.UtcNow);
                await command.ExecuteNonQueryAsync(cancellationToken);
            }
        }
        await transaction.CommitAsync(cancellationToken);
    }

    private async Task<bool> RelationExistsAsync(NpgsqlConnection connection, NpgsqlTransaction transaction, string relation, CancellationToken cancellationToken)
    {
        await using var command = new NpgsqlCommand("SELECT to_regclass(@relation) IS NOT NULL", connection, transaction);
        command.Parameters.AddWithValue("relation", $"public.{relation}");
        return Convert.ToBoolean(await command.ExecuteScalarAsync(cancellationToken), CultureInfo.InvariantCulture);
    }

    private static JsonObject SerializeRuntime(MachineRuntimeState runtime) => new()
    {
        ["machine_id"] = runtime.MachineId,
        ["machine_name"] = runtime.MachineName,
        ["parameter_name"] = runtime.ParameterName,
        ["parameter_type"] = runtime.ParameterType.ToString().ToUpperInvariant(),
        ["parameter_unit"] = runtime.ParameterUnit,
        ["current_value"] = runtime.CurrentValue,
        ["previous_value"] = runtime.PreviousValue,
        ["last_change_time"] = runtime.LastChangeTime,
        ["operational_status"] = runtime.OperationalStatus,
        ["running_started_at"] = runtime.RunningStartedAt,
        ["total_running_seconds"] = runtime.TotalRunningSeconds,
        ["stop_candidate_started_at"] = runtime.StopCandidateStartedAt,
        ["source_timestamp"] = runtime.SourceTimestamp,
        ["last_update"] = runtime.LastUpdate,
        ["connection_status"] = runtime.ConnectionStatus
    };

    private static void AppendBounded(JsonObject state, string name, IReadOnlyList<JsonObject> values, int limit)
    {
        var array = state[name] as JsonArray ?? new JsonArray();
        state[name] = array;
        foreach (var value in values) array.Add(value.DeepClone());
        while (array.Count > limit) array.RemoveAt(0);
    }
    private static string? ReadString(JsonObject source, string name) => source[name] is JsonValue value && value.TryGetValue<string>(out var text) ? text : null;
    private static double? JsonDouble(JsonObject source, string name) => source[name] is JsonValue value && double.TryParse(value.ToString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed) ? parsed : null;
    private static DateTimeOffset? JsonDate(JsonObject source, string name) => source[name] is JsonValue value && DateTimeOffset.TryParse(value.ToString(), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed) ? parsed : null;
    private static void AddJsonParameters(NpgsqlCommand command, JsonObject source, IEnumerable<string> names)
    {
        foreach (var name in names) command.Parameters.AddWithValue(name, (object?)ReadString(source, name) ?? DBNull.Value);
    }
}

sealed class MachineDataAcquisitionService(
    PostgreSqlDataSourceProvider postgreSql,
    MachineConfigurationStore configurations,
    MachineRealtimeRegistry registry,
    MachineStatusEngine statusEngine,
    MachineStatePersistence persistence,
    MachineDashboardSource dashboardSource,
    MachineDashboardHub dashboardHub,
    IConfiguration configuration,
    ILogger<MachineDataAcquisitionService> logger) : BackgroundService
{
    private readonly List<JsonObject> _pendingHistory = [];
    private readonly List<JsonObject> _pendingEvents = [];
    private DateTimeOffset _nextConfigurationRefresh = DateTimeOffset.MinValue;
    private DateTimeOffset _nextPersistence = DateTimeOffset.MinValue;
    private IReadOnlyList<MachineAcquisitionConfiguration> _activeConfigurations = [];
    private IReadOnlyList<MachineAcquisitionConfiguration> _validConfigurations = [];
    private readonly HashSet<string> _loggedUnavailableSources = new(StringComparer.Ordinal);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await configurations.EnsureDefaultsAsync(stoppingToken);
        foreach (var state in await configurations.LoadRuntimeAsync(stoppingToken)) registry.Set(state);

        var pollMilliseconds = Math.Clamp(configuration.GetValue("MachineMonitoring:PollIntervalMilliseconds", 1000), 500, 5000);
        using var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(pollMilliseconds));
        do
        {
            var now = DateTimeOffset.UtcNow;
            try
            {
                if (now >= _nextConfigurationRefresh)
                {
                    _activeConfigurations = await configurations.LoadAsync(stoppingToken);
                    _validConfigurations = await ValidateConfigurationsAsync(_activeConfigurations, stoppingToken);
                    _nextConfigurationRefresh = now.AddSeconds(15);
                }
                await PollAsync(now, stoppingToken);

                if (now >= _nextPersistence || _pendingHistory.Count > 0 || _pendingEvents.Count > 0)
                {
                    await persistence.PersistAsync(registry.Snapshot(), _pendingHistory.ToArray(), _pendingEvents.ToArray(), stoppingToken);
                    _pendingHistory.Clear();
                    _pendingEvents.Clear();
                    _nextPersistence = now.AddSeconds(Math.Clamp(configuration.GetValue("MachineMonitoring:PersistenceIntervalSeconds", 10), 5, 60));
                }

                var snapshot = await dashboardSource.GetSnapshotAsync(false, stoppingToken);
                await dashboardHub.BroadcastAsync(snapshot, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception exception)
            {
                logger.LogError(exception, "Machine data acquisition cycle failed.");
                MarkAll("DATABASE OFFLINE", now);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task<IReadOnlyList<MachineAcquisitionConfiguration>> ValidateConfigurationsAsync(IReadOnlyList<MachineAcquisitionConfiguration> items, CancellationToken cancellationToken)
    {
        if (!postgreSql.IsConfigured)
        {
            MarkAll("DATABASE OFFLINE", DateTimeOffset.UtcNow);
            return [];
        }

        await using var connection = await postgreSql.OpenConnectionAsync(cancellationToken);
        const string sql = """
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = ANY(@tables);
            """;
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("tables", items.Select(item => item.SourceTableName).Distinct(StringComparer.Ordinal).ToArray());
        var columns = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var table = reader.GetString(0);
            if (!columns.TryGetValue(table, out var names)) columns[table] = names = new HashSet<string>(StringComparer.Ordinal);
            names.Add(reader.GetString(1));
        }

        var valid = new List<MachineAcquisitionConfiguration>();
        var unavailable = new HashSet<string>(StringComparer.Ordinal);
        foreach (var item in items)
        {
            if (columns.TryGetValue(item.SourceTableName, out var names) && names.Contains(item.SourceTimestampColumn) && names.Contains(item.ParameterName))
            {
                valid.Add(item);
            }
            else
            {
                registry.MarkUnavailable(item, "DATA UNAVAILABLE", DateTimeOffset.UtcNow);
                var key = $"{item.SourceTableName}:{item.ParameterName}:{item.SourceTimestampColumn}";
                unavailable.Add(key);
                if (_loggedUnavailableSources.Add(key))
                    logger.LogWarning("Machine source unavailable for {MachineId}: public.{Table}.{Parameter} ordered by {Timestamp}", item.MachineId, item.SourceTableName, item.ParameterName, item.SourceTimestampColumn);
            }
        }
        _loggedUnavailableSources.IntersectWith(unavailable);
        return valid;
    }

    private async Task PollAsync(DateTimeOffset observedAt, CancellationToken cancellationToken)
    {
        if (!postgreSql.IsConfigured || _validConfigurations.Count == 0) return;
        try
        {
            await using var connection = await postgreSql.OpenConnectionAsync(cancellationToken);
            var groups = _validConfigurations.GroupBy(item => item.SourceTableName, StringComparer.Ordinal).ToArray();
            var union = string.Join("\nUNION ALL\n", groups.Select(group =>
            {
                var timestamp = QuoteIdentifier(group.First().SourceTimestampColumn);
                var parameters = string.Join(", ", group.Select(item => item.ParameterName).Distinct(StringComparer.Ordinal).Select(QuoteIdentifier));
                var table = QuoteIdentifier(group.Key);
                var key = group.Key.Replace("'", "''", StringComparison.Ordinal);
                return $"SELECT '{key}' AS source_key, to_jsonb(src) AS payload FROM (SELECT {timestamp}, {parameters} FROM public.{table} ORDER BY {timestamp} DESC NULLS LAST LIMIT 1) src";
            }));

            await using var command = new NpgsqlCommand(union, connection);
            var rows = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                var json = reader.GetString(1);
                using var document = JsonDocument.Parse(json);
                rows[reader.GetString(0)] = document.RootElement.Clone();
            }

            foreach (var item in _validConfigurations)
            {
                if (!rows.TryGetValue(item.SourceTableName, out var row) ||
                    !TryReadDate(row, item.SourceTimestampColumn, out var sourceTimestamp) ||
                    !TryReadDouble(row, item.ParameterName, out var currentValue))
                {
                    registry.MarkUnavailable(item, "DATA UNAVAILABLE", observedAt);
                    continue;
                }

                var previous = registry.GetOrCreate(item);
                var evaluation = statusEngine.Evaluate(item, previous, currentValue, sourceTimestamp, observedAt);
                registry.Set(evaluation.State);
                if (evaluation.StatusChanged && previous.OperationalStatus is "RUNNING" or "STOPPED")
                {
                    var duration = previous.OperationalStatus == "RUNNING" && previous.RunningStartedAt is not null
                        ? Math.Max(0, (sourceTimestamp - previous.RunningStartedAt.Value).TotalSeconds)
                        : 0;
                    _pendingHistory.Add(new JsonObject
                    {
                        ["machine_id"] = item.MachineId,
                        ["machine_name"] = item.MachineName,
                        ["previous_status"] = previous.OperationalStatus,
                        ["status"] = evaluation.State.OperationalStatus,
                        ["parameter_value"] = currentValue,
                        ["parameter_name"] = item.ParameterName,
                        ["changed_at"] = sourceTimestamp,
                        ["duration_seconds"] = duration
                    });
                }
                if (evaluation.CounterEvent is not null)
                {
                    _pendingEvents.Add(new JsonObject
                    {
                        ["machine_id"] = item.MachineId,
                        ["machine_name"] = item.MachineName,
                        ["event_type"] = evaluation.CounterEvent,
                        ["parameter_name"] = item.ParameterName,
                        ["previous_value"] = previous.CurrentValue,
                        ["current_value"] = currentValue,
                        ["occurred_at"] = sourceTimestamp
                    });
                }
            }
        }
        catch (Exception exception) when (exception is NpgsqlException or InvalidOperationException or JsonException)
        {
            logger.LogWarning("Machine PostgreSQL acquisition is offline: {Reason}", exception.Message);
            MarkAll("DATABASE OFFLINE", observedAt);
        }
    }

    private void MarkAll(string status, DateTimeOffset now)
    {
        foreach (var item in _activeConfigurations) registry.MarkUnavailable(item, status, now);
    }

    private static bool TryReadDouble(JsonElement row, string name, out double value)
    {
        value = default;
        return row.TryGetProperty(name, out var property) && property.ValueKind != JsonValueKind.Null &&
            (property.TryGetDouble(out value) || double.TryParse(property.ToString(), NumberStyles.Float, CultureInfo.InvariantCulture, out value)) &&
            double.IsFinite(value);
    }
    private static bool TryReadDate(JsonElement row, string name, out DateTimeOffset value)
    {
        value = default;
        return row.TryGetProperty(name, out var property) && property.ValueKind == JsonValueKind.String &&
            DateTimeOffset.TryParse(property.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out value);
    }
    private static string QuoteIdentifier(string value) => $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
}

public static class MachineMonitoringEndpoints
{
    public static IEndpointRouteBuilder MapMachineMonitoringApi(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/machine-monitoring/diagnostics", async (
            PostgreSqlDataSourceProvider postgreSql,
            MachineConfigurationStore configurations,
            MachineRealtimeRegistry registry,
            MachineStatePersistence persistence,
            CancellationToken cancellationToken) =>
        {
            var configured = await configurations.LoadAsync(cancellationToken);
            var states = registry.Snapshot();
            var applicationSchema = false;
            try { applicationSchema = await persistence.HasApplicationSchemaAsync(cancellationToken); }
            catch (Exception exception) when (exception is NpgsqlException or InvalidOperationException) { }
            return Results.Ok(new
            {
                status = postgreSql.IsConfigured ? "configured" : "not-configured",
                connectionStatus = states.Any(state => state.ConnectionStatus == "DATABASE OFFLINE") ? "OFFLINE" : states.Any(state => state.ConnectionStatus == "REALTIME CONNECTED") ? "CONNECTED" : "UNAVAILABLE",
                configuredMachines = configured.Count,
                realtimeMachines = states.Count,
                applicationSchema,
                machines = states.Select(state => new
                {
                    state.MachineId,
                    state.MachineName,
                    parameterType = state.ParameterType.ToString().ToUpperInvariant(),
                    state.ParameterName,
                    state.CurrentValue,
                    status = state.DisplayStatus,
                    runningHours = state.RunningHoursAt(DateTimeOffset.UtcNow),
                    state.SourceTimestamp,
                    state.LastUpdate,
                    state.ConnectionStatus
                })
            });
        });
        return endpoints;
    }
}
