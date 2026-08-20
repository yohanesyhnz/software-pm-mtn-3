import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(path, 'utf8');
const program = read('backend/Program.cs');
const security = read('backend/Security.cs');
const maintenance = read('backend/MaintenanceOperations.cs');
const app = read('app.js');
const legacy = read('public/legacy-app.js');
const html = read('index.html');

test('backend uses authenticated cookie sessions and CSRF validation', () => {
  assert.match(program, /AddAuthentication\(CookieAuthenticationDefaults\.AuthenticationScheme\)/);
  assert.match(program, /Cookie\.HttpOnly = true/);
  assert.match(program, /Cookie\.SameSite = SameSiteMode\.Strict/);
  assert.match(program, /ValidateRequestAsync\(context\)/);
  assert.match(program, /UseAuthentication\(\)/);
  assert.match(program, /UseAuthorization\(\)/);
  assert.doesNotMatch(program, /AllowAnyOrigin/);
});

test('RBAC permissions are backend policies loaded from persistent state', () => {
  assert.match(security, /class PermissionAuthorizationHandler/);
  assert.match(security, /GetCurrentAccessAsync/);
  assert.match(security, /state\["rbac"\]/);
  assert.match(security, /PermissionNames\.UsersManage/);
  assert.match(security, /PermissionNames\.RbacManage/);
  assert.match(security, /Minimal satu role/);
});

test('mutating domain endpoints enforce granular permissions', () => {
  assert.match(maintenance, /\/api\/replacements[\s\S]*PermissionNames\.ReplacementsCreate/);
  assert.match(maintenance, /\/api\/running-hours\/reset[\s\S]*PermissionNames\.RunningHoursReset/);
  assert.match(maintenance, /\/api\/master-data\/import[\s\S]*PermissionNames\.ImportsManage/);
  assert.match(program, /MapPut\("\/api\/state"[\s\S]*PermissionNames\.SystemRestore/);
});

test('role and permission editor is available from user management', () => {
  assert.match(html, /id="rbac-matrix-body"/);
  assert.match(html, /id="save-rbac-matrix-button"/);
  const machinePanel = html.slice(html.indexOf('id="panel-machines"'), html.indexOf('id="panel-spareparts"'));
  const userPanel = html.slice(html.indexOf('id="panel-users"'), html.indexOf('id="panel-settings"'));
  assert.doesNotMatch(machinePanel, /rbac-management/);
  assert.match(userPanel, /rbac-management[\s\S]*id="rbac-matrix-body"/);
  assert.match(app, /fetch\('\/api\/rbac'/);
  assert.match(app, /fetch\(`\/api\/rbac\/roles\//);
});

test('security audit log is readable from user management with backend permission enforcement', () => {
  assert.match(html, /id="security-audit-panel"[\s\S]*id="security-audit-body"/);
  assert.match(app, /fetch\('\/api\/security\/audit\?limit=100'/);
  assert.match(security, /MapGet\("\/api\/security\/audit"[\s\S]*PermissionNames\.AuditView/);
  assert.match(security, /ReadLatestAsync\(int limit/);
});

test('telemetry refresh does not reload the RBAC editor every second', () => {
  const refreshBlock = app.slice(app.indexOf('function refreshCurrentTabView()'), app.indexOf('function resetDbState()'));
  assert.doesNotMatch(refreshBlock, /loadRbacMatrix/);
  assert.match(app, /if \(tabName === 'users'\)[\s\S]*loadRbacMatrix\(\)[\s\S]*loadSecurityAuditLog\(\)/);
});

test('legacy compatibility scripts remain identical', () => {
  assert.equal(app, legacy);
});

test('protected realtime services start only after server authentication', () => {
  assert.match(app, /restorePredictaCoreServerSession\(\)/);
  assert.match(app, /fetch\('\/api\/auth\/me'/);
  assert.match(app, /function startAuthenticatedApplicationServices\(\)[\s\S]*predictaCoreAuthState !== 'authenticated'/);
  assert.match(app, /function startSseTelemetryEngine\(\)[\s\S]*predictaCoreAuthState !== 'authenticated'/);
  assert.match(app, /function pollRealTimePlcStatus\(\)[\s\S]*predictaCoreAuthState !== 'authenticated'/);
});

test('pre-login unauthorized responses cannot invalidate a successful login', () => {
  assert.match(app, /response\.status === 401[\s\S]*predictaCoreAuthState === 'authenticated'/);
  assert.match(app, /predictaCoreSessionExpiredNotified/);
  assert.match(app, /predictaCoreAuthState = 'authenticating'[\s\S]*fetch\('\/api\/auth\/login'/);
  assert.match(app, /predictaCoreAuthState = 'authenticated'[\s\S]*predictacore:authenticated/);
});
