using System.IO.Compression;
using System.Text.Json;

public static class VersionManagementApi
{
    public static IEndpointRouteBuilder MapVersionManagementApi(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/software-versions");

        group.MapGet("/", async (
            string? search,
            string? status,
            VersionManagementStore store,
            CancellationToken cancellationToken) =>
        {
            var versions = await store.GetVersionsAsync(cancellationToken);
            var filtered = versions
                .Where(version => string.IsNullOrWhiteSpace(search)
                    || version.Version.Contains(search, StringComparison.OrdinalIgnoreCase)
                    || version.Build.Contains(search, StringComparison.OrdinalIgnoreCase)
                    || version.Developer.Contains(search, StringComparison.OrdinalIgnoreCase)
                    || version.Description.Contains(search, StringComparison.OrdinalIgnoreCase))
                .Where(version => string.IsNullOrWhiteSpace(status)
                    || status.Equals("all", StringComparison.OrdinalIgnoreCase)
                    || version.Status.Equals(status, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(version => SemanticVersion.Parse(version.Version))
                .ThenByDescending(version => version.ReleaseDate)
                .ToArray();

            return Results.Ok(filtered);
        });

        group.MapGet("/current", async (VersionManagementStore store, CancellationToken cancellationToken) =>
        {
            var current = await store.GetCurrentAsync(cancellationToken);
            return current is null ? Results.NotFound() : Results.Ok(current);
        });

        group.MapGet("/update-check", async (
            string? current,
            VersionManagementStore store,
            CancellationToken cancellationToken) =>
        {
            var versions = await store.GetVersionsAsync(cancellationToken);
            var latest = versions
                .Where(version => version.Status is "Current" or "Available")
                .OrderByDescending(version => SemanticVersion.Parse(version.Version))
                .FirstOrDefault();
            var currentVersion = SemanticVersion.Parse(current ?? "0.0.0");
            var available = latest is not null && SemanticVersion.Parse(latest.Version) > currentVersion;

            return Results.Ok(new
            {
                updateAvailable = available,
                currentVersion = current,
                latestVersion = latest?.Version,
                latest,
                checkedAt = DateTimeOffset.Now
            });
        });

        group.MapGet("/audit", async (VersionManagementStore store, CancellationToken cancellationToken) =>
            Results.Ok(await store.GetAuditAsync(cancellationToken)));

        group.MapGet("/{version}", async (
            string version,
            VersionManagementStore store,
            CancellationToken cancellationToken) =>
        {
            var item = await store.FindAsync(version, cancellationToken);
            return item is null ? Results.NotFound() : Results.Ok(item);
        });

        group.MapPost("/", async (
            SoftwareVersion version,
            VersionManagementStore store,
            CancellationToken cancellationToken) =>
        {
            var validation = VersionRules.Validate(version.Version);
            if (validation is not null)
                return Results.BadRequest(new { message = validation });

            var created = await store.AddAsync(version, cancellationToken);
            return created
                ? Results.Created($"/api/software-versions/{version.Version}", version)
                : Results.Conflict(new { message = $"Version {version.Version} already exists." });
        });

        group.MapPost("/{version}/backup", async (
            string version,
            BackupRequest request,
            VersionManagementStore store,
            VersionBackupService backups,
            CancellationToken cancellationToken) =>
        {
            var item = await store.FindAsync(version, cancellationToken);
            if (item is null)
                return Results.NotFound();

            var backup = await backups.CreateAsync(version, cancellationToken);
            await store.AppendAuditAsync(new VersionAuditEntry
            {
                Date = DateOnly.FromDateTime(DateTime.Now),
                Time = TimeOnly.FromDateTime(DateTime.Now),
                User = request.User,
                OldVersion = (await store.GetCurrentAsync(cancellationToken))?.Version ?? "Unknown",
                NewVersion = version,
                Action = "Backup",
                Notes = request.Notes ?? "Pre-update backup completed.",
                Status = "Success",
                BackupFile = backup
            }, cancellationToken);

            return Results.Ok(new { status = "success", backupFile = backup });
        });

        group.MapPost("/{version}/install", async (
            string version,
            InstallVersionRequest request,
            VersionManagementStore store,
            VersionBackupService backups,
            CancellationToken cancellationToken) =>
        {
            var target = await store.FindAsync(version, cancellationToken);
            if (target is null)
                return Results.NotFound();

            var current = await store.GetCurrentAsync(cancellationToken);
            var snapshot = await store.ExportVersionsJsonAsync(cancellationToken);
            string? backupFile = null;

            try
            {
                if (request.BackupBeforeUpdate)
                    backupFile = await backups.CreateAsync(version, cancellationToken);

                await store.SetCurrentAsync(version, cancellationToken);
                await store.AppendAuditAsync(new VersionAuditEntry
                {
                    Date = DateOnly.FromDateTime(DateTime.Now),
                    Time = TimeOnly.FromDateTime(DateTime.Now),
                    User = request.User,
                    OldVersion = current?.Version ?? "Unknown",
                    NewVersion = version,
                    Action = "Update",
                    Notes = request.Notes ?? target.Description,
                    Status = "Success",
                    BackupFile = backupFile
                }, cancellationToken);

                return Results.Ok(new
                {
                    status = "success",
                    previousVersion = current?.Version,
                    currentVersion = version,
                    backupFile
                });
            }
            catch (Exception exception)
            {
                try
                {
                    if (backupFile is not null)
                        await backups.RestoreAsync(backupFile, cancellationToken);
                    else
                        await store.ImportVersionsJsonAsync(snapshot, cancellationToken);
                }
                catch
                {
                    await store.ImportVersionsJsonAsync(snapshot, cancellationToken);
                }
                await store.AppendAuditAsync(new VersionAuditEntry
                {
                    Date = DateOnly.FromDateTime(DateTime.Now),
                    Time = TimeOnly.FromDateTime(DateTime.Now),
                    User = request.User,
                    OldVersion = current?.Version ?? "Unknown",
                    NewVersion = version,
                    Action = "Automatic Rollback",
                    Notes = exception.Message,
                    Status = "Rolled Back",
                    BackupFile = backupFile
                }, cancellationToken);
                return Results.Problem("Update failed and the previous version was restored.");
            }
        });

        return endpoints;
    }
}

public sealed class VersionManagementStore(IWebHostEnvironment environment)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly string _versionsPath = Path.Combine(environment.ContentRootPath, "data", "software-versions.json");
    private readonly string _auditPath = Path.Combine(environment.ContentRootPath, "data", "software-version-audit.json");
    private readonly string _releaseManifestPath = Path.Combine(environment.ContentRootPath, "version.json");
    private bool _initialized;

    public async Task<IReadOnlyList<SoftwareVersion>> GetVersionsAsync(CancellationToken cancellationToken)
    {
        await EnsureSeededAsync(cancellationToken);
        await _gate.WaitAsync(cancellationToken);
        try
        {
            return await ReadAsync<List<SoftwareVersion>>(_versionsPath, cancellationToken) ?? [];
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<SoftwareVersion?> GetCurrentAsync(CancellationToken cancellationToken) =>
        (await GetVersionsAsync(cancellationToken)).FirstOrDefault(version => version.Status == "Current");

    public async Task<SoftwareVersion?> FindAsync(string version, CancellationToken cancellationToken) =>
        (await GetVersionsAsync(cancellationToken)).FirstOrDefault(item =>
            item.Version.Equals(VersionRules.Normalize(version), StringComparison.OrdinalIgnoreCase));

    public async Task<IReadOnlyList<VersionAuditEntry>> GetAuditAsync(CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            return (await ReadAsync<List<VersionAuditEntry>>(_auditPath, cancellationToken) ?? [])
                .OrderByDescending(item => item.Date)
                .ThenByDescending(item => item.Time)
                .ToArray();
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<bool> AddAsync(SoftwareVersion version, CancellationToken cancellationToken)
    {
        await EnsureSeededAsync(cancellationToken);
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var versions = await ReadAsync<List<SoftwareVersion>>(_versionsPath, cancellationToken) ?? [];
            version.Version = VersionRules.Normalize(version.Version);
            if (versions.Any(item => item.Version.Equals(version.Version, StringComparison.OrdinalIgnoreCase)))
                return false;

            versions.Add(version);
            await WriteAsync(_versionsPath, versions, cancellationToken);
            return true;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task SetCurrentAsync(string version, CancellationToken cancellationToken)
    {
        await EnsureSeededAsync(cancellationToken);
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var versions = await ReadAsync<List<SoftwareVersion>>(_versionsPath, cancellationToken) ?? [];
            var normalized = VersionRules.Normalize(version);
            foreach (var item in versions)
            {
                if (item.Version.Equals(normalized, StringComparison.OrdinalIgnoreCase))
                    item.Status = "Current";
                else if (item.Status == "Current")
                    item.Status = "Superseded";
            }
            await WriteAsync(_versionsPath, versions, cancellationToken);
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task AppendAuditAsync(VersionAuditEntry entry, CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var audit = await ReadAsync<List<VersionAuditEntry>>(_auditPath, cancellationToken) ?? [];
            audit.Add(entry);
            await WriteAsync(_auditPath, audit, cancellationToken);
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task<string> ExportVersionsJsonAsync(CancellationToken cancellationToken)
    {
        await EnsureSeededAsync(cancellationToken);
        return await File.ReadAllTextAsync(_versionsPath, cancellationToken);
    }

    public async Task ImportVersionsJsonAsync(string json, CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(_versionsPath)!);
            await File.WriteAllTextAsync(_versionsPath, json, cancellationToken);
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task EnsureSeededAsync(CancellationToken cancellationToken)
    {
        if (_initialized)
            return;

        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (_initialized)
                return;

            if (!File.Exists(_versionsPath))
            {
                Directory.CreateDirectory(Path.GetDirectoryName(_versionsPath)!);
                await WriteAsync(_versionsPath, SeedVersions.Create(), cancellationToken);
            }

            if (File.Exists(_releaseManifestPath))
                await ReconcileReleaseManifestAsync(cancellationToken);

            _initialized = true;
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task ReconcileReleaseManifestAsync(CancellationToken cancellationToken)
    {
        var manifest = await ReadAsync<ReleaseVersionManifest>(_releaseManifestPath, cancellationToken);
        if (manifest is null || !SemanticVersion.TryParse(manifest.Version, out _))
            return;

        var versions = await ReadAsync<List<SoftwareVersion>>(_versionsPath, cancellationToken) ?? [];
        var normalized = VersionRules.Normalize(manifest.Version);
        var existing = versions.FirstOrDefault(item => item.Version.Equals(normalized, StringComparison.OrdinalIgnoreCase));
        var previous = versions.FirstOrDefault(item => item.Status == "Current");
        var releaseDate = DateOnly.TryParse(manifest.ReleaseDate, out var parsedDate)
            ? parsedDate
            : DateOnly.FromDateTime(File.GetLastWriteTime(_releaseManifestPath));
        var releaseTime = TimeOnly.FromDateTime(File.GetLastWriteTime(_releaseManifestPath));

        foreach (var item in versions.Where(item => item.Status == "Current" && !item.Version.Equals(normalized, StringComparison.OrdinalIgnoreCase)))
            item.Status = "Superseded";

        if (existing is null)
        {
            existing = new SoftwareVersion
            {
                Version = normalized,
                Build = manifest.Build,
                ReleaseDate = releaseDate,
                ReleaseTime = releaseTime,
                Status = "Current",
                Description = manifest.Summary,
                ChangeLog = new ChangeLog
                {
                    NewFeatures = manifest.Changes.NewFeatures,
                    Improvements = manifest.Changes.Improvements,
                    BugFixes = manifest.Changes.Fixed,
                    SecurityUpdates = [],
                    DatabaseChanges = manifest.Bump == "major" ? manifest.Changes.BreakingChanges : [],
                    ApiChanges = [],
                    UiChanges = [],
                    PerformanceImprovements = manifest.Changes.Optimizations,
                    KnownIssues = manifest.Changes.KnownIssues
                }
            };
            versions.Add(existing);

            var audit = await ReadAsync<List<VersionAuditEntry>>(_auditPath, cancellationToken) ?? [];
            audit.Add(new VersionAuditEntry
            {
                Date = releaseDate,
                Time = releaseTime,
                User = "Codex / GitHub",
                OldVersion = previous?.Version ?? manifest.PreviousVersion,
                NewVersion = normalized,
                Action = "Source Synchronization",
                Notes = manifest.Summary,
                Status = "Success"
            });
            await WriteAsync(_auditPath, audit, cancellationToken);
        }
        else
        {
            existing.Status = "Current";
            existing.Build = manifest.Build;
            existing.Description = manifest.Summary;
        }

        await WriteAsync(_versionsPath, versions, cancellationToken);
    }

    private static async Task<T?> ReadAsync<T>(string path, CancellationToken cancellationToken)
    {
        if (!File.Exists(path))
            return default;
        await using var stream = File.OpenRead(path);
        return await JsonSerializer.DeserializeAsync<T>(stream, JsonOptions, cancellationToken);
    }

    private static async Task WriteAsync<T>(string path, T value, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        var temporary = path + ".tmp";
        await using (var stream = File.Create(temporary))
            await JsonSerializer.SerializeAsync(stream, value, JsonOptions, cancellationToken);
        File.Move(temporary, path, true);
    }
}

public sealed class VersionBackupService(IWebHostEnvironment environment)
{
    public async Task<string> CreateAsync(string targetVersion, CancellationToken cancellationToken)
    {
        var dataDirectory = Path.Combine(environment.ContentRootPath, "data");
        var backupDirectory = Path.Combine(dataDirectory, "backups");
        Directory.CreateDirectory(backupDirectory);
        var fileName = $"cmms-backup-{DateTime.Now:yyyyMMdd-HHmmss}-before-{VersionRules.Normalize(targetVersion)}.zip";
        var archivePath = Path.Combine(backupDirectory, fileName);
        var temporaryPath = archivePath + ".tmp";

        await Task.Run(() =>
        {
            using var archive = ZipFile.Open(temporaryPath, ZipArchiveMode.Create);
            var includedFiles = new List<string>();
            foreach (var source in Directory.EnumerateFiles(dataDirectory, "*.json", SearchOption.TopDirectoryOnly))
            {
                var entryName = $"data/{Path.GetFileName(source)}";
                archive.CreateEntryFromFile(source, entryName, CompressionLevel.Optimal);
                includedFiles.Add(entryName);
            }

            var configurationCandidates = new[]
            {
                Path.Combine(environment.ContentRootPath, "appsettings.json"),
                Path.Combine(environment.ContentRootPath, "backend", "appsettings.json")
            }.Where(File.Exists).Distinct(StringComparer.OrdinalIgnoreCase);

            foreach (var source in configurationCandidates)
            {
                var entryName = $"configuration/{Path.GetFileName(source)}";
                archive.CreateEntryFromFile(source, entryName, CompressionLevel.Optimal);
                includedFiles.Add(entryName);
            }

            var manifest = JsonSerializer.SerializeToUtf8Bytes(new
            {
                createdAt = DateTimeOffset.Now,
                targetVersion = VersionRules.Normalize(targetVersion),
                includes = new[] { "Database state", "Configuration", "Master data", "User settings", "Version metadata", "Audit trail" },
                files = includedFiles
            }, new JsonSerializerOptions(JsonSerializerDefaults.Web) { WriteIndented = true });
            var manifestEntry = archive.CreateEntry("backup-manifest.json", CompressionLevel.Optimal);
            using var manifestStream = manifestEntry.Open();
            manifestStream.Write(manifest);
        }, cancellationToken);

        File.Move(temporaryPath, archivePath, true);

        return fileName;
    }

    public async Task RestoreAsync(string backupFile, CancellationToken cancellationToken)
    {
        var dataDirectory = Path.Combine(environment.ContentRootPath, "data");
        var backupPath = Path.Combine(dataDirectory, "backups", Path.GetFileName(backupFile));
        if (!File.Exists(backupPath))
            throw new FileNotFoundException("Rollback backup was not found.", backupPath);

        await Task.Run(() =>
        {
            using var archive = ZipFile.OpenRead(backupPath);
            foreach (var entry in archive.Entries.Where(item => item.FullName.StartsWith("data/", StringComparison.OrdinalIgnoreCase)))
            {
                var fileName = Path.GetFileName(entry.FullName);
                if (string.IsNullOrWhiteSpace(fileName)) continue;
                var destination = Path.Combine(dataDirectory, fileName);
                var temporary = destination + ".rollback.tmp";
                entry.ExtractToFile(temporary, true);
                File.Move(temporary, destination, true);
            }
        }, cancellationToken);
    }
}

public sealed class SoftwareVersion
{
    public string Version { get; set; } = "V1.0.0";
    public string Build { get; set; } = "20260804.1";
    public DateOnly ReleaseDate { get; set; }
    public TimeOnly ReleaseTime { get; set; }
    public string Developer { get; set; } = "PredictaCore Engineering";
    public string BuildEnvironment { get; set; } = "Production";
    public string DatabaseVersion { get; set; } = "PostgreSQL 16";
    public string ApiVersion { get; set; } = "v2";
    public string FrontendVersion { get; set; } = "Next.js 16.3.0";
    public string BackendVersion { get; set; } = ".NET 10.0.10";
    public string PostgreSqlVersion { get; set; } = "16";
    public string PlcDriverVersion { get; set; } = "PredictaCore PLC Driver 2.0";
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Available";
    public string License { get; set; } = "Proprietary";
    public string Copyright { get; set; } = "© 2026 PT. Dankosfarma / PredictaCore";
    public ChangeLog ChangeLog { get; set; } = new();
}

public sealed class ChangeLog
{
    public string[] NewFeatures { get; set; } = [];
    public string[] Improvements { get; set; } = [];
    public string[] BugFixes { get; set; } = [];
    public string[] SecurityUpdates { get; set; } = [];
    public string[] DatabaseChanges { get; set; } = [];
    public string[] ApiChanges { get; set; } = [];
    public string[] UiChanges { get; set; } = [];
    public string[] PerformanceImprovements { get; set; } = [];
    public string[] KnownIssues { get; set; } = [];
}

public sealed class ReleaseVersionManifest
{
    public string Version { get; set; } = "v1.0.0";
    public string PreviousVersion { get; set; } = string.Empty;
    public string Build { get; set; } = string.Empty;
    public string ReleaseDate { get; set; } = string.Empty;
    public string CommitType { get; set; } = string.Empty;
    public string Bump { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public ReleaseManifestChanges Changes { get; set; } = new();
}

public sealed class ReleaseManifestChanges
{
    public string[] NewFeatures { get; set; } = [];
    public string[] Improvements { get; set; } = [];
    public string[] Fixed { get; set; } = [];
    public string[] Optimizations { get; set; } = [];
    public string[] BreakingChanges { get; set; } = [];
    public string[] KnownIssues { get; set; } = [];
    public string[] Documentation { get; set; } = [];
}

public sealed class VersionAuditEntry
{
    public DateOnly Date { get; set; }
    public TimeOnly Time { get; set; }
    public string User { get; set; } = "Administrator";
    public string OldVersion { get; set; } = string.Empty;
    public string NewVersion { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? BackupFile { get; set; }
}

public sealed record BackupRequest(string User = "Administrator", string? Notes = null);
public sealed record InstallVersionRequest(string User = "Administrator", bool BackupBeforeUpdate = true, string? Notes = null);

public static class VersionRules
{
    public static string Normalize(string version) =>
        $"V{version.Trim().TrimStart('V', 'v')}";

    public static string? Validate(string version) =>
        SemanticVersion.TryParse(version, out _) ? null : "Version must use Major.Minor.Patch format, for example V2.1.0.";
}

public readonly record struct SemanticVersion(int Major, int Minor, int Patch) : IComparable<SemanticVersion>
{
    public static SemanticVersion Parse(string value) =>
        TryParse(value, out var parsed) ? parsed : new SemanticVersion();

    public static bool TryParse(string value, out SemanticVersion parsed)
    {
        parsed = new SemanticVersion();
        var parts = value.Trim().TrimStart('V', 'v').Split('.');
        if (parts.Length != 3
            || !int.TryParse(parts[0], out var major)
            || !int.TryParse(parts[1], out var minor)
            || !int.TryParse(parts[2], out var patch))
            return false;
        parsed = new SemanticVersion(major, minor, patch);
        return true;
    }

    public int CompareTo(SemanticVersion other)
    {
        var major = Major.CompareTo(other.Major);
        if (major != 0) return major;
        var minor = Minor.CompareTo(other.Minor);
        return minor != 0 ? minor : Patch.CompareTo(other.Patch);
    }

    public static bool operator >(SemanticVersion left, SemanticVersion right) => left.CompareTo(right) > 0;
    public static bool operator <(SemanticVersion left, SemanticVersion right) => left.CompareTo(right) < 0;
}

public static class SeedVersions
{
    public static List<SoftwareVersion> Create() =>
    [
        new SoftwareVersion
        {
            Version = "V2.0.0",
            Build = "20260804.1",
            ReleaseDate = new DateOnly(2026, 8, 4),
            ReleaseTime = new TimeOnly(12, 0),
            Status = "Current",
            Description = "Modernisasi arsitektur CMMS dan Software Version Management.",
            ChangeLog = new ChangeLog
            {
                NewFeatures = ["Software Version History", "Release Notes", "About Software", "Update Checker", "Backup dan rollback otomatis", "Audit trail versi"],
                Improvements = ["Frontend Next.js App Router", "Backend ASP.NET Core Web API"],
                BugFixes = ["Normalisasi persistence state terpusat"],
                SecurityUpdates = ["Backup wajib sebelum update", "Audit setiap perubahan versi"],
                DatabaseChanges = ["Penyimpanan metadata versi dan audit trail"],
                ApiChanges = ["API Software Version Management v2"],
                UiChanges = ["Halaman SCADA modern dengan pencarian dan filter"],
                PerformanceImprovements = ["Static rendering Next.js", "State persistence atomik"],
                KnownIssues = ["Polling PostgreSQL produksi memerlukan koneksi jaringan NAS/pabrik"]
            }
        },
        new SoftwareVersion
        {
            Version = "V1.8.5",
            Build = "20260803.62",
            ReleaseDate = new DateOnly(2026, 8, 3),
            ReleaseTime = new TimeOnly(17, 30),
            Status = "Superseded",
            FrontendVersion = "Static HTML/CSS/JavaScript",
            BackendVersion = "PHP 8 / Node.js compatibility",
            ApiVersion = "v1",
            Description = "Baseline CMMS Preventive Maintenance sebelum modernisasi arsitektur.",
            ChangeLog = new ChangeLog
            {
                NewFeatures = ["Dashboard KPI", "Monitoring running hours", "Integrasi PLC"],
                Improvements = ["Visualisasi SCADA PredictaCore"],
                BugFixes = ["Perbaikan refresh realtime PostgreSQL", "Perbaikan status running dan counter"],
                SecurityUpdates = ["Validasi endpoint dasar"],
                DatabaseChanges = ["Setup PostgreSQL produksi"],
                ApiChanges = ["Endpoint api.php dan sse.php"],
                UiChanges = ["Dashboard desktop dan simulator mobile"],
                PerformanceImprovements = ["Optimasi polling telemetry"],
                KnownIssues = ["Arsitektur frontend belum modular"]
            }
        }
    ];
}
