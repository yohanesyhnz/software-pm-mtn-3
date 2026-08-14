import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("PostgreSQL credentials are backend-only environment variables", () => {
  const backend = read("backend/MachineMonitoring.cs");
  const frontend = [
    read("app/components/machine-dashboard/DynamicMachineDashboard.tsx"),
    read("app/components/machine-dashboard/MachineCard.tsx"),
    read("app/components/machine-dashboard/machine-dashboard-api.ts"),
    read("app.js"),
  ].join("\n");
  for (const name of ["POSTGRES_HOST", "POSTGRES_PORT", "POSTGRES_DATABASE", "POSTGRES_USER", "POSTGRES_PASSWORD"])
    assert.match(backend, new RegExp(name));
  assert.doesNotMatch(frontend, /POSTGRES_(HOST|PORT|DATABASE|USER|PASSWORD)|10\.165\.41\.45|["']appuser["']/i);
  const compatibilityAdapters = read("api.php") + read("sse.php");
  assert.match(compatibilityAdapters, /BACKEND_ORIGIN/);
  assert.match(compatibilityAdapters, /127\.0\.0\.1:5080/);
  assert.doesNotMatch(compatibilityAdapters, /10\.165\.41\.45|["']appuser["']|pg_connect|new PDO/);
});

test("one hosted acquisition service drives counter, speed, weight, persistence and WebSocket", () => {
  const backend = read("backend/MachineMonitoring.cs");
  const program = read("backend/Program.cs");
  assert.match(program, /AddHostedService<MachineDataAcquisitionService>/);
  assert.match(backend, /class MachineStatusEngine/);
  assert.match(backend, /MachineParameterType\.Counter/);
  assert.match(backend, /MachineParameterType\.Speed/);
  assert.match(backend, /MachineParameterType\.Weight/);
  assert.match(backend, /TotalRunningSeconds/);
  assert.match(backend, /COUNTER_RESET/);
  assert.match(backend, /UNION ALL/);
  assert.match(backend, /MachineDashboardHub/);
});

test("the ten audited Line 07 machine sources are configurable", () => {
  const backend = read("backend/MachineMonitoring.cs");
  for (const id of [
    "WASHING_RRU_A", "TUNNEL_HQL_A", "WASHING_RRU_B", "TUNNEL_HQL_B",
    "FILLING_ALF_A", "FILLING_ALF_B", "MIXING_AR_TK101_A",
    "MIXING_AR_TK101_B", "LABELING_RE400_A", "LABELING_RE400_B",
  ]) assert.match(backend, new RegExp(`Default\\(\"${id}\"`));
  assert.match(backend, /timestamp_zone/);
  assert.match(backend, /bobot_actual/);
  assert.match(backend, /infeed_counter/);
});

test("the four audited Line 08 assets extend the shared acquisition service without duplicates", () => {
  const backend = read("backend/MachineMonitoring.cs");
  const up = read("backend/Migrations/20260814_line08_machine_acquisition.up.sql");
  const down = read("backend/Migrations/20260814_line08_machine_acquisition.down.sql");
  const configurations = [
    ["ILE8_WASHING_KQCLS20_3", "24", "ILE8_WASHING_RTF", "single_shift_output", "Output Washing", "Counter"],
    ["ILE8_TUNNEL_KSZ_200_60M", "25", "ILE8_TUNNEL_RTF", "air_speed_heating_zone", "Velocity Heating Zone", "Speed"],
    ["ILE8_FILLING_PDS16", "26", "ILE8_FILLING_RTF", "act_speed", "Act Speed", "Speed"],
    ["ILE8_CAPPING_2G16", "27", "ILE8_CAPPING_RTF", "infeed_number", "Input Count", "Counter"],
  ];

  for (const [id, legacyId, table, column, label, type] of configurations) {
    assert.match(backend, new RegExp(`Default\\(\"${id}\", ${legacyId},[\\s\\S]*?\"LINE 08\"[\\s\\S]*?\"${table}\"[\\s\\S]*?\"${column}\"[\\s\\S]*?\"${label}\"[\\s\\S]*?MachineParameterType\\.${type}`));
    assert.match(up, new RegExp(id));
  }
  assert.match(backend, /ReadInt\(item, "id"\) == configuration\.LegacyId/);
  assert.match(backend, /machine\["line_code"\] = configuration\.Line/);
  assert.match(backend, /acquisition_bootstrap_version/);
  assert.match(backend, /line08-v2/);
  assert.match(backend, /configuration\.Line == "LINE 08"/);
  const program = read("backend/Program.cs");
  assert.match(program, /CompatibilityMachineKey/);
  assert.match(program, /!string\.Equals\(incomingBootstrap, persistedBootstrap/);
  assert.match(program, /"parameter_type", "parameter_unit"/);
  assert.match(up, /timestamp_zone DESC/g);
  assert.match(up, /ON CONFLICT \(machine_id\) DO UPDATE/);
  assert.match(down, /acquisition_enabled = false/);
  assert.doesNotMatch(down, /DELETE FROM master_machine/);
});

test("stop timeout uses observed time even when the latest PostgreSQL row is unchanged", () => {
  const backend = read("backend/MachineMonitoring.cs");
  assert.match(backend, /\(observedAt - stopCandidate\.Value\)\.TotalSeconds >= configuration\.StopTimeoutSeconds/);
  assert.doesNotMatch(backend, /previous\.SourceTimestamp == sourceTimestamp && previous\.CurrentValue == currentValue/);
});

test("legacy NAS machine ids resolve to the canonical realtime configuration", () => {
  const monitoring = read("backend/MachineMonitoring.cs");
  const dashboard = read("backend/MachineDashboard.cs");
  assert.match(monitoring, /_legacyAliases/);
  assert.match(monitoring, /foreach \(var fallback in Defaults\)/);
  assert.match(monitoring, /MachineId = fallback\.MachineId/);
  assert.match(dashboard, /TryGet\(item\.MachineId, item\.LegacyId, out var runtime\)/);
});

test("WebSocket clients may disconnect without polluting server error logs", () => {
  const sockets = read("backend/MachineDashboard.cs") + read("backend/SmartNotifications.cs");
  assert.equal((sockets.match(/catch \(WebSocketException\)/g) ?? []).length, 4);
});

test("Machine Card renders the configured primary metric and database freshness", () => {
  const card = read("app/components/machine-dashboard/MachineCard.tsx");
  const dashboard = read("app/components/machine-dashboard/DynamicMachineDashboard.tsx");
  assert.match(card, /BOBOT AKTUAL/);
  assert.match(card, /machine\.parameterValue/);
  assert.match(card, /machine-data-freshness/);
  assert.match(card, /Last Update/);
  assert.match(dashboard, /PostgreSQL \{databaseConnection\}/);
});

test("migration is additive, records transitions and uses non-destructive rollback", () => {
  const up = read("backend/Migrations/20260811_machine_status_engine.up.sql");
  const down = read("backend/Migrations/20260811_machine_status_engine.down.sql");
  assert.match(up, /CREATE TABLE IF NOT EXISTS machine_status_history/);
  assert.match(up, /CREATE TABLE IF NOT EXISTS machine_events/);
  assert.match(up, /ADD COLUMN IF NOT EXISTS total_running_seconds/);
  assert.match(up, /ON CONFLICT \(machine_id\) DO UPDATE/);
  assert.match(down, /acquisition_enabled = false/);
  assert.doesNotMatch(down, /DROP TABLE|DROP COLUMN/);
});
