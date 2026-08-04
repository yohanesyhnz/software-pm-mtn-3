"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SoftwareVersion } from "../software-versions/types";

type UpdateResponse = {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion?: string;
  latest?: SoftwareVersion;
};

export default function UpdateChecker() {
  const [update, setUpdate] = useState<UpdateResponse | null>(null);
  const [installing, setInstalling] = useState(false);
  const [message, setMessage] = useState("");
  const currentVersion = update?.currentVersion ?? "versi aktif";

  useEffect(() => {
    if (sessionStorage.getItem("cmms-update-remind-later") === "1") return;
    fetch("/api/software-versions/current", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((current: SoftwareVersion | null) => current
        ? fetch(`/api/software-versions/update-check?current=${encodeURIComponent(current.version)}`)
        : null)
      .then((response) => response?.ok ? response.json() : null)
      .then((data) => data?.updateAvailable && setUpdate(data))
      .catch(() => undefined);
  }, []);

  if (!update?.latest) return null;

  async function install() {
    if (!update?.latest) return;
    setInstalling(true);
    setMessage("Membuat backup database dan konfigurasi...");
    try {
      const response = await fetch(`/api/software-versions/${encodeURIComponent(update.latest.version)}/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: "Administrator", backupBeforeUpdate: true, notes: "Update dari pemeriksa versi aplikasi." })
      });
      if (!response.ok) throw new Error("Update gagal. Sistem telah menjalankan rollback otomatis.");
      setMessage("Update berhasil. Muat ulang aplikasi untuk menggunakan versi terbaru.");
      setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update gagal.");
      setInstalling(false);
    }
  }

  return (
    <div className="vm-update-overlay" role="dialog" aria-modal="true" aria-label="Pembaruan software tersedia">
      <section className="vm-update-card">
        <div className="vm-update-icon">UP</div>
        <span className="vm-eyebrow">UPDATE CHECKER</span>
        <h2>Versi terbaru tersedia.</h2>
        <p>{currentVersion} dapat diperbarui ke <strong>{update.latest.version}</strong>. Backup otomatis dibuat sebelum instalasi dan rollback dijalankan jika proses gagal.</p>
        {message && <div className="vm-inline-status">{message}</div>}
        <div className="vm-update-actions">
          <button className="vm-button primary" onClick={install} disabled={installing}>{installing ? "Memproses..." : "Update Sekarang"}</button>
          <Link className="vm-button secondary" href={`/software-versions/${encodeURIComponent(update.latest.version)}`}>Lihat Perubahan</Link>
          <button className="vm-button ghost" onClick={() => { sessionStorage.setItem("cmms-update-remind-later", "1"); setUpdate(null); }}>Nanti</button>
        </div>
      </section>
    </div>
  );
}
