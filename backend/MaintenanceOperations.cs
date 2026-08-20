using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

internal static class MaintenanceOperationsApi
{
    public static void MapMaintenanceOperationsApi(this WebApplication app)
    {
        app.MapPost("/api/replacements", CreateReplacementAsync)
            .RequirePermission(PermissionNames.ReplacementsCreate);
        app.MapDelete("/api/replacements", ClearReplacementHistoryAsync)
            .RequirePermission(PermissionNames.HistoryClear);
        app.MapPost("/api/running-hours/reset", ResetRunningHoursAsync)
            .RequirePermission(PermissionNames.RunningHoursReset);
        app.MapPost("/api/master-data/import", ImportMasterDataAsync)
            .RequirePermission(PermissionNames.ImportsManage);
        app.MapDelete("/api/master-data/spare-parts", ClearSparePartsAsync)
            .RequirePermission(PermissionNames.ImportsManage);
    }

    private static async Task<IResult> CreateReplacementAsync(
        ReplacementRequest request,
        StateStore stateStore,
        HttpContext context,
        SecurityAuditStore auditStore,
        CancellationToken cancellationToken)
    {
        if (request.PartId <= 0 || request.Quantity <= 0 || request.Quantity > 100000)
            return Results.BadRequest(Error("Spare part dan quantity wajib valid."));
        if (request.DowntimeMinutes < 0 || request.DowntimeMinutes > 525600)
            return Results.BadRequest(Error("Downtime tidak valid."));
        if (request.Cost < 0 || request.Cost > 1_000_000_000_000m)
            return Results.BadRequest(Error("Biaya maintenance tidak valid."));

        var username = context.User.Identity?.Name ?? "unknown";
        var result = await stateStore.UpdateAsync(state =>
        {
            var parts = state["spare_parts"] as JsonArray ?? new JsonArray();
            var part = parts.OfType<JsonObject>().FirstOrDefault(item => ReadInt(item, "id") == request.PartId);
            if (part is null) return ReplacementResult.NotFound("Spare part tidak ditemukan.");

            var history = state["replacement_history"] as JsonArray;
            if (history is null)
            {
                history = new JsonArray();
                state["replacement_history"] = history;
            }
            var nextId = history.OfType<JsonObject>().Select(item => ReadInt(item, "id")).DefaultIfEmpty(0).Max() + 1;
            var today = DateTimeOffset.Now.ToString("yyyy-MM-dd");
            var replacement = new JsonObject
            {
                ["id"] = nextId,
                ["spare_part_id"] = request.PartId,
                ["machine_id"] = ReadInt(part, "machine_id"),
                ["spare_part_name"] = ReadString(part, "name"),
                ["spare_part_code"] = ReadString(part, "code"),
                ["quantity"] = request.Quantity,
                ["replacement_date"] = today,
                ["replaced_by"] = string.IsNullOrWhiteSpace(request.Technician) ? username : request.Technician.Trim(),
                ["downtime_minutes"] = request.DowntimeMinutes,
                ["cost"] = request.Cost,
                ["notes"] = request.Notes?.Trim() ?? string.Empty,
                ["photo"] = string.Empty,
                ["created_by"] = username,
                ["created_at"] = DateTimeOffset.UtcNow.ToString("O")
            };
            history.Insert(0, replacement);
            part["current_running_hours"] = 0;
            part["last_replacement_date"] = today;
            return ReplacementResult.Success(replacement, part);
        }, cancellationToken);

        if (!result.IsSuccess)
            return Results.Json(Error(result.Error!), statusCode: result.StatusCode);

        await auditStore.WriteAsync(new SecurityAuditEntry(
            DateTimeOffset.UtcNow,
            username,
            context.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "UNKNOWN",
            "REPLACEMENT_CREATED",
            request.PartId.ToString(),
            "SUCCESS"), cancellationToken);
        return Results.Ok(new { status = "success", message = "Penggantian spare part berhasil dicatat.", replacement = result.Replacement, spare_part = result.Part });
    }

    private static async Task<IResult> ClearReplacementHistoryAsync(
        StateStore stateStore,
        HttpContext context,
        SecurityAuditStore auditStore,
        CancellationToken cancellationToken)
    {
        var removed = await stateStore.UpdateAsync(state =>
        {
            var count = (state["replacement_history"] as JsonArray)?.Count ?? 0;
            state["replacement_history"] = new JsonArray();
            return count;
        }, cancellationToken);
        await auditStore.WriteAsync(new SecurityAuditEntry(
            DateTimeOffset.UtcNow,
            context.User.Identity?.Name ?? "unknown",
            context.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "UNKNOWN",
            "REPLACEMENT_HISTORY_CLEARED",
            $"{removed} records",
            "SUCCESS"), cancellationToken);
        return Results.Ok(new { status = "success", removed });
    }

    private static async Task<IResult> ResetRunningHoursAsync(
        RunningHoursResetRequest request,
        StateStore stateStore,
        HttpContext context,
        SecurityAuditStore auditStore,
        CancellationToken cancellationToken)
    {
        var scope = request.Scope?.Trim().ToUpperInvariant();
        if (scope is not ("ALL" or "ALL_PARTS" or "MACHINE" or "PART"))
            return Results.BadRequest(Error("Scope reset tidak valid."));

        var changed = await stateStore.UpdateAsync(state =>
        {
            var count = 0;
            var machines = (state["machines"] as JsonArray)?.OfType<JsonObject>() ?? [];
            var parts = (state["spare_parts"] as JsonArray)?.OfType<JsonObject>() ?? [];
            foreach (var machine in machines.Where(machine => scope == "ALL" || (scope == "MACHINE" && ReadInt(machine, "id") == request.TargetId)))
            {
                machine["running_hours_total"] = 0;
                machine["running_hours_daily"] = 0;
                machine["running_hours_weekly"] = 0;
                machine["running_hours_monthly"] = 0;
                machine["last_updated"] = DateTimeOffset.UtcNow.ToString("O");
                count++;
            }
            foreach (var part in parts.Where(part =>
                         scope is "ALL" or "ALL_PARTS" ||
                         (scope == "PART" && ReadInt(part, "id") == request.TargetId) ||
                         (scope == "MACHINE" && ReadInt(part, "machine_id") == request.TargetId)))
            {
                part["current_running_hours"] = 0;
                part["last_replacement_rh"] = 0;
                count++;
            }
            if (scope == "ALL") state["running_hours_log"] = new JsonArray();
            return count;
        }, cancellationToken);

        await auditStore.WriteAsync(new SecurityAuditEntry(
            DateTimeOffset.UtcNow,
            context.User.Identity?.Name ?? "unknown",
            context.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "UNKNOWN",
            "RUNNING_HOURS_RESET",
            $"{scope}:{request.TargetId}",
            "SUCCESS"), cancellationToken);
        return Results.Ok(new { status = "success", changed });
    }

    private static object Error(string message) => new { status = "error", message };

    private static async Task<IResult> ImportMasterDataAsync(
        MasterDataImportRequest request,
        StateStore stateStore,
        HttpContext context,
        SecurityAuditStore auditStore,
        CancellationToken cancellationToken)
    {
        if (request.Machines is null && request.SpareParts is null)
            return Results.BadRequest(Error("Pilih data mesin atau spare part yang akan diimpor."));
        if ((request.Machines?.Count ?? 0) > 5000 || (request.SpareParts?.Count ?? 0) > 20000)
            return Results.BadRequest(Error("Jumlah data import melebihi batas keamanan."));
        if (request.Machines?.Any(item => item is not JsonObject) == true ||
            request.SpareParts?.Any(item => item is not JsonObject) == true)
            return Results.BadRequest(Error("Format data import tidak valid."));

        await stateStore.UpdateAsync(state =>
        {
            if (request.Machines is not null)
                state["machines"] = request.Machines.DeepClone();
            if (request.SpareParts is not null)
                state["spare_parts"] = request.SpareParts.DeepClone();
            return true;
        }, cancellationToken);

        await auditStore.WriteAsync(new SecurityAuditEntry(
            DateTimeOffset.UtcNow,
            context.User.Identity?.Name ?? "unknown",
            context.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "UNKNOWN",
            "MASTER_DATA_IMPORTED",
            $"machines:{request.Machines?.Count ?? 0};spare-parts:{request.SpareParts?.Count ?? 0}",
            "SUCCESS"), cancellationToken);
        return Results.Ok(new { status = "success" });
    }

    private static async Task<IResult> ClearSparePartsAsync(
        StateStore stateStore,
        HttpContext context,
        SecurityAuditStore auditStore,
        CancellationToken cancellationToken)
    {
        var removed = await stateStore.UpdateAsync(state =>
        {
            var count = (state["spare_parts"] as JsonArray)?.Count ?? 0;
            state["spare_parts"] = new JsonArray();
            return count;
        }, cancellationToken);
        await auditStore.WriteAsync(new SecurityAuditEntry(
            DateTimeOffset.UtcNow,
            context.User.Identity?.Name ?? "unknown",
            context.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "UNKNOWN",
            "SPARE_PART_MASTER_CLEARED",
            $"{removed} records",
            "SUCCESS"), cancellationToken);
        return Results.Ok(new { status = "success", removed });
    }

    private static int ReadInt(JsonObject node, string name) => node[name]?.GetValue<int>() ?? 0;
    private static string ReadString(JsonObject node, string name) => node[name]?.GetValue<string>() ?? string.Empty;
}

internal sealed record ReplacementRequest(
    [property: JsonPropertyName("part_id")] int PartId,
    [property: JsonPropertyName("quantity")] decimal Quantity,
    [property: JsonPropertyName("downtime_minutes")] int DowntimeMinutes,
    [property: JsonPropertyName("cost")] decimal Cost,
    [property: JsonPropertyName("technician")] string? Technician,
    [property: JsonPropertyName("notes")] string? Notes);
internal sealed record RunningHoursResetRequest(
    [property: JsonPropertyName("scope")] string? Scope,
    [property: JsonPropertyName("target_id")] int? TargetId);
internal sealed record MasterDataImportRequest(
    [property: JsonPropertyName("machines")] JsonArray? Machines,
    [property: JsonPropertyName("spare_parts")] JsonArray? SpareParts);
internal sealed record ReplacementResult(bool IsSuccess, int StatusCode, string? Error, JsonObject? Replacement, JsonObject? Part)
{
    public static ReplacementResult Success(JsonObject replacement, JsonObject part) => new(true, 200, null, replacement, part);
    public static ReplacementResult NotFound(string error) => new(false, 404, error, null, null);
}
