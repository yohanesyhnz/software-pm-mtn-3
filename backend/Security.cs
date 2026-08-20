using System.Security.Claims;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;

internal static class PermissionNames
{
    public const string DashboardView = "dashboard.view";
    public const string MachinesView = "machines.view";
    public const string MachinesManage = "machines.manage";
    public const string MachinesOrder = "machines.order";
    public const string SparePartsView = "spare-parts.view";
    public const string SparePartsManage = "spare-parts.manage";
    public const string ReplacementsCreate = "replacements.create";
    public const string MaintenanceView = "maintenance.view";
    public const string ReportsExport = "reports.export";
    public const string RunningHoursReset = "running-hours.reset";
    public const string ImportsManage = "imports.manage";
    public const string HistoryClear = "history.clear";
    public const string IntegrationsManage = "integrations.manage";
    public const string SystemBackup = "system.backup";
    public const string SystemRestore = "system.restore";
    public const string SystemFactoryReset = "system.factory-reset";
    public const string SettingsView = "settings.view";
    public const string SettingsManage = "settings.manage";
    public const string UsersManage = "users.manage";
    public const string RbacManage = "rbac.manage";
    public const string KioskManage = "kiosk.manage";
    public const string AuditView = "audit.view";

    public static readonly IReadOnlyList<PermissionDefinition> Catalog =
    [
        new(DashboardView, "Dashboard", "Melihat KPI dan Machine Card realtime", "Monitoring"),
        new(MachinesView, "Lihat Master Mesin", "Melihat data master mesin", "Master Mesin"),
        new(MachinesManage, "Kelola Master Mesin", "Tambah, edit, upload gambar, dan nonaktifkan mesin", "Master Mesin"),
        new(MachinesOrder, "Atur Urutan Mesin", "Menyimpan urutan Machine Card global", "Master Mesin"),
        new(SparePartsView, "Lihat Master Spare Part", "Melihat data dan lifetime spare part", "Spare Part"),
        new(SparePartsManage, "Kelola Master Spare Part", "Tambah, edit, copy, dan hapus spare part", "Spare Part"),
        new(ReplacementsCreate, "Catat Penggantian", "Mencatat penggantian spare part dan downtime", "Preventive Maintenance"),
        new(MaintenanceView, "Lihat Preventive Maintenance", "Melihat analitik dan riwayat PM", "Preventive Maintenance"),
        new(ReportsExport, "Export Laporan", "Mengunduh laporan PM Excel/PDF", "Preventive Maintenance"),
        new(RunningHoursReset, "Reset Running Hours", "Reset jam jalan mesin atau spare part dengan autentikasi ulang", "Operasi Sensitif"),
        new(ImportsManage, "Import Master Data", "Import master mesin dan spare part", "Operasi Sensitif"),
        new(HistoryClear, "Kosongkan Riwayat", "Menghapus seluruh riwayat PM", "Operasi Sensitif"),
        new(IntegrationsManage, "Kelola Integrasi", "Konfigurasi dan diagnostik PostgreSQL/PLC", "Integrasi"),
        new(SystemBackup, "Backup Sistem", "Membuat backup data aplikasi", "Sistem"),
        new(SystemRestore, "Restore Sistem", "Memulihkan data dari backup", "Sistem"),
        new(SystemFactoryReset, "Factory Reset", "Mengembalikan state awal aplikasi", "Sistem"),
        new(SettingsView, "Lihat Settings", "Melihat pengaturan aplikasi", "Settings"),
        new(SettingsManage, "Kelola Settings", "Mengubah pengaturan global dan Smart Assistant", "Settings"),
        new(UsersManage, "Kelola User", "Tambah, edit, dan hapus akun", "Access Control"),
        new(RbacManage, "Kelola Role & Permission", "Mengubah matriks izin role", "Access Control"),
        new(KioskManage, "Kelola Kiosk", "Minimize, keluar fullscreen, dan menutup panel", "Sistem"),
        new(AuditView, "Lihat Audit Log", "Melihat catatan aktivitas keamanan", "Access Control")
    ];

    public static readonly HashSet<string> Known = Catalog
        .Select(item => item.Code)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);
}

internal sealed record PermissionDefinition(string Code, string Name, string Description, string Group);

internal sealed class PermissionRequirement(string permission) : IAuthorizationRequirement
{
    public string Permission { get; } = permission;
}

internal sealed class PermissionAuthorizationHandler(RbacStore rbacStore, SecurityAuditStore auditStore)
    : AuthorizationHandler<PermissionRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated != true) return;

        var access = await rbacStore.GetCurrentAccessAsync(context.User, CancellationToken.None);
        if (access is not null && access.Permissions.Contains(requirement.Permission, StringComparer.OrdinalIgnoreCase))
        {
            context.Succeed(requirement);
            return;
        }

        await auditStore.WriteAsync(new SecurityAuditEntry(
            DateTimeOffset.UtcNow,
            access?.Username ?? context.User.Identity?.Name ?? "unknown",
            access?.Role ?? "UNKNOWN",
            "AUTHORIZATION_DENIED",
            requirement.Permission,
            "DENIED"), CancellationToken.None);
    }
}

internal static class PermissionEndpointExtensions
{
    public static TBuilder RequirePermission<TBuilder>(this TBuilder builder, string permission)
        where TBuilder : IEndpointConventionBuilder
    {
        builder.RequireAuthorization(policy =>
        {
            policy.RequireAuthenticatedUser();
            policy.AddRequirements(new PermissionRequirement(permission));
        });
        return builder;
    }
}

internal sealed class RbacStore(StateStore stateStore)
{
    private const int CurrentSchemaVersion = 2;

    public async Task EnsureDefaultsAsync(CancellationToken cancellationToken) =>
        await stateStore.UpdateAsync(state =>
        {
            EnsureDefaults(state);
            return true;
        }, cancellationToken);

    public async Task<RbacAccess?> GetCurrentAccessAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var username = principal.FindFirstValue(ClaimTypes.Name) ?? principal.Identity?.Name;
        if (string.IsNullOrWhiteSpace(username)) return null;

        var state = await stateStore.ReadAsync(cancellationToken);
        EnsureDefaults(state);
        var user = (state["users"] as JsonArray)?.OfType<JsonObject>().FirstOrDefault(item =>
            string.Equals(ReadString(item, "username"), username, StringComparison.OrdinalIgnoreCase));
        if (user is null) return null;

        var role = ReadString(user, "role").ToUpperInvariant();
        var roleNode = GetRoles(state).FirstOrDefault(item =>
            string.Equals(ReadString(item, "code"), role, StringComparison.OrdinalIgnoreCase));
        if (roleNode is null) return null;

        return new RbacAccess(
            ReadInt(user, "id"),
            ReadString(user, "username"),
            ReadString(user, "full_name"),
            role,
            ReadPermissions(roleNode));
    }

    public async Task<RbacSnapshot> GetSnapshotAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var state = await stateStore.ReadAsync(cancellationToken);
        EnsureDefaults(state);
        var access = await GetCurrentAccessAsync(principal, cancellationToken);
        return new RbacSnapshot(
            CurrentSchemaVersion,
            PermissionNames.Catalog,
            GetRoles(state).Select(ToRole).OrderBy(role => role.DisplayOrder).ToArray(),
            access?.Permissions ?? []);
    }

    public async Task<RbacRoleResult> UpdateRoleAsync(
        string roleCode,
        UpdateRolePermissionsRequest request,
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var normalizedCode = roleCode.Trim().ToUpperInvariant();
        var requestedPermissions = (request.Permissions ?? [])
            .Select(item => item.Trim().ToLowerInvariant())
            .Where(item => item.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var unknown = requestedPermissions.Where(item => !PermissionNames.Known.Contains(item)).ToArray();
        if (unknown.Length > 0)
            return RbacRoleResult.Invalid($"Permission tidak dikenal: {string.Join(", ", unknown)}");

        var actor = await GetCurrentAccessAsync(principal, cancellationToken);
        if (actor is null) return RbacRoleResult.Invalid("Session user tidak valid.");

        return await stateStore.UpdateAsync(state =>
        {
            EnsureDefaults(state);
            var role = GetRoles(state).FirstOrDefault(item =>
                string.Equals(ReadString(item, "code"), normalizedCode, StringComparison.OrdinalIgnoreCase));
            if (role is null) return RbacRoleResult.NotFound("Role tidak ditemukan.");

            var users = (state["users"] as JsonArray)?.OfType<JsonObject>().ToArray() ?? [];
            var keepsRbacAdministrator = GetRoles(state).Any(candidate =>
            {
                var candidateCode = ReadString(candidate, "code");
                var permissions = string.Equals(candidateCode, normalizedCode, StringComparison.OrdinalIgnoreCase)
                    ? requestedPermissions
                    : ReadPermissions(candidate);
                return permissions.Contains(PermissionNames.RbacManage, StringComparer.OrdinalIgnoreCase) &&
                       permissions.Contains(PermissionNames.UsersManage, StringComparer.OrdinalIgnoreCase) &&
                       users.Any(user => string.Equals(ReadString(user, "role"), candidateCode, StringComparison.OrdinalIgnoreCase));
            });
            if (!keepsRbacAdministrator)
                return RbacRoleResult.Invalid("Minimal satu role yang digunakan user harus memiliki izin Kelola User dan Kelola Role & Permission agar administrasi akses tidak terkunci.");

            role["permissions"] = new JsonArray(requestedPermissions.Select(item => (JsonNode?)JsonValue.Create(item)).ToArray());
            role["description"] = string.IsNullOrWhiteSpace(request.Description)
                ? role["description"]?.GetValue<string>() ?? string.Empty
                : request.Description.Trim();
            role["updated_at"] = DateTimeOffset.UtcNow.ToString("O");
            role["updated_by"] = actor.Username;
            return RbacRoleResult.Success(ToRole(role));
        }, cancellationToken);
    }

    public static void EnsureDefaults(JsonObject state)
    {
        var rbac = state["rbac"] as JsonObject;
        if (rbac is null)
        {
            rbac = new JsonObject();
            state["rbac"] = rbac;
        }
        var previousSchemaVersion = rbac["schema_version"]?.GetValue<int>() ?? 0;
        var roles = rbac["roles"] as JsonArray;
        if (roles is null)
        {
            roles = new JsonArray();
            rbac["roles"] = roles;
        }

        var migrateRecommendedFiveRoleMatrix = previousSchemaVersion < CurrentSchemaVersion;
        MergeRole(roles, "ADMIN", "Administrator", "Keamanan, konfigurasi sistem, integrasi, dan pemulihan", 10,
            PermissionNames.Known, migrateRecommendedFiveRoleMatrix);
        MergeRole(roles, "MANAGER", "Manager", "Pengawasan, laporan, persetujuan manajerial, dan audit", 20,
        [
            PermissionNames.DashboardView, PermissionNames.MachinesView, PermissionNames.SparePartsView,
            PermissionNames.MaintenanceView, PermissionNames.ReportsExport, PermissionNames.SettingsView,
            PermissionNames.AuditView
        ], migrateRecommendedFiveRoleMatrix);
        MergeRole(roles, "SUPERVISOR", "Supervisor", "Pengelolaan operasional, master data, dan verifikasi pekerjaan", 30,
        [
            PermissionNames.DashboardView, PermissionNames.MachinesView, PermissionNames.MachinesManage,
            PermissionNames.MachinesOrder, PermissionNames.SparePartsView, PermissionNames.SparePartsManage,
            PermissionNames.ReplacementsCreate, PermissionNames.MaintenanceView, PermissionNames.ReportsExport,
            PermissionNames.RunningHoursReset, PermissionNames.SettingsView, PermissionNames.SettingsManage,
            PermissionNames.AuditView
        ], migrateRecommendedFiveRoleMatrix);
        MergeRole(roles, "TECHNICIAN", "Teknisi / Operator", "Pelaksanaan maintenance dan pencatatan pekerjaan lapangan", 40,
        [
            PermissionNames.DashboardView, PermissionNames.MachinesView, PermissionNames.SparePartsView,
            PermissionNames.ReplacementsCreate, PermissionNames.MaintenanceView, PermissionNames.ReportsExport,
            PermissionNames.SettingsView
        ], migrateRecommendedFiveRoleMatrix);
        MergeRole(roles, "VIEWER", "Viewer", "Pemantauan read-only tanpa izin mengubah atau mengekspor data", 50,
        [
            PermissionNames.DashboardView, PermissionNames.MachinesView, PermissionNames.SparePartsView,
            PermissionNames.MaintenanceView, PermissionNames.SettingsView
        ], migrateRecommendedFiveRoleMatrix);

        rbac["schema_version"] = CurrentSchemaVersion;
        if (migrateRecommendedFiveRoleMatrix)
            rbac["five_role_matrix_migrated_at"] = DateTimeOffset.UtcNow.ToString("O");
    }

    private static void MergeRole(
        JsonArray roles,
        string code,
        string name,
        string description,
        int displayOrder,
        IEnumerable<string> defaults,
        bool replaceExistingPermissions)
    {
        var role = roles.OfType<JsonObject>().FirstOrDefault(item =>
            string.Equals(ReadString(item, "code"), code, StringComparison.OrdinalIgnoreCase));
        if (role is null)
        {
            roles.Add(new JsonObject
            {
                ["code"] = code,
                ["name"] = name,
                ["description"] = description,
                ["display_order"] = displayOrder,
                ["is_system"] = true,
                ["permissions"] = new JsonArray(defaults.OrderBy(item => item).Select(item => (JsonNode?)JsonValue.Create(item)).ToArray())
            });
            return;
        }

        role["name"] = name;
        if (replaceExistingPermissions || role["description"] is null) role["description"] = description;
        role["display_order"] = displayOrder;
        role["is_system"] ??= true;
        if (replaceExistingPermissions || role["permissions"] is null)
            role["permissions"] = new JsonArray(defaults.OrderBy(item => item).Select(item => (JsonNode?)JsonValue.Create(item)).ToArray());
    }

    private static IEnumerable<JsonObject> GetRoles(JsonObject state) =>
        ((state["rbac"] as JsonObject)?["roles"] as JsonArray)?.OfType<JsonObject>() ?? [];

    private static RbacRole ToRole(JsonObject role) => new(
        ReadString(role, "code"),
        ReadString(role, "name"),
        ReadString(role, "description"),
        ReadInt(role, "display_order"),
        role["is_system"]?.GetValue<bool>() ?? true,
        ReadPermissions(role));

    private static string[] ReadPermissions(JsonObject role) =>
        (role["permissions"] as JsonArray)?.Select(item => item?.GetValue<string>() ?? string.Empty)
            .Where(item => item.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(item => item)
            .ToArray() ?? [];

    private static string ReadString(JsonObject? node, string name) => node?[name]?.GetValue<string>()?.Trim() ?? string.Empty;
    private static int ReadInt(JsonObject? node, string name) => node?[name]?.GetValue<int>() ?? 0;
}

internal sealed class RbacBootstrapService(RbacStore store) : IHostedService
{
    public Task StartAsync(CancellationToken cancellationToken) => store.EnsureDefaultsAsync(cancellationToken);
    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

internal sealed class SecurityAuditStore(IWebHostEnvironment environment)
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly string _path = Path.Combine(environment.ContentRootPath, "data", "security-audit.jsonl");

    public async Task WriteAsync(SecurityAuditEntry entry, CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
            await File.AppendAllTextAsync(_path, System.Text.Json.JsonSerializer.Serialize(entry) + Environment.NewLine, cancellationToken);
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<IReadOnlyList<SecurityAuditEntry>> ReadLatestAsync(int limit, CancellationToken cancellationToken)
    {
        var safeLimit = Math.Clamp(limit, 1, 500);
        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (!File.Exists(_path)) return [];
            var lines = await File.ReadAllLinesAsync(_path, cancellationToken);
            var entries = new List<SecurityAuditEntry>(Math.Min(safeLimit, lines.Length));
            for (var index = lines.Length - 1; index >= 0 && entries.Count < safeLimit; index--)
            {
                if (string.IsNullOrWhiteSpace(lines[index])) continue;
                try
                {
                    var entry = System.Text.Json.JsonSerializer.Deserialize<SecurityAuditEntry>(lines[index]);
                    if (entry is not null) entries.Add(entry);
                }
                catch (System.Text.Json.JsonException)
                {
                    // Keep the readable audit history available even if one legacy line is malformed.
                }
            }
            return entries;
        }
        finally
        {
            _gate.Release();
        }
    }
}

internal static class RbacApi
{
    public static void MapRbacApi(this WebApplication app)
    {
        app.MapGet("/api/rbac", async (HttpContext context, RbacStore store, CancellationToken cancellationToken) =>
            Results.Ok(await store.GetSnapshotAsync(context.User, cancellationToken)))
            .RequirePermission(PermissionNames.UsersManage);

        app.MapGet("/api/security/audit", async (
            int? limit,
            SecurityAuditStore auditStore,
            CancellationToken cancellationToken) =>
            Results.Ok(new
            {
                status = "success",
                entries = await auditStore.ReadLatestAsync(limit ?? 100, cancellationToken)
            }))
            .RequirePermission(PermissionNames.AuditView);

        app.MapPut("/api/rbac/roles/{roleCode}", async (
            string roleCode,
            UpdateRolePermissionsRequest request,
            HttpContext context,
            RbacStore store,
            SecurityAuditStore auditStore,
            CancellationToken cancellationToken) =>
        {
            var result = await store.UpdateRoleAsync(roleCode, request, context.User, cancellationToken);
            if (!result.IsSuccess)
                return Results.Json(new { status = "error", message = result.Error }, statusCode: result.StatusCode);

            var access = await store.GetCurrentAccessAsync(context.User, cancellationToken);
            await auditStore.WriteAsync(new SecurityAuditEntry(
                DateTimeOffset.UtcNow,
                access?.Username ?? "unknown",
                access?.Role ?? "UNKNOWN",
                "RBAC_ROLE_UPDATED",
                roleCode.ToUpperInvariant(),
                "SUCCESS"), cancellationToken);
            return Results.Ok(new { status = "success", message = "Matriks permission berhasil disimpan.", role = result.Role });
        }).RequirePermission(PermissionNames.RbacManage);
    }
}

internal sealed record RbacAccess(int UserId, string Username, string FullName, string Role, string[] Permissions);
internal sealed record RbacSnapshot(
    [property: JsonPropertyName("schema_version")] int SchemaVersion,
    [property: JsonPropertyName("permissions")] IReadOnlyList<PermissionDefinition> Permissions,
    [property: JsonPropertyName("roles")] IReadOnlyList<RbacRole> Roles,
    [property: JsonPropertyName("current_permissions")] IReadOnlyList<string> CurrentPermissions);
internal sealed record RbacRole(string Code, string Name, string Description, int DisplayOrder, bool IsSystem, string[] Permissions);
internal sealed record UpdateRolePermissionsRequest(string? Description, string[]? Permissions);
internal sealed record SecurityAuditEntry(DateTimeOffset Timestamp, string Username, string Role, string Action, string Resource, string Result);

internal sealed record RbacRoleResult(bool IsSuccess, int StatusCode, string? Error, RbacRole? Role)
{
    public static RbacRoleResult Success(RbacRole role) => new(true, StatusCodes.Status200OK, null, role);
    public static RbacRoleResult Invalid(string error) => new(false, StatusCodes.Status400BadRequest, error, null);
    public static RbacRoleResult NotFound(string error) => new(false, StatusCodes.Status404NotFound, error, null);
}
