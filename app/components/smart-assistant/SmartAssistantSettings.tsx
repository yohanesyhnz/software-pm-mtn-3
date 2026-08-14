"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SoftwareVersion } from "../../software-versions/types";
import type {
  SmartAssistantConnectionState,
  SmartAssistantPreferences
} from "./types";

type SmartAssistantSettingsProps = {
  preferences: SmartAssistantPreferences;
  connectionState: SmartAssistantConnectionState;
  source: string;
  onChange: (preferences: SmartAssistantPreferences) => Promise<void>;
  onLogout: () => void;
};

export default function SmartAssistantSettings({
  preferences,
  connectionState,
  source,
  onChange,
  onLogout
}: SmartAssistantSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [software, setSoftware] = useState<SoftwareVersion | null>(null);
  const [softwareStatus, setSoftwareStatus] = useState<"loading" | "online" | "offline">("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/software-versions/current", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Version API unavailable");
        return response.json() as Promise<SoftwareVersion>;
      })
      .then((data) => {
        setSoftware(data);
        setSoftwareStatus("online");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSoftwareStatus("offline");
      });

    return () => controller.abort();
  }, []);

  async function update(key: keyof SmartAssistantPreferences, value: boolean) {
    setSaving(true);
    setMessage("");
    try {
      await onChange({ ...preferences, [key]: value });
      setMessage("Pengaturan Smart Assistant tersimpan.");
    } catch {
      setMessage("Pengaturan gagal disimpan. Periksa koneksi backend.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="smart-assistant-surface tw-mx-auto tw-w-full tw-max-w-4xl tw-rounded-2xl tw-border tw-p-5 tw-shadow-scada sm:tw-p-7" aria-labelledby="smart-assistant-settings-title">
      <div className="tw-flex tw-flex-col tw-gap-4 tw-border-b tw-border-cyan-400/15 tw-pb-5 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
        <div>
          <span className="tw-text-[10px] tw-font-black tw-uppercase tw-tracking-[0.2em] tw-text-cyan-400">Industrial Notification Control</span>
          <h2 id="smart-assistant-settings-title" className="tw-mb-1 tw-mt-2 tw-text-xl tw-font-extrabold">Smart Notification Assistant</h2>
          <p className="smart-assistant-muted tw-m-0 tw-text-sm">Atur notifikasi, animasi robot, dan perilaku popup otomatis per user.</p>
        </div>
        <div className="smart-assistant-soft-surface tw-flex tw-items-center tw-gap-2 tw-self-start tw-rounded-full tw-border tw-px-3 tw-py-2 tw-text-xs tw-font-bold">
          <span className={`tw-h-2 tw-w-2 tw-rounded-full ${connectionState === "live" ? "tw-bg-emerald-400" : "tw-bg-amber-400"}`} />
          {connectionState === "live" ? "WebSocket Live" : "WebSocket Reconnecting"}
        </div>
      </div>

      <div className="tw-divide-y tw-divide-cyan-400/10">
        <SettingRow
          title="Enable Smart Assistant"
          description="Aktifkan Bell pintar, daftar Warning/Critical, dan akses popup Assistant."
          checked={preferences.enableSmartAssistant}
          disabled={saving}
          onCheckedChange={(checked) => update("enableSmartAssistant", checked)}
        />
        <SettingRow
          title="Enable Robot Animation"
          description="Tampilkan robot melayang dari Bell dengan transform ringan 600–900 ms."
          checked={preferences.enableRobotAnimation}
          disabled={saving || !preferences.enableSmartAssistant}
          onCheckedChange={(checked) => update("enableRobotAnimation", checked)}
        />
        <SettingRow
          title="Enable Auto Popup"
          description="Buka Assistant satu kali setelah login atau refresh; update realtime hanya mengubah Bell."
          checked={preferences.enableAutoPopup}
          disabled={saving || !preferences.enableSmartAssistant}
          onCheckedChange={(checked) => update("enableAutoPopup", checked)}
        />
      </div>

      <div className="tw-mt-5 tw-grid tw-gap-3 sm:tw-grid-cols-[1fr_auto] sm:tw-items-center">
        <div className="smart-assistant-soft-surface tw-rounded-xl tw-border tw-p-3 tw-text-xs">
          <span className="smart-assistant-muted">Data source aktif: </span>
          <strong>{source === "postgresql" ? "PostgreSQL / spare_parts" : "State Store fallback (trial)"}</strong>
          {message && <div className="tw-mt-1 tw-text-cyan-300" role="status">{message}</div>}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="tw-min-h-11 tw-rounded-lg tw-border tw-border-red-400/30 tw-bg-red-500/10 tw-px-4 tw-text-sm tw-font-bold tw-text-red-300 tw-transition hover:tw-bg-red-500/20 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-red-400"
        >
          Logout &amp; Login Ulang
        </button>
      </div>

      <section className="tw-mt-6 tw-border-t tw-border-cyan-400/15 tw-pt-5" aria-labelledby="system-information-title">
        <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
          <div>
            <span className="tw-text-[10px] tw-font-black tw-uppercase tw-tracking-[0.2em] tw-text-cyan-400">System Information</span>
            <h2 id="system-information-title" className="tw-mb-1 tw-mt-2 tw-text-lg tw-font-extrabold">PredictaCore CMMS</h2>
            <p className="smart-assistant-muted tw-m-0 tw-max-w-2xl tw-text-sm">
              Dashboard monitoring mesin dan preventive maintenance berbasis Next.js, ASP.NET Core, dan PostgreSQL Acquisition.
            </p>
          </div>
          <span className={`tw-inline-flex tw-w-fit tw-items-center tw-gap-2 tw-rounded-full tw-border tw-px-3 tw-py-2 tw-text-xs tw-font-bold ${softwareStatus === "online" ? "tw-border-emerald-400/30 tw-bg-emerald-500/10 tw-text-emerald-300" : softwareStatus === "offline" ? "tw-border-red-400/30 tw-bg-red-500/10 tw-text-red-300" : "tw-border-amber-400/30 tw-bg-amber-500/10 tw-text-amber-300"}`}>
            <span className={`tw-h-2 tw-w-2 tw-rounded-full ${softwareStatus === "online" ? "tw-bg-emerald-400" : softwareStatus === "offline" ? "tw-bg-red-400" : "tw-bg-amber-400"}`} />
            {softwareStatus === "online" ? "API Online" : softwareStatus === "offline" ? "API Offline" : "Memuat..."}
          </span>
        </div>

        <dl className="tw-mb-0 tw-mt-4 tw-grid tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
          <SystemInfo label="Versi" value={software?.version ?? "—"} />
          <SystemInfo label="Build" value={software?.build ?? "—"} />
          <SystemInfo label="Backend" value={software?.backendVersion ?? ".NET 10"} />
          <SystemInfo label="Database" value={software?.postgreSqlVersion ?? "PostgreSQL"} />
        </dl>

        <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-text-xs">
          <span className="smart-assistant-muted">{software?.copyright ?? "© 2026 PredictaCore"}</span>
          <Link href="/software-versions" className="tw-font-bold tw-text-cyan-400 tw-no-underline hover:tw-text-cyan-300">Riwayat versi lengkap →</Link>
        </div>
      </section>
    </section>
  );
}

function SystemInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="smart-assistant-soft-surface tw-min-w-0 tw-rounded-xl tw-border tw-p-3">
      <dt className="smart-assistant-muted tw-text-[10px] tw-font-black tw-uppercase tw-tracking-wider">{label}</dt>
      <dd className="tw-m-0 tw-mt-1 tw-break-words tw-text-sm tw-font-extrabold">{value}</dd>
    </div>
  );
}

function SettingRow({
  title,
  description,
  checked,
  disabled,
  onCheckedChange
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-5 tw-py-5">
      <div>
        <h3 className="tw-m-0 tw-text-sm tw-font-extrabold">{title}</h3>
        <p className="smart-assistant-muted tw-mb-0 tw-mt-1 tw-max-w-2xl tw-text-xs sm:tw-text-sm">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={`tw-relative tw-h-7 tw-w-12 tw-flex-none tw-rounded-full tw-border tw-transition focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-cyan-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${checked ? "tw-border-emerald-300/60 tw-bg-emerald-500" : "tw-border-slate-400/30 tw-bg-slate-600/60"}`}
      >
        <span className={`tw-absolute tw-top-0.5 tw-h-5 tw-w-5 tw-rounded-full tw-bg-white tw-shadow tw-transition-transform ${checked ? "tw-translate-x-6" : "tw-translate-x-0.5"}`} />
      </button>
    </div>
  );
}
