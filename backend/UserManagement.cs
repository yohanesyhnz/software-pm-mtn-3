using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

internal static partial class UserManagementApi
{
    private static readonly HashSet<string> AllowedRoles =
        new(StringComparer.OrdinalIgnoreCase) { "ADMIN", "SUPERVISOR", "TECHNICIAN" };

    public static void MapUserManagementApi(this WebApplication app)
    {
        app.MapPost("/api/users", CreateUserAsync);
        app.MapPut("/api/users/{id:int}", UpdateUserAsync);
        app.MapDelete("/api/users/{id:int}", DeleteUserAsync);
    }

    private static async Task<IResult> CreateUserAsync(
        UserMutationRequest request,
        StateStore stateStore,
        LocalUserCredentialStore credentialStore,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateRequest(request, passwordRequired: true);
        if (validationError is not null)
            return Results.BadRequest(Error(validationError));

        var username = request.Username!.Trim();
        var fullName = request.FullName!.Trim();
        var role = request.Role!.Trim().ToUpperInvariant();

        var mutation = await stateStore.UpdateAsync(state =>
        {
            var users = GetOrCreateUsers(state);
            if (FindByUsername(users, username) is not null)
                return UserMutationResult.Conflict("Username sudah digunakan oleh akun lain.");

            var nextId = users
                .Select(item => ReadId(item as JsonObject))
                .DefaultIfEmpty(0)
                .Max() + 1;

            var user = CreateUserNode(nextId, username, fullName, role);
            users.Add(user);
            return UserMutationResult.Success(ToResponse(user));
        }, cancellationToken);

        if (!mutation.IsSuccess)
            return Results.Json(Error(mutation.ErrorMessage!), statusCode: mutation.StatusCode);

        try
        {
            await credentialStore.SetPasswordAsync(username, request.Password!, cancellationToken);
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
        {
            await stateStore.UpdateAsync(state =>
            {
                var users = GetOrCreateUsers(state);
                var created = FindById(users, mutation.User!.Id);
                if (created is not null)
                    users.Remove(created);
                return true;
            }, cancellationToken);

            loggerFactory.CreateLogger("UserManagement")
                .LogError(exception, "Failed to persist credentials for managed user {Username}.", username);
            return Results.Json(
                Error("Akun tidak dapat disimpan karena penyimpanan kredensial tidak tersedia."),
                statusCode: StatusCodes.Status500InternalServerError);
        }

        return Results.Ok(new
        {
            status = "success",
            message = "User baru berhasil disimpan dan siap digunakan untuk login.",
            user = mutation.User
        });
    }

    private static async Task<IResult> UpdateUserAsync(
        int id,
        UserMutationRequest request,
        StateStore stateStore,
        LocalUserCredentialStore credentialStore,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateRequest(request, passwordRequired: false);
        if (validationError is not null)
            return Results.BadRequest(Error(validationError));

        var username = request.Username!.Trim();
        var fullName = request.FullName!.Trim();
        var role = request.Role!.Trim().ToUpperInvariant();

        var mutation = await stateStore.UpdateAsync(state =>
        {
            var users = GetOrCreateUsers(state);
            var existing = FindById(users, id);
            if (existing is null)
                return UserMutationResult.NotFound("User yang akan diubah tidak ditemukan.");

            var duplicate = FindByUsername(users, username);
            if (duplicate is not null && ReadId(duplicate) != id)
                return UserMutationResult.Conflict("Username sudah digunakan oleh akun lain.");

            var previousUsername = ReadString(existing, "username");
            if (!string.Equals(previousUsername, username, StringComparison.OrdinalIgnoreCase) &&
                string.IsNullOrEmpty(request.Password))
            {
                return UserMutationResult.BadRequest("Password wajib diisi ketika username diubah.");
            }

            var previous = ToResponse(existing);
            existing["username"] = username;
            existing["full_name"] = fullName;
            existing["role"] = role;
            existing["password"] = string.Empty;

            return UserMutationResult.Success(ToResponse(existing), previous, previousUsername);
        }, cancellationToken);

        if (!mutation.IsSuccess)
            return Results.Json(Error(mutation.ErrorMessage!), statusCode: mutation.StatusCode);

        try
        {
            if (!string.IsNullOrEmpty(request.Password))
            {
                await credentialStore.SetPasswordAsync(username, request.Password, cancellationToken);
                if (!string.Equals(mutation.PreviousUsername, username, StringComparison.OrdinalIgnoreCase))
                    await credentialStore.RemoveAsync(mutation.PreviousUsername!, cancellationToken);
            }
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
        {
            var previous = mutation.PreviousUser!;
            await stateStore.UpdateAsync(state =>
            {
                var users = GetOrCreateUsers(state);
                var current = FindById(users, id);
                if (current is not null)
                {
                    current["username"] = previous.Username;
                    current["full_name"] = previous.FullName;
                    current["role"] = previous.Role;
                }
                return true;
            }, cancellationToken);

            loggerFactory.CreateLogger("UserManagement")
                .LogError(exception, "Failed to update credentials for managed user {Username}.", username);
            return Results.Json(
                Error("Perubahan user dibatalkan karena kredensial tidak dapat disimpan."),
                statusCode: StatusCodes.Status500InternalServerError);
        }

        return Results.Ok(new
        {
            status = "success",
            message = "Data user berhasil diperbarui.",
            user = mutation.User
        });
    }

    private static async Task<IResult> DeleteUserAsync(
        int id,
        StateStore stateStore,
        LocalUserCredentialStore credentialStore,
        ILoggerFactory loggerFactory,
        CancellationToken cancellationToken)
    {
        var mutation = await stateStore.UpdateAsync(state =>
        {
            var users = GetOrCreateUsers(state);
            var existing = FindById(users, id);
            if (existing is null)
                return UserMutationResult.NotFound("User yang akan dihapus tidak ditemukan.");

            var removed = ToResponse(existing);
            users.Remove(existing);
            return UserMutationResult.Success(removed, previousUsername: removed.Username);
        }, cancellationToken);

        if (!mutation.IsSuccess)
            return Results.Json(Error(mutation.ErrorMessage!), statusCode: mutation.StatusCode);

        try
        {
            await credentialStore.RemoveAsync(mutation.PreviousUsername!, cancellationToken);
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
        {
            loggerFactory.CreateLogger("UserManagement")
                .LogWarning(exception, "Orphaned credential cleanup failed for user {Username}.", mutation.PreviousUsername);
        }

        return Results.Ok(new { status = "success", message = "User berhasil dihapus." });
    }

    private static object Error(string message) => new { status = "error", message };

    private static string? ValidateRequest(UserMutationRequest request, bool passwordRequired)
    {
        var username = request.Username?.Trim() ?? string.Empty;
        var fullName = request.FullName?.Trim() ?? string.Empty;
        var role = request.Role?.Trim() ?? string.Empty;

        if (!UsernamePattern().IsMatch(username))
            return "Username harus 2–64 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda minus.";
        if (fullName.Length is < 2 or > 100)
            return "Nama lengkap harus terdiri dari 2–100 karakter.";
        if (!AllowedRoles.Contains(role))
            return "Role user tidak valid.";
        if (passwordRequired && string.IsNullOrEmpty(request.Password))
            return "Password/PIN wajib diisi untuk user baru.";
        if (!string.IsNullOrEmpty(request.Password) && request.Password.Length is < 4 or > 128)
            return "Password/PIN harus terdiri dari 4–128 karakter.";

        return null;
    }

    private static JsonArray GetOrCreateUsers(JsonObject state)
    {
        if (state["users"] is JsonArray users)
            return users;

        users = new JsonArray();
        state["users"] = users;
        return users;
    }

    private static JsonObject? FindByUsername(JsonArray users, string username) =>
        users.Select(item => item as JsonObject).FirstOrDefault(user =>
            string.Equals(ReadString(user, "username"), username, StringComparison.OrdinalIgnoreCase));

    private static JsonObject? FindById(JsonArray users, int id) =>
        users.Select(item => item as JsonObject).FirstOrDefault(user => ReadId(user) == id);

    private static int ReadId(JsonObject? user) =>
        user?["id"] is JsonValue id && id.TryGetValue<int>(out var value) ? value : 0;

    private static string ReadString(JsonObject? user, string propertyName) =>
        user?[propertyName]?.GetValue<string>() ?? string.Empty;

    private static JsonObject CreateUserNode(int id, string username, string fullName, string role) => new()
    {
        ["id"] = id,
        ["username"] = username,
        ["password"] = string.Empty,
        ["role"] = role,
        ["full_name"] = fullName
    };

    private static ManagedUserResponse ToResponse(JsonObject user) => new(
        ReadId(user),
        ReadString(user, "username"),
        ReadString(user, "full_name"),
        ReadString(user, "role"));

    [GeneratedRegex("^[A-Za-z0-9._-]{2,64}$", RegexOptions.CultureInvariant)]
    private static partial Regex UsernamePattern();
}

internal sealed class LocalUserCredentialStore(IWebHostEnvironment environment)
{
    private const int Iterations = 210_000;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly string _path = Path.Combine(environment.ContentRootPath, "data", "local-user-credentials.json");

    public async Task<string?> GetHashAsync(string username, CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var credentials = await ReadUnsafeAsync(cancellationToken);
            return credentials.TryGetValue(username, out var hash) ? hash : null;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task SetPasswordAsync(string username, string password, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(username);
        ArgumentException.ThrowIfNullOrEmpty(password);

        var salt = RandomNumberGenerator.GetBytes(16);
        var derived = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            32);
        var encoded = $"pbkdf2-sha256${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(derived)}";

        await _gate.WaitAsync(cancellationToken);
        try
        {
            var credentials = await ReadUnsafeAsync(cancellationToken);
            credentials[username] = encoded;
            await WriteUnsafeAsync(credentials, cancellationToken);
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task RemoveAsync(string username, CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var credentials = await ReadUnsafeAsync(cancellationToken);
            if (credentials.Remove(username))
                await WriteUnsafeAsync(credentials, cancellationToken);
        }
        finally
        {
            _gate.Release();
        }
    }

    public static bool VerifyPassword(string password, string? encodedHash)
    {
        if (string.IsNullOrWhiteSpace(encodedHash))
            return false;

        var parts = encodedHash.Split('$');
        if (parts.Length != 4 || parts[0] != "pbkdf2-sha256" || !int.TryParse(parts[1], out var iterations))
            return false;

        try
        {
            var salt = Convert.FromBase64String(parts[2]);
            var expected = Convert.FromBase64String(parts[3]);
            var actual = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                iterations,
                HashAlgorithmName.SHA256,
                expected.Length);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private async Task<Dictionary<string, string>> ReadUnsafeAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(_path))
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        try
        {
            await using var stream = File.OpenRead(_path);
            var persisted = await JsonSerializer.DeserializeAsync<Dictionary<string, string>>(
                stream,
                cancellationToken: cancellationToken);
            return new Dictionary<string, string>(
                persisted ?? new Dictionary<string, string>(),
                StringComparer.OrdinalIgnoreCase);
        }
        catch (JsonException)
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }
    }

    private async Task WriteUnsafeAsync(
        Dictionary<string, string> credentials,
        CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
        var temporaryPath = _path + ".tmp";
        await File.WriteAllTextAsync(
            temporaryPath,
            JsonSerializer.Serialize(credentials, new JsonSerializerOptions { WriteIndented = true }),
            cancellationToken);
        File.Move(temporaryPath, _path, true);

        if (!OperatingSystem.IsWindows())
        {
            File.SetUnixFileMode(_path, UnixFileMode.UserRead | UnixFileMode.UserWrite);
        }
    }
}

internal sealed record UserMutationRequest(
    [property: JsonPropertyName("username")] string? Username,
    [property: JsonPropertyName("full_name")] string? FullName,
    [property: JsonPropertyName("password")] string? Password,
    [property: JsonPropertyName("role")] string? Role);

internal sealed record ManagedUserResponse(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("full_name")] string FullName,
    [property: JsonPropertyName("role")] string Role);

internal sealed record UserMutationResult(
    bool IsSuccess,
    int StatusCode,
    string? ErrorMessage,
    ManagedUserResponse? User,
    ManagedUserResponse? PreviousUser,
    string? PreviousUsername)
{
    public static UserMutationResult Success(
        ManagedUserResponse user,
        ManagedUserResponse? previousUser = null,
        string? previousUsername = null) =>
        new(true, StatusCodes.Status200OK, null, user, previousUser, previousUsername);

    public static UserMutationResult BadRequest(string message) =>
        new(false, StatusCodes.Status400BadRequest, message, null, null, null);

    public static UserMutationResult Conflict(string message) =>
        new(false, StatusCodes.Status409Conflict, message, null, null, null);

    public static UserMutationResult NotFound(string message) =>
        new(false, StatusCodes.Status404NotFound, message, null, null, null);
}
