import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("Smart Assistant mounts into the Bell and Settings slots", () => {
  const html = read("index.html");
  const page = read("app/page.tsx");

  assert.match(html, /id="smart-assistant-bell-slot"/);
  assert.match(html, /id="nav-settings"[^>]*switchTab\('settings'\)/);
  assert.match(html, /id="panel-settings"[\s\S]*id="smart-assistant-settings-root"/);
  assert.doesNotMatch(html, /onclick="toggleNotificationDropdown\(\)"/);
  assert.match(page, /<SmartAssistantHost\s*\/>/);
});

test("frontend uses the requested lightweight realtime and accessibility stack", () => {
  const host = read("app/components/smart-assistant/SmartAssistantHost.tsx");
  const dataHook = read("app/components/smart-assistant/useSmartAssistantData.ts");
  const dialog = read("app/components/smart-assistant/SmartAssistantDialog.tsx");
  const settings = read("app/components/smart-assistant/SmartAssistantSettings.tsx");
  const dialogPrimitive = read("app/components/ui/dialog.tsx");
  const styles = read("app/globals.css");

  assert.match(host, /QueryClientProvider/);
  assert.match(host, /dynamic\(\(\) => import\("\.\/SmartAssistantDialog"\)/);
  assert.match(host, /duration: 0\.78, ease: "easeInOut"|duration: 0\.62, ease: "easeInOut"/);
  assert.match(host, /useReducedMotion/);
  assert.match(dataHook, /new WebSocket/);
  assert.match(dataHook, /queryClient\.setQueryData\(smartNotificationQueryKey/);
  assert.doesNotMatch(dataHook, /openAssistant/);
  assert.match(dialogPrimitive, /@radix-ui\/react-dialog/);
  assert.match(dialog, /DialogClose/);
  assert.match(settings, /Enable Smart Assistant/);
  assert.match(settings, /Enable Robot Animation/);
  assert.match(settings, /Enable Auto Popup/);
  assert.match(settings, /role="switch"/);
  assert.match(styles, /\.smart-assistant-dialog\s*\{[\s\S]*left:\s*50%;[\s\S]*top:\s*50%;[\s\S]*transform:\s*translate\(-50%,\s*-50%\)/);
  assert.match(styles, /width:\s*min\(700px,\s*calc\(100vw\s*-\s*32px\)\)/);
  assert.match(styles, /@media \(max-width:\s*639px\)[\s\S]*max-height:\s*calc\(100dvh\s*-\s*16px\)/);
});

test("robot assistant is prominent and parks outside the dialog when space permits", () => {
  const host = read("app/components/smart-assistant/SmartAssistantHost.tsx");

  assert.match(host, /Math\.min\(220,\s*Math\.max\(180,\s*viewportWidth \* 0\.15\)\)/);
  assert.match(host, /canParkBesideDialog/);
  assert.match(host, /sideSpace >= size \+ 24/);
});

test("login and logout events make automatic popup lifecycle repeatable", () => {
  const app = read("app.js");
  const publicApp = read("public/legacy-app.js");

  assert.equal(app, publicApp, "legacy bundles must remain identical");
  assert.match(app, /predictacore:authenticated/);
  assert.match(app, /predictacore:logout/);
  assert.match(app, /localStorage\.removeItem\('pm_active_user'\)/);
  assert.match(app, /switchTab\('dashboard'\);[\s\S]*predictacore:authenticated/);
});

test("ASP.NET Core reads PostgreSQL spare_parts and broadcasts sorted snapshots by WebSocket", () => {
  const backend = read("backend/SmartNotifications.cs");
  const program = read("backend/Program.cs");

  for (const field of [
    "machine_name",
    "part_name",
    "remaining_hours",
    "remaining_percentage",
    "status",
    "next_replacement_date",
    "last_replacement_date"
  ]) {
    assert.match(backend, new RegExp(`\\b${field}\\b`));
  }
  assert.match(backend, /FROM spare_parts/);
  assert.match(backend, /UPPER\(status\) IN \('WARNING', 'CRITICAL'\)/);
  assert.match(backend, /OrderBy\(item => item\.Status == "CRITICAL" \? 0 : 1\)[\s\S]*ThenBy\(item => item\.RemainingPercentage\)/);
  assert.match(backend, /WebSocketMessageType\.Text/);
  assert.match(program, /UseWebSockets/);
  assert.match(program, /AddHostedService<SmartNotificationMonitor>/);
});

test("robot asset is optimized and project-bound", () => {
  const asset = new URL("../../public/assets/smart_assistant_robot.png", import.meta.url);
  assert.equal(existsSync(asset), true);
  const size = statSync(asset).size;
  assert.ok(size > 20_000, "robot asset is unexpectedly empty");
  assert.ok(size < 500_000, "robot asset should remain lightweight for dashboard animation");
});
