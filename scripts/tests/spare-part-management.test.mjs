import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const appSource = fs.readFileSync(new URL("../../app.js", import.meta.url), "utf8");
const legacySource = fs.readFileSync(new URL("../../public/legacy-app.js", import.meta.url), "utf8");
const backendSource = fs.readFileSync(new URL("../../backend/SparePartManagement.cs", import.meta.url), "utf8");
const programSource = fs.readFileSync(new URL("../../backend/Program.cs", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../../style.css", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../../index.html", import.meta.url), "utf8");

test("spare part create and update wait for an atomic backend mutation", () => {
  assert.match(programSource, /MapSparePartManagementApi/);
  assert.match(backendSource, /MapPost\("\/api\/spare-parts"/);
  assert.match(backendSource, /MapDelete\("\/api\/spare-parts\/\{id:int\}"/);
  assert.match(backendSource, /stateStore\.UpdateAsync/);
  assert.match(backendSource, /FindDuplicate/);
  assert.match(appSource, /async function saveSparePartData/);
  assert.match(appSource, /await fetch\(modalId \? `\/api\/spare-parts\/\$\{modalId\}` : '\/api\/spare-parts'/);
  assert.match(appSource, /saveButton\.textContent = 'Menyimpan\.\.\.'/);
});

test("remaining days use planned operating hours instead of partial daily accumulation", () => {
  assert.match(appSource, /function getPlannedOperatingHoursPerDay/);
  assert.match(appSource, /Math\.ceil\(remainingHours \/ plannedHoursPerDay\)/);
  assert.doesNotMatch(appSource, /machine \? machine\.running_hours_daily : 20/);
  assert.match(appSource, /formatLocalIsoDate\(nextPMDate\)/);
});

test("master spare part table wraps and becomes readable cards on mobile", () => {
  assert.match(html, /class="data-table spareparts-responsive-table"/);
  assert.match(appSource, /data-label="Prediksi Sisa Hari"/);
  assert.match(styles, /\.spareparts-responsive-table tbody tr\s*\{[\s\S]*display: grid/);
  assert.match(styles, /content: attr\(data-label\)/);
  assert.match(styles, /overflow-wrap: anywhere/);
});

test("legacy compatibility bundle stays byte-identical", () => {
  assert.equal(appSource, legacySource);
});
