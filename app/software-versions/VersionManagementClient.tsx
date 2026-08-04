"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import VersionShell from "../components/VersionShell";
import { changeLogSections, formatReleaseDate, type SoftwareVersion, type VersionAudit } from "./types";

type Tab = "history" | "audit" | "rules";

function StatusBadge({ status }: { status: string }) {
  return <span className={`vm-status ${status.toLowerCase().replaceAll(" ", "-")}`}><i />{status}</span>;
}

export default function VersionManagementClient() {
  const [versions, setVersions] = useState<SoftwareVersion[]>([]);
  const [audit, setAudit] = useState<VersionAudit[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [tab, setTab] = useState<Tab>("history");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [operation, setOperation] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [versionResponse, auditResponse] = await Promise.all([
        fetch("/api/software-versions/", { cache: "no-store" }),
        fetch("/api/software-versions/audit", { cache: "no-store" })
      ]);
      if (!versionResponse.ok || !auditResponse.ok) throw new Error("API Version Management tidak dapat diakses.");
      setVersions(await versionResponse.json());
      setAudit(await auditResponse.json());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Data versi gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const filteredVersions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return versions.filter((item) => {
      const matchesStatus = status === "all" || item.status.toLowerCase() === status;
      const matchesQuery = !query || [item.version, item.build, item.developer, item.description]
        .some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [versions, search, status]);

  const current = versions.find((item) => item.status === "Current") ?? versions[0];
  const latest = versions[0];
  const knownIssues = current?.changeLog.knownIssues.length ?? 0;

  function exportPdf() {
    const document = new jsPDF();
    let y = 18;
    const line = (text: string, size = 10, weight: "normal" | "bold" = "normal") => {
      if (y > 280) { document.addPage(); y = 18; }
      document.setFont("helvetica", weight);
      document.setFontSize(size);
      const rows = document.splitTextToSize(text, 178) as string[];
      document.text(rows, 16, y);
      y += rows.length * (size * 0.45) + 3;
    };
    document.setTextColor(10, 90, 110);
    line("PREDICTACORE CMMS — SOFTWARE CHANGE LOG", 16, "bold");
    document.setTextColor(25, 35, 45);
    line(`Generated: ${new Date().toLocaleString("id-ID")}`, 9);
    filteredVersions.forEach((version) => {
      y += 4;
      line(`${version.version}  |  Build ${version.build}  |  ${version.status}`, 13, "bold");
      line(`${formatReleaseDate(version.releaseDate)} — ${version.developer}`);
      line(version.description);
      changeLogSections.forEach((section) => {
        const entries = version.changeLog[section.key];
        if (!entries.length) return;
        line(section.label, 10, "bold");
        entries.forEach((entry) => line(`• ${entry}`, 9));
      });
    });
    document.save(`CMMS-Change-Log-${current?.version ?? "export"}.pdf`);
  }

  function exportExcel() {
    const historyRows = filteredVersions.map((version) => ({
      Version: version.version, Build: version.build, "Release Date": version.releaseDate,
      "Release Time": version.releaseTime, Developer: version.developer, Environment: version.buildEnvironment,
      Description: version.description, Status: version.status, Database: version.databaseVersion,
      API: version.apiVersion, Frontend: version.frontendVersion, Backend: version.backendVersion,
      PostgreSQL: version.postgreSqlVersion, "PLC Driver": version.plcDriverVersion
    }));
    const changeRows = filteredVersions.flatMap((version) => changeLogSections.flatMap((section) =>
      version.changeLog[section.key].map((entry) => ({ Version: version.version, Category: section.label, Change: entry }))
    ));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(historyRows), "Version History");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(changeRows), "Change Log");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(audit), "Audit Trail");
    XLSX.writeFile(workbook, `CMMS-Version-History-${current?.version ?? "export"}.xlsx`);
  }

  async function runVersionAction(version: SoftwareVersion, action: "backup" | "install") {
    setOperation(`${action}:${version.version}`);
    setError("");
    try {
      const body = action === "install"
        ? { user: "Administrator", backupBeforeUpdate: true, notes: `Update melalui halaman Version Management ke ${version.version}.` }
        : { user: "Administrator", notes: `Backup manual sebelum perubahan ${version.version}.` };
      const response = await fetch(`/api/software-versions/${encodeURIComponent(version.version)}/${action}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(action === "install" ? "Update gagal; rollback otomatis telah diminta." : "Backup gagal dibuat.");
      await loadData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Operasi gagal.");
    } finally {
      setOperation("");
    }
  }

  return (
    <VersionShell
      active="versions"
      eyebrow="ADMINISTRATION / SOFTWARE CONTROL"
      title="Software Version Management"
      actions={<button className="vm-icon-button" onClick={() => void loadData()} title="Muat ulang" aria-label="Muat ulang data">↻</button>}
    >
      <section className="vm-kpi-grid">
        <article className="vm-kpi cyan"><span>CURRENT VERSION</span><strong>{current?.version ?? "—"}</strong><small>Build {current?.build ?? "—"}</small></article>
        <article className="vm-kpi green"><span>SYSTEM STATUS</span><strong>STABLE</strong><small><i /> Production ready</small></article>
        <article className="vm-kpi blue"><span>LAST RELEASE</span><strong>{latest ? formatReleaseDate(latest.releaseDate) : "—"}</strong><small>{latest?.developer ?? "—"}</small></article>
        <article className="vm-kpi amber"><span>KNOWN ISSUES</span><strong>{knownIssues.toString().padStart(2, "0")}</strong><small>Open items on current release</small></article>
      </section>

      <div className="vm-tabbar">
        <div role="tablist" aria-label="Version management views">
          <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>Version History</button>
          <button className={tab === "audit" ? "active" : ""} onClick={() => setTab("audit")}>Audit Trail <b>{audit.length}</b></button>
          <button className={tab === "rules" ? "active" : ""} onClick={() => setTab("rules")}>Version Rules</button>
        </div>
        <div className="vm-export-actions">
          <button className="vm-button secondary compact" onClick={exportPdf} disabled={loading || !versions.length}>Export PDF</button>
          <button className="vm-button secondary compact" onClick={exportExcel} disabled={loading || !versions.length}>Export Excel</button>
        </div>
      </div>

      {error && <div className="vm-alert error"><strong>System alert</strong><span>{error}</span></div>}

      {tab === "history" && (
        <section className="vm-panel">
          <div className="vm-panel-head">
            <div><h2>Software Version History</h2><p>Semua rilis dan metadata build, diurutkan dari versi terbaru.</p></div>
            <div className="vm-filters">
              <label className="vm-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari versi, build, developer..." /></label>
              <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter status">
                <option value="all">Semua status</option><option value="current">Current</option><option value="available">Available</option><option value="superseded">Superseded</option>
              </select>
            </div>
          </div>
          <div className="vm-table-wrap">
            <table className="vm-table">
              <thead><tr><th>Version</th><th>Build</th><th>Release Date</th><th>Developer</th><th>Description</th><th>Status</th><th>Release Notes</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="vm-empty">Mengambil metadata versi...</td></tr>}
                {!loading && filteredVersions.map((version) => (
                  <tr key={version.version}>
                    <td><strong className="vm-version-number">{version.version}</strong><small>{version.buildEnvironment}</small></td>
                    <td><code>{version.build}</code></td><td>{formatReleaseDate(version.releaseDate)}<small>{version.releaseTime.slice(0, 5)} WIB</small></td>
                    <td>{version.developer}</td><td className="vm-description">{version.description}</td><td><StatusBadge status={version.status} /></td>
                    <td><div className="vm-row-actions"><Link href={`/software-versions/${encodeURIComponent(version.version)}`}>View Notes →</Link>
                      <button title="Buat backup" onClick={() => void runVersionAction(version, "backup")} disabled={Boolean(operation)}>Backup</button>
                      {version.status === "Available" && <button onClick={() => void runVersionAction(version, "install")} disabled={Boolean(operation)}>Update</button>}
                    </div></td>
                  </tr>
                ))}
                {!loading && !filteredVersions.length && <tr><td colSpan={7} className="vm-empty">Tidak ada versi yang sesuai dengan filter.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "audit" && (
        <section className="vm-panel">
          <div className="vm-panel-head"><div><h2>Software Update Audit Trail</h2><p>Jejak administrator untuk backup, update, dan rollback.</p></div></div>
          <div className="vm-table-wrap"><table className="vm-table"><thead><tr><th>Tanggal / Jam</th><th>User</th><th>Aksi</th><th>Versi Lama</th><th>Versi Baru</th><th>Catatan</th><th>Status</th></tr></thead><tbody>
            {audit.map((item, index) => <tr key={`${item.date}-${item.time}-${index}`}><td>{formatReleaseDate(item.date)}<small>{item.time.slice(0, 8)} WIB</small></td><td>{item.user}</td><td>{item.action}</td><td><code>{item.oldVersion}</code></td><td><code>{item.newVersion}</code></td><td className="vm-description">{item.notes}{item.backupFile && <small>Backup: {item.backupFile}</small>}</td><td><StatusBadge status={item.status} /></td></tr>)}
            {!audit.length && <tr><td colSpan={7} className="vm-empty">Belum ada aktivitas update. Setiap backup dan instalasi akan dicatat di sini.</td></tr>}
          </tbody></table></div>
        </section>
      )}

      {tab === "rules" && <VersionRules />}
    </VersionShell>
  );
}

function VersionRules() {
  const rules = [
    { name: "MAJOR", example: "V1.8.5 → V2.0.0", color: "red", text: "Modul baru, perubahan database/arsitektur, UI/UX besar, atau perubahan yang tidak kompatibel." },
    { name: "MINOR", example: "V1.2.0 → V1.3.0", color: "cyan", text: "Fitur, halaman, dashboard, laporan, menu, integrasi PLC/MQTT, atau API baru." },
    { name: "PATCH", example: "V1.3.4 → V1.3.5", color: "green", text: "Bug fix, optimasi, keamanan, validasi, tampilan, notifikasi, atau perbaikan query." }
  ];
  return <section className="vm-rule-grid">{rules.map((rule) => <article className={`vm-rule ${rule.color}`} key={rule.name}><span>{rule.name} VERSION</span><strong>{rule.example}</strong><p>{rule.text}</p></article>)}</section>;
}
