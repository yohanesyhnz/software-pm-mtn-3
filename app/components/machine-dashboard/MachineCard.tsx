"use client";

import { memo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MachineDashboardItem, MachineDisplayMode } from "./types";

const numberFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const timestampFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "medium" });

function safeNumber(value: number | null): string {
  return value !== null && Number.isFinite(value) ? numberFormatter.format(value) : "--";
}

function MachineCardComponent({
  machine,
  displayMode,
  ordering,
  onMissingUrl,
}: {
  machine: MachineDashboardItem;
  displayMode: MachineDisplayMode;
  ordering: boolean;
  onMissingUrl: (machineName: string) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: machine.machineId,
    disabled: !ordering,
  });
  const config = machine.cardConfiguration;
  const effectiveMode = displayMode === "AUTO" ? machine.displayMode : displayMode;
  const style = { transform: CSS.Transform.toString(transform), transition };

  const openDashboard = () => {
    if (ordering) return;
    if (!machine.realtimeDashboardUrl) {
      onMissingUrl(machine.machineName);
      return;
    }
    try {
      const url = new URL(machine.realtimeDashboardUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("unsupported protocol");
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch {
      onMissingUrl(machine.machineName);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!ordering && event.key === "Enter") {
      event.preventDefault();
      openDashboard();
    }
  };

  const stopCardClick = (event: MouseEvent<HTMLButtonElement>) => event.stopPropagation();
  const healthLabel = machine.health === null ? "N/A" : `${safeNumber(machine.health)}%`;
  const genericParameterLabel = machine.parameterType === "WEIGHT"
    ? "BOBOT AKTUAL"
    : machine.parameterType === "SPEED" ? "SPEED" : machine.parameterType === "COUNTER" ? "COUNTER" : null;
  const parameterLabel = machine.secondaryParameterName ? (machine.parameterName ?? genericParameterLabel) : genericParameterLabel;
  const parameterEnabled = machine.parameterType === "COUNTER"
    ? config.showCounter
    : machine.parameterType === "SPEED" ? config.showSpeed : true;
  const showPrimaryParameter = Boolean(parameterLabel) && config.showRealtimeValue !== false && parameterEnabled;
  const lastUpdate = machine.sourceTimestamp ?? machine.realtimeUpdatedAt;
  const lastUpdateLabel = lastUpdate && !Number.isNaN(Date.parse(lastUpdate)) ? timestampFormatter.format(new Date(lastUpdate)) : "--";

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`dynamic-machine-card status-${machine.status.toLowerCase().replace(" ", "-")} mode-${effectiveMode.toLowerCase()}${isDragging ? " is-dragging" : ""}`}
      tabIndex={ordering ? -1 : 0}
      role={ordering ? "group" : "link"}
      aria-label={`${machine.machineName}, status ${machine.status}, health ${healthLabel}${machine.realtimeDashboardUrl ? ", buka dashboard realtime" : ", dashboard realtime belum dikonfigurasi"}`}
      onClick={openDashboard}
      onKeyDown={onKeyDown}
    >
      {ordering ? (
        <button
          type="button"
          className="machine-drag-handle"
          aria-label={`Pindahkan ${machine.machineName}`}
          title="Drag atau gunakan keyboard untuk mengatur urutan"
          onClick={stopCardClick}
          {...attributes}
          {...listeners}
        >
          <span aria-hidden="true">⠿</span>
        </button>
      ) : null}

      {config.showHealth ? (
        <div className={`machine-health health-${machine.healthStatus.toLowerCase().replace(/\W+/g, "-")}`}>
          <strong>{healthLabel}</strong>
          <span>{machine.healthStatus === "N/A" ? "NO PART DATA" : machine.healthStatus}</span>
        </div>
      ) : null}

      {config.showImage ? (
        <div className="machine-image-frame">
          {machine.machineImageUrl && !imageFailed ? (
            // Native img is required for the backend-managed runtime upload path.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={machine.machineImageUrl}
              alt={`Foto mesin ${machine.machineName}`}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="machine-image-placeholder" role="img" aria-label="No Machine Image">
              <span aria-hidden="true">⚙</span>
              <small>No Machine Image</small>
            </div>
          )}
        </div>
      ) : null}

      <div className="machine-identity">
        {config.showMachineName ? <h5 title={machine.machineName}>{machine.machineName}</h5> : null}
        {config.showMachineCode ? <code title={machine.machineCode}>{machine.machineCode}</code> : null}
        <div className="machine-location">
          {config.showLine ? <span>{machine.line || "Tanpa Line"}</span> : null}
          {config.showArea && machine.area ? <span>{machine.area}</span> : null}
        </div>
      </div>

      {config.showStatus ? (
        <div className="machine-status-label">
          <i aria-hidden="true" />
          <span>{machine.status}</span>
        </div>
      ) : null}

      <dl className="machine-metrics">
        {showPrimaryParameter ? (
          <div className="machine-primary-metric" title={machine.parameterName ?? parameterLabel ?? undefined}>
            <dt>{parameterLabel}</dt>
            <dd>{safeNumber(machine.parameterValue)} <small>{machine.parameterValue === null ? "" : machine.parameterUnit}</small></dd>
          </div>
        ) : null}
        {machine.secondaryParameterName && config.showCounter ? (
          <div className="machine-secondary-metric" title={machine.secondaryParameterName}>
            <dt>{machine.secondaryParameterLabel ?? machine.secondaryParameterName}</dt>
            <dd>{safeNumber(machine.secondaryParameterValue)} <small>{machine.secondaryParameterValue === null ? "" : machine.secondaryParameterUnit}</small></dd>
          </div>
        ) : null}
        {!machine.parameterType && config.showCounter ? (
          <div>
            <dt>COUNTER</dt>
            <dd>{safeNumber(machine.counter)} <small>{machine.counter === null ? "" : machine.counterUnit}</small></dd>
          </div>
        ) : null}
        {!machine.parameterType && config.showSpeed ? (
          <div>
            <dt>SPEED</dt>
            <dd>{safeNumber(machine.speed)} <small>{machine.speed === null ? "" : machine.speedUnit}</small></dd>
          </div>
        ) : null}
        {config.showRunningHours ? (
          <div className="running-hours-metric">
            <dt>RUNNING HOURS</dt>
            <dd>{safeNumber(machine.runningHours)} <small>{machine.runningHours === null ? "" : "h"}</small></dd>
          </div>
        ) : null}
      </dl>
      <div className={`machine-data-freshness ${machine.connectionStatus.toLowerCase().replaceAll(" ", "-")}`}>
        <span>{machine.connectionStatus}</span>
        <time dateTime={lastUpdate ?? undefined}>Last Update: {lastUpdateLabel}</time>
      </div>
      <span className="machine-card-open-hint" aria-hidden="true">Realtime ↗</span>
    </article>
  );
}

export const MachineCard = memo(MachineCardComponent, (previous, next) =>
  previous.machine === next.machine &&
  previous.displayMode === next.displayMode &&
  previous.ordering === next.ordering &&
  previous.onMissingUrl === next.onMissingUrl,
);
