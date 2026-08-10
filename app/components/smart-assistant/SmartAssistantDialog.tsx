"use client";

import { motion } from "framer-motion";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "../ui/dialog";
import type { SmartAssistantConnectionState, SmartNotificationSnapshot } from "./types";

type SmartAssistantDialogProps = {
  open: boolean;
  snapshot: SmartNotificationSnapshot;
  connectionState: SmartAssistantConnectionState;
  onOpenChange: (open: boolean) => void;
  onViewLifetime: () => void;
  onSchedulePm: () => void;
};

const numberFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

function formatDate(value?: string | null) {
  if (!value) return "Belum tersedia";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default function SmartAssistantDialog({
  open,
  snapshot,
  connectionState,
  onOpenChange,
  onViewLifetime,
  onSchedulePm
}: SmartAssistantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="smart-assistant-description">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="tw-flex tw-max-h-[88dvh] tw-flex-col"
        >
          <header className="tw-relative tw-border-b tw-border-cyan-400/15 tw-px-5 tw-pb-4 tw-pt-5 sm:tw-px-6">
            <div className="tw-flex tw-items-start tw-gap-3 tw-pr-10">
              <div className="tw-flex tw-h-11 tw-w-11 tw-flex-none tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-cyan-300/25 tw-bg-cyan-400/10 tw-text-2xl" aria-hidden="true">
                🤖
              </div>
              <div className="tw-min-w-0">
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                  <DialogTitle className="tw-m-0 tw-text-lg tw-font-extrabold tw-tracking-tight sm:tw-text-xl">
                    Smart Maintenance Assistant
                  </DialogTitle>
                  <span className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider ${connectionState === "live" ? "tw-border-emerald-400/35 tw-bg-emerald-400/10 tw-text-emerald-300" : "tw-border-amber-400/35 tw-bg-amber-400/10 tw-text-amber-300"}`}>
                    <span className={`tw-h-1.5 tw-w-1.5 tw-rounded-full ${connectionState === "live" ? "tw-bg-emerald-400" : "tw-bg-amber-400"}`} />
                    {connectionState === "live" ? "WebSocket Live" : "Menghubungkan"}
                  </span>
                </div>
                <DialogDescription id="smart-assistant-description" className="smart-assistant-muted tw-mb-0 tw-mt-1 tw-text-sm">
                  Spare part yang membutuhkan perhatian.
                </DialogDescription>
              </div>
            </div>

            <DialogClose asChild>
              <button
                type="button"
                className="tw-absolute tw-right-4 tw-top-4 tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-slate-400/20 tw-bg-slate-500/10 tw-text-base tw-transition hover:tw-bg-red-500/15 hover:tw-text-red-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-cyan-400"
                aria-label="Tutup Smart Maintenance Assistant"
              >
                ✕
              </button>
            </DialogClose>

            <div className="tw-mt-4 tw-grid tw-grid-cols-3 tw-gap-2">
              <div className="smart-assistant-soft-surface tw-rounded-xl tw-border tw-p-2.5 tw-text-center">
                <strong className="smart-assistant-critical-text tw-block tw-text-base">{snapshot.criticalCount}</strong>
                <span className="smart-assistant-muted tw-text-[10px] tw-font-bold tw-uppercase">Critical</span>
              </div>
              <div className="smart-assistant-soft-surface tw-rounded-xl tw-border tw-p-2.5 tw-text-center">
                <strong className="smart-assistant-warning-text tw-block tw-text-base">{snapshot.warningCount}</strong>
                <span className="smart-assistant-muted tw-text-[10px] tw-font-bold tw-uppercase">Warning</span>
              </div>
              <div className="smart-assistant-soft-surface tw-rounded-xl tw-border tw-p-2.5 tw-text-center">
                <strong className="smart-assistant-accent-text tw-block tw-text-base">{snapshot.total}</strong>
                <span className="smart-assistant-muted tw-text-[10px] tw-font-bold tw-uppercase">Total Aktif</span>
              </div>
            </div>
          </header>

          <section className="smart-assistant-scrollbar tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-p-4 sm:tw-p-5" aria-label="Daftar spare part Warning dan Critical">
            {snapshot.notifications.length === 0 ? (
              <div className="smart-assistant-soft-surface tw-flex tw-min-h-48 tw-flex-col tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-p-6 tw-text-center">
                <span className="tw-text-4xl" aria-hidden="true">✅</span>
                <h3 className="tw-mb-1 tw-mt-3 tw-text-base tw-font-bold">Semua spare part dalam kondisi sehat</h3>
                <p className="smart-assistant-muted tw-m-0 tw-max-w-sm tw-text-sm">Tidak ada status Warning atau Critical pada pemantauan saat ini.</p>
              </div>
            ) : (
              <div className="tw-space-y-3">
                {snapshot.notifications.map((notification, index) => {
                  const critical = notification.status === "CRITICAL";
                  return (
                    <motion.article
                      key={notification.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.24, delay: Math.min(index * 0.035, 0.2) }}
                      className={`smart-assistant-surface tw-rounded-xl tw-border tw-border-l-4 tw-p-4 ${critical ? "tw-border-l-red-500" : "tw-border-l-amber-400"}`}
                    >
                      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                        <div className="tw-min-w-0">
                          <h3 className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-extrabold sm:tw-text-base">
                            <span aria-hidden="true">{critical ? "🔴" : "🟡"}</span>
                            <span className="tw-truncate">{notification.partName}</span>
                          </h3>
                          <p className="smart-assistant-muted tw-mb-0 tw-mt-1 tw-text-xs">Machine: <strong className="tw-text-inherit">{notification.machineName}</strong></p>
                        </div>
                        <span className={`tw-flex-none tw-rounded-md tw-border tw-px-2 tw-py-1 tw-text-[10px] tw-font-black tw-tracking-wider ${critical ? "smart-assistant-critical-text tw-border-red-400/40 tw-bg-red-500/10" : "smart-assistant-warning-text tw-border-amber-400/40 tw-bg-amber-400/10"}`}>
                          {notification.status}
                        </span>
                      </div>

                      <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-2 sm:tw-grid-cols-4">
                        <Metric label="Remaining Life" value={`${numberFormatter.format(notification.remainingPercentage)}%`} critical={critical} />
                        <Metric label="Remaining Hours" value={`${numberFormatter.format(notification.remainingHours)} jam`} />
                        <Metric label="Next Replacement" value={formatDate(notification.nextReplacementDate)} />
                        <Metric label="Last Replacement" value={formatDate(notification.lastReplacementDate)} />
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </section>

          <footer className="tw-flex tw-flex-col tw-gap-2 tw-border-t tw-border-cyan-400/15 tw-p-4 sm:tw-flex-row sm:tw-justify-end sm:tw-px-5">
            <button
              type="button"
              onClick={onViewLifetime}
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-cyan-400/35 tw-bg-cyan-400/10 tw-px-4 tw-text-sm tw-font-bold tw-text-cyan-200 tw-transition hover:tw-bg-cyan-400/20 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-cyan-400"
            >
              Lihat Detail
            </button>
            <button
              type="button"
              onClick={onSchedulePm}
              className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-emerald-400/35 tw-bg-emerald-500/90 tw-px-4 tw-text-sm tw-font-extrabold tw-text-slate-950 tw-transition hover:tw-bg-emerald-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-300"
            >
              Jadwalkan PM
            </button>
          </footer>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value, critical = false }: { label: string; value: string; critical?: boolean }) {
  return (
    <div className="smart-assistant-soft-surface tw-min-w-0 tw-rounded-lg tw-border tw-p-2.5">
      <span className="smart-assistant-muted tw-block tw-text-[9px] tw-font-bold tw-uppercase tw-tracking-wide">{label}</span>
      <strong className={`tw-mt-1 tw-block tw-truncate tw-text-xs ${critical ? "smart-assistant-critical-text" : "tw-text-inherit"}`}>{value}</strong>
    </div>
  );
}
