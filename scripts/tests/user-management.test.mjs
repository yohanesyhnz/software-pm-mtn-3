import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("managed users are persisted through dedicated backend endpoints", () => {
  const backend = read("backend/UserManagement.cs");
  const program = read("backend/Program.cs");

  assert.match(program, /AddSingleton<LocalUserCredentialStore>/);
  assert.match(program, /MapUserManagementApi/);
  assert.match(backend, /MapPost\("\/api\/users"/);
  assert.match(backend, /MapPut\("\/api\/users\/\{id:int\}"/);
  assert.match(backend, /MapDelete\("\/api\/users\/\{id:int\}"/);
  assert.match(backend, /stateStore\.UpdateAsync/);
});

test("new user passwords are PBKDF2 hashes and login reads the managed store", () => {
  const backend = read("backend/UserManagement.cs");
  const program = read("backend/Program.cs");

  assert.match(backend, /RandomNumberGenerator\.GetBytes\(16\)/);
  assert.match(backend, /Rfc2898DeriveBytes\.Pbkdf2/);
  assert.match(backend, /CryptographicOperations\.FixedTimeEquals/);
  assert.match(backend, /pbkdf2-sha256/);
  assert.match(program, /credentialStore\.GetHashAsync/);
  assert.match(program, /LocalUserCredentialStore\.VerifyPassword/);
});

test("authentication work factor is configurable for constrained NAS hardware", () => {
  const backend = read("backend/UserManagement.cs");
  const program = read("backend/Program.cs");
  const nasStart = read("scripts/nas/start.sh");

  assert.match(backend, /LocalAuthentication:PasswordHashIterations/);
  assert.match(backend, /Math\.Clamp/);
  assert.match(nasStart, /PREDICTACORE_PBKDF2_ITERATIONS:-30000/);
  assert.match(nasStart, /LocalAuthentication__PasswordHashIterations/);
  assert.match(nasStart, /LocalAuthentication__Users__YAO__PasswordHash/);
  assert.match(program, /AddRateLimiter/);
  assert.match(program, /RequireRateLimiting\("login"\)/);
});

test("user editor waits for the backend and never displays stored passwords", () => {
  const html = read("index.html");
  const app = read("app.js");
  const legacyApp = read("public/legacy-app.js");

  assert.equal(app, legacyApp, "legacy compatibility bundles must remain identical");
  assert.match(html, /id="save-user-button"/);
  assert.match(app, /async function saveUserData\(\)/);
  assert.match(app, /fetch\(endpoint,[\s\S]*method: modalId \? 'PUT' : 'POST'/);
  assert.match(app, /const maskedPass = '••••••••'/);
  assert.match(app, /passwordIn\.value = ''/);
  assert.doesNotMatch(app, /const maskedPass = u\.password/);
});

test("secure reset authorization is verified by the backend", () => {
  const app = read("app.js");

  assert.match(app, /async function confirmSecureReset\(\)/);
  assert.match(app, /fetch\('\/api\/auth\/login'/);
  assert.doesNotMatch(app, /password === authUser\.password/);
});
