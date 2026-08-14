using System.Text.Json.Nodes;

internal static class SparePartManagementApi
{
    private static readonly HashSet<string> AllowedCriticalLevels =
        new(StringComparer.OrdinalIgnoreCase) { "CRITICAL", "MEDIUM", "LOW" };

    public static void MapSparePartManagementApi(this WebApplication app)
    {
        app.MapPost("/api/spare-parts", CreateAsync);
        app.MapPut("/api/spare-parts/{id:int}", UpdateAsync);
        app.MapDelete("/api/spare-parts/{id:int}", DeleteAsync);
    }

    private static async Task<IResult> CreateAsync(
        SparePartMutationRequest request,
        StateStore stateStore,
        CancellationToken cancellationToken)
    {
        var validationError = Validate(request);
        if (validationError is not null)
            return Results.BadRequest(Error(validationError));

        var mutation = await stateStore.UpdateAsync(state =>
        {
            var machines = state["machines"]?.AsArray() ?? new JsonArray();
            if (!machines.OfType<JsonObject>().Any(machine => ReadInt(machine, "id") == request.MachineId))
                return SparePartMutationResult.NotFound("Mesin asosiasi tidak ditemukan.");

            var parts = GetOrCreateParts(state);
            if (FindDuplicate(parts, request.MachineId, request.Code!, excludedId: null) is not null)
                return SparePartMutationResult.Conflict("Kode spare part sudah digunakan pada mesin yang dipilih.");

            var nextId = parts.OfType<JsonObject>()
                .Select(part => ReadInt(part, "id"))
                .DefaultIfEmpty(0)
                .Max() + 1;
            var part = CreateNode(nextId, request);
            parts.Add(part);
            return SparePartMutationResult.Success(part);
        }, cancellationToken);

        return ToResult(mutation, "Spare part baru berhasil disimpan.");
    }

    private static async Task<IResult> UpdateAsync(
        int id,
        SparePartMutationRequest request,
        StateStore stateStore,
        CancellationToken cancellationToken)
    {
        var validationError = Validate(request);
        if (validationError is not null)
            return Results.BadRequest(Error(validationError));

        var mutation = await stateStore.UpdateAsync(state =>
        {
            var machines = state["machines"]?.AsArray() ?? new JsonArray();
            if (!machines.OfType<JsonObject>().Any(machine => ReadInt(machine, "id") == request.MachineId))
                return SparePartMutationResult.NotFound("Mesin asosiasi tidak ditemukan.");

            var parts = GetOrCreateParts(state);
            var existing = parts.OfType<JsonObject>().FirstOrDefault(part => ReadInt(part, "id") == id);
            if (existing is null)
                return SparePartMutationResult.NotFound("Spare part yang akan diubah tidak ditemukan.");
            if (FindDuplicate(parts, request.MachineId, request.Code!, id) is not null)
                return SparePartMutationResult.Conflict("Kode spare part sudah digunakan pada mesin yang dipilih.");

            Apply(existing, request);
            return SparePartMutationResult.Success(existing);
        }, cancellationToken);

        return ToResult(mutation, "Data spare part berhasil diperbarui.");
    }

    private static async Task<IResult> DeleteAsync(
        int id,
        StateStore stateStore,
        CancellationToken cancellationToken)
    {
        var deleted = await stateStore.UpdateAsync(state =>
        {
            var parts = GetOrCreateParts(state);
            var existing = parts.OfType<JsonObject>().FirstOrDefault(part => ReadInt(part, "id") == id);
            if (existing is null) return false;
            parts.Remove(existing);
            return true;
        }, cancellationToken);

        return deleted
            ? Results.Ok(new { status = "success", message = "Spare part berhasil dihapus." })
            : Results.Json(Error("Spare part tidak ditemukan."), statusCode: StatusCodes.Status404NotFound);
    }

    private static IResult ToResult(SparePartMutationResult mutation, string message)
    {
        if (!mutation.IsSuccess)
            return Results.Json(Error(mutation.ErrorMessage!), statusCode: mutation.StatusCode);

        return Results.Ok(new
        {
            status = "success",
            message,
            spare_part = mutation.Part
        });
    }

    private static string? Validate(SparePartMutationRequest request)
    {
        if (request.MachineId <= 0) return "Mesin asosiasi wajib dipilih.";
        if (string.IsNullOrWhiteSpace(request.Name)) return "Nama spare part wajib diisi.";
        if (string.IsNullOrWhiteSpace(request.Code)) return "Kode spare part wajib diisi.";
        if (string.IsNullOrWhiteSpace(request.Vendor)) return "Vendor / supplier wajib diisi.";
        if (request.Price < 0) return "Harga tidak boleh bernilai negatif.";
        if (request.LifetimeHours <= 0) return "Lifetime harus lebih besar dari 0 jam.";
        if (request.CurrentRunningHours < 0) return "Running Hours tidak boleh bernilai negatif.";
        if (request.SafetyStock < 0) return "Stok Quantity tidak boleh bernilai negatif.";
        if (string.IsNullOrWhiteSpace(request.CriticalLevel) || !AllowedCriticalLevels.Contains(request.CriticalLevel))
            return "Critical Level tidak valid.";
        return null;
    }

    private static JsonArray GetOrCreateParts(JsonObject state)
    {
        if (state["spare_parts"] is JsonArray parts) return parts;
        parts = new JsonArray();
        state["spare_parts"] = parts;
        return parts;
    }

    private static JsonObject? FindDuplicate(JsonArray parts, int machineId, string code, int? excludedId) =>
        parts.OfType<JsonObject>().FirstOrDefault(part =>
            ReadInt(part, "id") != excludedId &&
            ReadInt(part, "machine_id") == machineId &&
            string.Equals(ReadString(part, "code"), code.Trim(), StringComparison.OrdinalIgnoreCase));

    private static JsonObject CreateNode(int id, SparePartMutationRequest request)
    {
        var node = new JsonObject
        {
            ["id"] = id,
            ["last_replacement_date"] = DateOnly.FromDateTime(DateTime.Today).ToString("yyyy-MM-dd")
        };
        Apply(node, request);
        return node;
    }

    private static void Apply(JsonObject part, SparePartMutationRequest request)
    {
        part["machine_id"] = request.MachineId;
        part["name"] = request.Name!.Trim();
        part["code"] = request.Code!.Trim();
        part["description"] = request.Description?.Trim() ?? string.Empty;
        part["vendor"] = request.Vendor!.Trim();
        part["price"] = request.Price;
        part["lifetime_hours"] = request.LifetimeHours;
        part["current_running_hours"] = request.CurrentRunningHours;
        part["safety_stock"] = request.SafetyStock;
        part["critical_level"] = request.CriticalLevel!.Trim().ToUpperInvariant();
    }

    private static int ReadInt(JsonObject node, string name) =>
        node[name] is JsonValue value && value.TryGetValue<int>(out var result) ? result : 0;

    private static string ReadString(JsonObject node, string name) =>
        node[name]?.GetValue<string>() ?? string.Empty;

    private static object Error(string message) => new { status = "error", message };

    private sealed record SparePartMutationResult(bool IsSuccess, int StatusCode, string? ErrorMessage, JsonObject? Part)
    {
        public static SparePartMutationResult Success(JsonObject part) => new(true, StatusCodes.Status200OK, null, part);
        public static SparePartMutationResult Conflict(string message) => new(false, StatusCodes.Status409Conflict, message, null);
        public static SparePartMutationResult NotFound(string message) => new(false, StatusCodes.Status404NotFound, message, null);
    }
}

internal sealed record SparePartMutationRequest(
    int MachineId,
    string? Name,
    string? Code,
    string? Description,
    string? Vendor,
    decimal Price,
    double LifetimeHours,
    double CurrentRunningHours,
    int SafetyStock,
    string? CriticalLevel);
