"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import VersionShell from "../components/VersionShell";
import { formatReleaseDate, type SoftwareVersion } from "../software-versions/types";

export default function AboutClient() {
  const [software, setSoftware] = useState<SoftwareVersion | null>(null);
  const [serverOnline, setServerOnline] = useState(false);

  useEffect(() => {
    fetch("/api/software-versions/current", { cache: "no-store" })
      .then((response) => { setServerOnline(response.ok); return response.ok ? response.json() : null; })
      .then(setSoftware)
      .catch(() => setServerOnline(false));
  }, []);

  const metadata = software ? [
    ["Software Name", "PredictaCore Preventive Maintenance System (CMMS)"],
    ["Version", software.version], ["Build", software.build],
    ["Release Date", `${formatReleaseDate(software.releaseDate)} · ${software.releaseTime.slice(0, 5)} WIB`],
    ["Developer", software.developer], ["Copyright", software.copyright], ["License", software.license],
    ["Database Version", software.databaseVersion], ["Server Version", software.backendVersion],
    ["API Version", software.apiVersion], ["Frontend Version", software.frontendVersion],
    ["PLC Driver Version", software.plcDriverVersion], ["Last Update", `${software.releaseDate} ${software.releaseTime.slice(0, 8)}`]
  ] : [];

  return (
    <VersionShell active="about" eyebrow="SYSTEM / PRODUCT INFORMATION" title="About Software">
      <section className="vm-about-hero">
        <div className="vm-about-logo"><img src="/assets/predictacore_logo.png" alt="PredictaCore" /></div>
        <div><span className="vm-eyebrow">INDUSTRIAL MAINTENANCE INTELLIGENCE</span><h2>Preventive Maintenance System</h2><p>Platform CMMS untuk memonitor aset, preventive maintenance, telemetri PLC, running hours, dan lifecycle software dalam satu control center.</p>
          <div className="vm-about-tags"><span>NEXT.JS</span><span>.NET 10 LTS</span><span>POSTGRESQL</span><span>SCADA READY</span></div>
        </div>
        <div className={`vm-server-state ${serverOnline ? "online" : "offline"}`}><i /><span>API SERVER</span><strong>{serverOnline ? "ONLINE" : "OFFLINE"}</strong><small>{software?.buildEnvironment ?? "Checking..."}</small></div>
      </section>
      <section className="vm-panel">
        <div className="vm-panel-head"><div><h2>System Information</h2><p>Metadata software aktif yang dilaporkan oleh backend.</p></div><Link href="/software-versions" className="vm-button secondary compact">Version History</Link></div>
        {!software ? <div className="vm-empty">Mengambil informasi software...</div> : <dl className="vm-about-list">{metadata.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
      </section>
      <footer className="vm-about-footer"><span>Built for reliable pharmaceutical manufacturing operations.</span><strong>{software?.copyright ?? "© 2026 PredictaCore"}</strong></footer>
    </VersionShell>
  );
}
