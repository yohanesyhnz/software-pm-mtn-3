"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import VersionShell from "../../components/VersionShell";
import { changeLogSections, formatReleaseDate, type SoftwareVersion } from "../types";

export default function ReleaseNotesClient() {
  const params = useParams<{ version: string }>();
  const [version, setVersion] = useState<SoftwareVersion | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/software-versions/${encodeURIComponent(params.version)}`, { cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error("Release Notes tidak ditemukan."); return response.json(); })
      .then(setVersion)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Data gagal dimuat."));
  }, [params.version]);

  return (
    <VersionShell
      active="versions"
      eyebrow="SOFTWARE CONTROL / RELEASE NOTES"
      title={version ? `Release Notes ${version.version}` : "Release Notes"}
      actions={<button className="vm-button secondary compact" onClick={() => window.print()}>Print / PDF</button>}
    >
      <div className="vm-breadcrumb"><Link href="/software-versions">Software Version History</Link><span>/</span><strong>{version?.version ?? params.version}</strong></div>
      {error && <div className="vm-alert error"><strong>System alert</strong><span>{error}</span></div>}
      {!version && !error && <section className="vm-panel vm-loading-panel">Memuat release notes...</section>}
      {version && (
        <>
          <section className="vm-release-hero">
            <div><span className="vm-eyebrow">STABLE RELEASE · {version.buildEnvironment.toUpperCase()}</span><h2>{version.version}</h2><p>{version.description}</p></div>
            <div className="vm-release-stamp"><span>RELEASED</span><strong>{formatReleaseDate(version.releaseDate)}</strong><small>{version.releaseTime.slice(0, 5)} WIB · Build {version.build}</small></div>
          </section>
          <section className="vm-metadata-grid">
            {[
              ["Developer", version.developer], ["Frontend", version.frontendVersion], ["Backend", version.backendVersion],
              ["API Version", version.apiVersion], ["Database", version.databaseVersion], ["PostgreSQL", version.postgreSqlVersion],
              ["PLC Driver", version.plcDriverVersion], ["Status", version.status]
            ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
          </section>
          <section className="vm-changelog-grid">
            {changeLogSections.map((section) => (
              <article className={`vm-change-card ${section.tone}`} key={section.key}>
                <header><span className="vm-change-symbol">{section.label.slice(0, 2).toUpperCase()}</span><div><h3>{section.label}</h3><small>{version.changeLog[section.key].length} item</small></div></header>
                {version.changeLog[section.key].length ? <ul>{version.changeLog[section.key].map((entry) => <li key={entry}>{entry}</li>)}</ul> : <p className="vm-no-change">Tidak ada perubahan pada kategori ini.</p>}
              </article>
            ))}
          </section>
        </>
      )}
    </VersionShell>
  );
}
