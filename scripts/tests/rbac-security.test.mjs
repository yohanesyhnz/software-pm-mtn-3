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

test('legacy compatibility scripts remain identical', () => {
  assert.equal(app, legacy);
});
