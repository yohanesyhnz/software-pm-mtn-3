import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const sourceFiles = [
  "../../index.html",
  "../../app.js",
  "../../public/legacy-app.js",
  "../../style.css"
].map((path) => ({ path, contents: readFileSync(new URL(path, import.meta.url), "utf8") }));

test("regulated UI excludes access-level switching and the Android simulator", () => {
  const forbiddenPatterns = [
    /Android Simulator/i,
    /android-simulator/i,
    /toggleAndroidSimulator/,
    /user-role-select/,
    /auth-target-role/
  ];

  for (const { path, contents } of sourceFiles) {
    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(contents, pattern, `${path} still contains ${pattern}`);
    }
  }
});

test("Dankos branding blends into the header and follows the active theme", () => {
  const html = sourceFiles.find(({ path }) => path.endsWith("index.html"))?.contents ?? "";
  const css = sourceFiles.find(({ path }) => path.endsWith("style.css"))?.contents ?? "";

  assert.match(html, /class="plant-brand"/);
  assert.match(html, /assets\/dankos_logo\.png/);
  assert.match(html, />A Kalbe Company<\/span>/);
  assert.doesNotMatch(html, /class="[^"]*plant-badge/);
  assert.match(css, /\.plant-brand\s*\{[^}]*background:\s*transparent;[^}]*border:\s*0;/s);
  assert.match(css, /\.plant-brand-tagline\s*\{[^}]*color:\s*#ffffff;/s);
  assert.match(css, /:root\[data-theme="light"\]\s+\.plant-brand-tagline\s*\{[^}]*color:\s*#111111;/s);
});

test("login modal uses the supplied responsive background", () => {
  const css = sourceFiles.find(({ path }) => path.endsWith("style.css"))?.contents ?? "";

  assert.match(css, /\.login-theme-modal\s*\{[^}]*url\('\/assets\/login_background\.png'\)[^}]*background-size:\s*cover;/s);
  assert.match(css, /@media screen and \(max-width: 768px\)[^{]*\{[\s\S]*?\.login-theme-modal\s*\{[^}]*background-position:\s*68% center;/s);
});

test("version and about pages use a full-screen responsive shell", () => {
  const css = readFileSync(new URL("../../app/version-management.css", import.meta.url), "utf8");

  assert.match(css, /\.vm-app\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*100vw;[^}]*height:\s*100dvh;[^}]*overflow:\s*hidden;/s);
  assert.match(css, /\.vm-main\s*\{[^}]*height:\s*100dvh;[^}]*overflow-x:\s*hidden;[^}]*overflow-y:\s*auto;/s);
  assert.match(css, /\.vm-content\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*none;/s);
  assert.match(css, /@media \(max-width: 760px\)[^{]*\{[\s\S]*?\.vm-main\s*\{[^}]*height:\s*auto;[^}]*overflow:\s*visible;/s);
});

test("spare-parts table is readable in light mode and adapts locally", () => {
  const css = sourceFiles.find(({ path }) => path.endsWith("style.css"))?.contents ?? "";

  assert.match(css, /#panel-spareparts \.data-table\s*\{[^}]*min-width:\s*100%;[^}]*table-layout:\s*auto;/s);
  assert.match(css, /:root\[data-theme="light"\] #panel-spareparts \.data-table td:first-child\s*\{[^}]*color:\s*#14253a;[^}]*background:\s*#edf3f8;/s);
  assert.match(css, /:root\[data-theme="light"\] #panel-spareparts \.data-table th:first-child\s*\{[^}]*color:\s*#294761;[^}]*background:\s*#dfe8f2;/s);
  assert.match(css, /@media screen and \(max-width: 1200px\)[^{]*\{[\s\S]*?#panel-spareparts \.data-table\s*\{[^}]*min-width:\s*100%;[^}]*table-layout:\s*fixed;/s);
  assert.match(css, /@media screen and \(max-width: 768px\)[^{]*\{[\s\S]*?#panel-spareparts \.spareparts-responsive-table tbody tr\s*\{[^}]*display:\s*grid;/s);
  assert.match(css, /#panel-spareparts \.spareparts-responsive-table tbody td::before\s*\{[^}]*content:\s*attr\(data-label\);/s);
});

test("real-time machine status sits directly below the KPI summary and adapts to narrow screens", () => {
  const html = sourceFiles.find(({ path }) => path.endsWith("index.html"))?.contents ?? "";
  const css = sourceFiles.find(({ path }) => path.endsWith("style.css"))?.contents ?? "";
  const app = sourceFiles.find(({ path }) => path.endsWith("app.js"))?.contents ?? "";
  const kpiGridIndex = html.indexOf('<div class="kpi-grid">');
  const machineStatusIndex = html.indexOf('<section class="machine-status-section"');
  const dashboardEndIndex = html.indexOf('<!-- TAB 2: MASTER MESIN -->');

  assert.ok(kpiGridIndex >= 0, "dashboard KPI grid is missing");
  assert.ok(machineStatusIndex > kpiGridIndex, "machine status must follow the KPI grid");
  assert.ok(dashboardEndIndex > machineStatusIndex, "machine status must remain inside the dashboard panel");
  assert.equal((html.match(/id="dashboard-machine-status-grid"/g) ?? []).length, 1);
  assert.match(html, /id="machine-order-toggle"[^>]*onclick="toggleDashboardMachineOrderMode\(\)"/);
  assert.match(html, /id="machine-order-reset"[^>]*onclick="resetDashboardMachineOrder\(\)"/);
  assert.match(css, /\.machine-status-section\s*\{[^}]*min-width:\s*0;[^}]*background:\s*var\(--bg-card\);/s);
  assert.match(css, /\.machine-pair-cards\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/s);
  assert.match(css, /@media \(max-width: 640px\)[^{]*\{[\s\S]*?\.machine-line-section\.all-single \.machine-pairs-grid,[\s\S]*?\.machine-pair-cards\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s);
  assert.match(app, /DASHBOARD_MACHINE_ORDER_STORAGE_KEY\s*=\s*'predictacore-dashboard-machine-order-v1'/);
  assert.match(app, /function _buildDashboardMachineLines\(machines\)/);
  assert.match(app, /variants\.has\('A'\) && variants\.has\('B'\)/);
  assert.match(app, /function moveDashboardMachineGroup\(encodedLineKey, encodedGroupKey, direction\)/);
  assert.match(app, /window\.localStorage\.setItem\(DASHBOARD_MACHINE_ORDER_STORAGE_KEY/);
});

test("preventive maintenance owns all analytical panels while dashboard stays machine-focused", () => {
  const html = sourceFiles.find(({ path }) => path.endsWith("index.html"))?.contents ?? "";
  const app = sourceFiles.find(({ path }) => path.endsWith("app.js"))?.contents ?? "";
  const dashboardPanel = html.slice(html.indexOf('id="panel-dashboard"'), html.indexOf('<!-- TAB 2: MASTER MESIN -->'));
  const preventivePanel = html.slice(html.indexOf('id="panel-history"'), html.indexOf('<!-- TAB 5:'));
  const analyticsTitles = [
    "Remaining Life Analysis (Critical Parts)",
    "Status Kondisi Spare Part",
    "Status Kesehatan Mesin (Health Score)",
    "Tren Running Hours Harian Mesin",
    "Biaya Pemeliharaan Bulanan (Historical)",
    "Top 10 Spare Part Paling Sering Diganti"
  ];

  assert.match(html, /id="nav-history"[\s\S]*?Preventive Maintenance/);
  for (const title of analyticsTitles) {
    assert.doesNotMatch(dashboardPanel, new RegExp(title.replace(/[()]/g, "\\$&")));
    assert.match(preventivePanel, new RegExp(title.replace(/[()]/g, "\\$&")));
  }

  const dashboardLoader = app.slice(app.indexOf("function loadDashboardData()"), app.indexOf("function loadPreventiveMaintenanceData()"));
  const preventiveLoader = app.slice(app.indexOf("function loadPreventiveMaintenanceData()"), app.indexOf("function refreshDashboardData()"));
  assert.doesNotMatch(dashboardLoader, /renderRadialGauges|renderDonutChart|renderMachineHealthChart|renderLineChart|renderBarChart|renderTopReplacedParts/);
  assert.match(preventiveLoader, /renderRadialGauges/);
  assert.match(preventiveLoader, /renderTopReplacedParts/);
  assert.match(app, /history:\s*'Preventive Maintenance'/);
  assert.match(app, /if \(tabName === 'history'\) loadPreventiveMaintenanceData\(\);/);
});

test("dashboard machine grouping orders lines numerically and keeps A/B partners together", () => {
  const app = sourceFiles.find(({ path }) => path.endsWith("app.js"))?.contents ?? "";
  const helperStart = app.indexOf("function _normalizeDashboardLineCode");
  const helperEnd = app.indexOf("function _readDashboardMachineOrder");
  const helperSource = app.slice(helperStart, helperEnd);
  const context = { result: null };

  assert.ok(helperStart >= 0 && helperEnd > helperStart, "dashboard grouping helpers are missing");
  vm.runInNewContext(`${helperSource}\nresult = _buildDashboardMachineLines([
    { id: 8, line_code: 'LINE 08', name: 'FILLING PDS16' },
    { id: 2, line_code: 'LINE 07', name: 'LABELING RE-400_B' },
    { id: 5, line_code: 'LINE 07', name: 'MIXING AR/TK101_A' },
    { id: 1, line_code: 'LINE 07', name: 'LABELING RE-400_A' },
    { id: 6, line_code: 'LINE 07', name: 'MIXING AR/TK102_B' }
  ]);`, context);

  const result = JSON.parse(JSON.stringify(context.result));
  assert.deepEqual(result.map(line => line.name), ["LINE 07", "LINE 08"]);
  assert.equal(result[0].machineCount, 4);
  assert.equal(result[0].groups.length, 2);
  assert.deepEqual(
    result[0].groups.map(group => group.machines.map(machine => machine.name)),
    [
      ["LABELING RE-400_A", "LABELING RE-400_B"],
      ["MIXING AR/TK101_A", "MIXING AR/TK102_B"]
    ]
  );
});

test("user editor modal is contained and follows dark/light themes", () => {
  const html = sourceFiles.find(({ path }) => path.endsWith("index.html"))?.contents ?? "";
  const css = sourceFiles.find(({ path }) => path.endsWith("style.css"))?.contents ?? "";

  assert.match(html, /id="user-modal"[^>]*class="[^"]*user-theme-modal|class="[^"]*user-theme-modal[^"]*"[^>]*id="user-modal"/);
  assert.match(html, /class="modal-content user-theme-card"/);
  assert.match(css, /\.user-theme-card \.form-row\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 0\.9fr\) minmax\(0, 1\.1fr\);/s);
  assert.match(css, /\.user-theme-card \.flex-1,[\s\S]*?\.user-theme-card select\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/s);
  assert.match(css, /:root\[data-theme="light"\] \.user-theme-card\s*\{[^}]*color:\s*#14253a;[^}]*background:\s*rgba\(255, 255, 255, 0\.99\);/s);
  assert.match(css, /@media \(max-width: 600px\)[^{]*\{[\s\S]*?\.user-theme-card \.form-row\s*\{[^}]*grid-template-columns:\s*1fr;/s);
});

test("machine detail and reset confirmation modals follow dark/light themes", () => {
  const html = sourceFiles.find(({ path }) => path.endsWith("index.html"))?.contents ?? "";
  const css = sourceFiles.find(({ path }) => path.endsWith("style.css"))?.contents ?? "";

  assert.match(html, /id="machinedetails-modal"[^>]*aria-labelledby="machine-details-title"/);
  assert.match(html, /class="modal-content modal-large machine-detail-theme-card"/);
  assert.match(html, /class="modal reset-auth-theme-modal" id="reset-auth-modal"/);
  assert.match(html, /class="modal-content reset-auth-theme-card"/);
  assert.doesNotMatch(html, /id="reset-auth-modal"[^>]*style=/);
  assert.match(css, /\.machine-detail-theme-card\s*\{[^}]*max-height:\s*calc\(100dvh - 32px\);[^}]*background:\s*rgba\(18, 25, 35, 0\.98\);/s);
  assert.match(css, /\.reset-auth-theme-card\s*\{[^}]*max-height:\s*calc\(100dvh - 32px\);[^}]*background:\s*rgba\(18, 25, 35, 0\.99\);/s);
  assert.match(css, /:root\[data-theme="light"\] \.machine-detail-theme-card,[\s\S]*?:root\[data-theme="light"\] \.reset-auth-theme-card\s*\{[^}]*background:\s*rgba\(255, 255, 255, 0\.99\);/s);
  assert.match(css, /@media \(max-width: 480px\)[^{]*\{[\s\S]*?\.reset-auth-actions\s*\{[^}]*grid-template-columns:\s*1fr;/s);
});

test("desktop replacement modal follows themes and adapts to the viewport", () => {
  const html = sourceFiles.find(({ path }) => path.endsWith("index.html"))?.contents ?? "";
  const css = sourceFiles.find(({ path }) => path.endsWith("style.css"))?.contents ?? "";

  assert.match(html, /class="modal replacement-theme-modal" id="replacement-modal"[^>]*aria-labelledby="replacement-modal-title"/);
  assert.match(html, /class="modal-content replacement-theme-card"/);
  assert.match(html, /class="modal-body replacement-theme-body"/);
  assert.match(html, /class="form-row replacement-form-row"/);
  assert.doesNotMatch(html, /id="desktop-replace-qty"[^>]*style=/);
  assert.match(css, /\.replacement-theme-card\s*\{[^}]*max-height:\s*calc\(100dvh - 32px\);[^}]*overflow:\s*hidden;[^}]*background:\s*rgba\(18, 25, 35, 0\.98\);/s);
  assert.match(css, /\.replacement-theme-body\s*\{[^}]*overflow-x:\s*hidden;[^}]*overflow-y:\s*auto;/s);
  assert.match(css, /:root\[data-theme="light"\] \.replacement-theme-card\s*\{[^}]*color:\s*#14253a;[^}]*background:\s*rgba\(255, 255, 255, 0\.99\);/s);
  assert.match(css, /@media \(max-width: 600px\)[^{]*\{[\s\S]*?\.replacement-form-row\s*\{[^}]*grid-template-columns:\s*1fr;/s);
  assert.match(css, /@media \(max-height: 640px\)[^{]*\{[\s\S]*?\.replacement-theme-card\s*\{[^}]*max-height:\s*calc\(100dvh - 16px\);/s);
});

test("all application modal menus have an explicit theme-aware surface", () => {
  const html = sourceFiles.find(({ path }) => path.endsWith("index.html"))?.contents ?? "";
  const css = sourceFiles.find(({ path }) => path.endsWith("style.css"))?.contents ?? "";
  const app = sourceFiles.find(({ path }) => path.endsWith("app.js"))?.contents ?? "";
  const legacyApp = sourceFiles.find(({ path }) => path.endsWith("public/legacy-app.js"))?.contents ?? "";
  const modalMatches = [...html.matchAll(/<div class="([^"]*\bmodal\b[^"]*)" id="([^"]+)"/g)]
    .filter(([, classNames]) => classNames.split(/\s+/).includes("modal"));
  const allowedThemeClasses = [
    "adaptive-theme-modal",
    "machine-detail-theme-modal",
    "replacement-theme-modal",
    "user-theme-modal",
    "login-theme-modal",
    "reset-auth-theme-modal"
  ];

  assert.equal(modalMatches.length, 11, "unexpected number of application modal surfaces");
  for (const [, classNames, id] of modalMatches) {
    assert.ok(
      allowedThemeClasses.some((themeClass) => classNames.split(/\s+/).includes(themeClass)),
      `${id} does not declare a theme-aware modal class`
    );
  }

  for (const id of ["machine-modal", "sparepart-modal", "import-machine-modal", "import-sparepart-modal", "plc-config-modal", "plc-test-result-modal"]) {
    assert.match(html, new RegExp(`class="[^"]*adaptive-theme-modal[^"]*" id="${id}"`));
  }

  assert.match(css, /\.adaptive-theme-card\s*\{[^}]*max-height:\s*calc\(100dvh - 32px\);[^}]*overflow:\s*hidden;[^}]*background:\s*rgba\(18, 25, 35, 0\.98\);/s);
  assert.match(css, /\.adaptive-form-card \.form-row\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(auto-fit, minmax\(150px, 1fr\)\);/s);
  assert.match(css, /:root\[data-theme="light"\] \.adaptive-theme-card\s*\{[^}]*color:\s*#14253a;[^}]*background:\s*rgba\(255, 255, 255, 0\.99\);/s);
  assert.match(css, /@media \(max-width: 600px\)[^{]*\{[\s\S]*?\.adaptive-form-card \.form-row\s*\{[^}]*grid-template-columns:\s*1fr;/s);
  assert.match(css, /:root\[data-theme="light"\] \.kiosk-lock-card\s*\{[^}]*color:\s*#14253a;[^}]*background:\s*rgba\(255, 255, 255, 0\.99\);/s);
  assert.match(app, /class="plc-diagnostic-asset"/);
  assert.match(app, /class="plc-diagnostic-message"/);
  assert.equal(app, legacyApp, "app.js and public/legacy-app.js must remain identical");
});
