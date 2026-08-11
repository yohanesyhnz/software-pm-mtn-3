import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("dashboard uses one reusable MachineCard per machine and realtime WebSocket transport", () => {
  const dashboard = read("app/components/machine-dashboard/DynamicMachineDashboard.tsx");
  const card = read("app/components/machine-dashboard/MachineCard.tsx");
  assert.match(dashboard, /<MachineCard/);
  assert.match(dashboard, /new WebSocket\(machineDashboardWebSocketUrl\(\)\)/);
  assert.match(card, /machine-image-frame/);
  assert.match(card, /machine-status-label/);
  assert.match(card, /machine-metrics/);
  assert.match(card, /RUNNING HOURS/);
  assert.match(card, /machine-health/);
});

test("card rendering is memoized and sanitizes invalid numeric UI values", () => {
  const card = read("app/components/machine-dashboard/MachineCard.tsx");
  const css = read("app/globals.css");
  assert.match(card, /export const MachineCard = memo/);
  assert.match(card, /Number\.isFinite\(value\)/);
  assert.match(card, /return value[^;]+: "--"/);
  assert.match(card, /loading="lazy"/);
  assert.match(css, /object-fit: contain/);
  assert.match(css, /\.machine-image-frame[\s\S]*padding: clamp\(8px, 0\.8vw, 12px\)/);
  assert.match(css, /\.machine-image-frame[\s\S]*display: flex[\s\S]*align-items: center[\s\S]*justify-content: center/);
  assert.match(css, /\.mode-compact \.machine-image-frame[\s\S]*height: clamp\(118px, 14vw, 142px\)/);
  assert.match(css, /\.machine-image-frame img[\s\S]*min-width: 0[\s\S]*min-height: 0[\s\S]*max-width: 100%[\s\S]*max-height: 100%/);
});

test("drag order is persisted through the backend API", () => {
  const dashboard = read("app/components/machine-dashboard/DynamicMachineDashboard.tsx");
  const api = read("app/components/machine-dashboard/machine-dashboard-api.ts");
  assert.match(dashboard, /DndContext/);
  assert.match(dashboard, /KeyboardSensor/);
  assert.match(dashboard, /saveMachineOrder/);
  assert.match(api, /\/api\/machine-dashboard\/order/);
  assert.match(api, /method: "PUT"/);
});

test("responsive CSS provides mobile single-column cards and SCADA status states", () => {
  const css = read("app/globals.css");
  assert.match(css, /@container \(max-width: 460px\)/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
  for (const status of ["running", "stopped", "idle", "alarm", "maintenance", "data-offline"])
    assert.match(css, new RegExp(`status-${status}`));
  assert.match(css, /prefers-reduced-motion/);
});

test("Master Machine supports image preview, PLC tags, card visibility, and soft delete", () => {
  const html = read("index.html");
  const legacy = read("app.js");
  assert.match(html, /accept="\.png,\.jpg,\.jpeg,image\/png,image\/jpeg"/);
  assert.match(html, /modal-machine-image-preview/);
  assert.match(html, /modal-machine-dashboard-url/);
  assert.match(html, /modal-machine-display-order/);
  assert.match(html, /modal-machine-show-health/);
  assert.match(legacy, /machine\.is_active = false/);
  assert.doesNotMatch(legacy, /dbState\.spare_parts = dbState\.spare_parts\.filter\(sp => sp\.machine_id !== id\)/);
});

test("backend validates and rewrites uploads with safe generated names", () => {
  const backend = read("backend/MachineDashboard.cs");
  assert.match(backend, /AllowedExtensions = \["\.png", "\.jpg", "\.jpeg"\]/);
  assert.match(backend, /AllowedMimeTypes = \["image\/png", "image\/jpeg"\]/);
  assert.match(backend, /Image\.LoadAsync/);
  assert.match(backend, /AutoOrient\(\)/);
  assert.match(backend, /Guid\.NewGuid\(\):N/);
  assert.match(backend, /ExifProfile = null/);
  assert.match(backend, /XmpProfile = null/);
  assert.match(backend, /MaxImageMegabytes/);
});

test("PostgreSQL migration is additive and has a rollback companion", () => {
  const up = read("backend/Migrations/20260810_dynamic_machine_dashboard.up.sql");
  const down = read("backend/Migrations/20260810_dynamic_machine_dashboard.down.sql");
  assert.match(up, /CREATE TABLE IF NOT EXISTS master_machine/);
  assert.match(up, /CREATE TABLE IF NOT EXISTS machine_realtime/);
  assert.match(up, /CREATE TABLE IF NOT EXISTS machine_history/);
  assert.match(up, /remaining_percentage/);
  assert.match(down, /DROP TABLE IF EXISTS machine_history/);
});

test("NAS release package includes the version manifest used by the backend", () => {
  const workflow = read(".github/workflows/release.yml");
  const updater = read("scripts/nas/update.sh");
  assert.match(workflow, /cp version\.json dist\/nas\/package\/backend\/version\.json/);
  assert.match(workflow, /predictacore-ds124-arm64\.tar\.gz/);
  assert.match(workflow, /runtime-scripts/);
  assert.match(updater, /scripts\/stop\.sh[\s\S]*tar -czf/);
  assert.match(updater, /runtime-scripts[\s\S]*cp -f/);
  assert.match(updater, /while \[ "\$attempt" -lt 20 \]/);
});

test("legacy compatibility bundles contain identical logic", () => {
  const normalize = (value) => value.replace(/\r\n/g, "\n");
  assert.equal(normalize(read("app.js")), normalize(read("public/legacy-app.js")));
});
