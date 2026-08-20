"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMachineDashboard, machineDashboardWebSocketUrl, saveMachineOrder } from "./machine-dashboard-api";
import { MachineCard } from "./MachineCard";
import type { MachineDashboardItem, MachineDashboardSnapshot, MachineDisplayMode, MachineGrouping } from "./types";

const QUERY_KEY = ["dynamic-machine-dashboard"] as const;
const groupingLabels: Record<MachineGrouping, string> = {
  ALL: "Semua Mesin",
  LINE: "Per Line",
  AREA: "Per Area",
  DEPARTMENT: "Per Department",
  MACHINE_TYPE: "Per Jenis Mesin",
};

function mergeSnapshot(previous: MachineDashboardSnapshot | undefined, incoming: MachineDashboardSnapshot): MachineDashboardSnapshot {
  if (!previous) return incoming;
  const previousById = new Map(previous.machines.map((machine) => [machine.machineId, machine]));
  const machines = incoming.machines.map((machine) => {
    const old = previousById.get(machine.machineId);
    return old && JSON.stringify(old) === JSON.stringify(machine) ? old : machine;
  });
  return { ...incoming, machines };
}

function groupKey(machine: MachineDashboardItem, grouping: MachineGrouping): string {
  if (grouping === "LINE") return machine.line || "Tanpa Line";
  if (grouping === "AREA") return machine.area || "Tanpa Area";
  if (grouping === "DEPARTMENT") return machine.department || "Tanpa Department";
  if (grouping === "MACHINE_TYPE") return machine.machineType || "Tanpa Jenis Mesin";
  return "Semua Mesin";
}

export default function DynamicMachineDashboard() {
  const queryClient = useQueryClient();
  const [authenticated, setAuthenticated] = useState(false);
  const [connection, setConnection] = useState<"CONNECTED" | "CONNECTING" | "OFFLINE">("CONNECTING");
  const [grouping, setGrouping] = useState<MachineGrouping>("LINE");
  const [displayMode, setDisplayMode] = useState<MachineDisplayMode>("AUTO");
  const [ordering, setOrdering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const retryRef = useRef(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: ({ signal }) => fetchMachineDashboard(signal),
    staleTime: 30_000,
    retry: 2,
    enabled: authenticated,
  });

  useEffect(() => {
    const onAuthenticated = () => setAuthenticated(true);
    const onLoggedOut = () => setAuthenticated(false);
    setAuthenticated(window.predictaCoreIsAuthenticated?.() ?? false);
    window.addEventListener("predictacore:authenticated", onAuthenticated);
    window.addEventListener("predictacore:logout", onLoggedOut);
    window.addEventListener("predictacore:session-expired", onLoggedOut);
    return () => {
      window.removeEventListener("predictacore:authenticated", onAuthenticated);
      window.removeEventListener("predictacore:logout", onLoggedOut);
      window.removeEventListener("predictacore:session-expired", onLoggedOut);
    };
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setConnection("OFFLINE");
      return;
    }
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    const connect = () => {
      if (stopped) return;
      setConnection("CONNECTING");
      socket = new WebSocket(machineDashboardWebSocketUrl());
      socket.onopen = () => { retryRef.current = 0; setConnection("CONNECTED"); };
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { type?: string; data?: MachineDashboardSnapshot };
          if (payload.type === "machine-dashboard" && payload.data) {
            queryClient.setQueryData<MachineDashboardSnapshot>(QUERY_KEY, (old) => mergeSnapshot(old, payload.data!));
          }
        } catch {
          // Ignore malformed transport frames; the next valid snapshot repairs state.
        }
      };
      socket.onerror = () => setConnection("OFFLINE");
      socket.onclose = () => {
        if (stopped) return;
        setConnection("OFFLINE");
        const delay = Math.min(15_000, 1000 * 2 ** retryRef.current++);
        retryTimer = setTimeout(connect, delay);
      };
    };
    connect();
    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, [authenticated, queryClient]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [message]);

  const machines = query.data?.machines ?? [];
  const databaseConnection = query.data?.connectionStatus ?? "UNAVAILABLE";
  const realtimeConnection = connection !== "CONNECTED"
    ? connection
    : databaseConnection === "CONNECTED" ? "CONNECTED" : "OFFLINE";
  const groups = useMemo(() => {
    const grouped = new Map<string, MachineDashboardItem[]>();
    for (const machine of machines) {
      const key = groupKey(machine, grouping);
      grouped.set(key, [...(grouped.get(key) ?? []), machine]);
    }
    return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right, "id", { numeric: true }));
  }, [grouping, machines]);

  const onMissingUrl = useCallback((machineName: string) => {
    setMessage(`Realtime dashboard untuk ${machineName} belum dikonfigurasi.`);
  }, []);

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || !query.data) return;
    const oldIndex = machines.findIndex((machine) => machine.machineId === active.id);
    const newIndex = machines.findIndex((machine) => machine.machineId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(machines, oldIndex, newIndex).map((machine, index) => ({ ...machine, displayOrder: index + 1 }));
    queryClient.setQueryData<MachineDashboardSnapshot>(QUERY_KEY, { ...query.data, machines: reordered });
    try {
      await saveMachineOrder(reordered.map((machine) => machine.machineId));
      setMessage("Urutan Machine Card tersimpan di database.");
    } catch (error) {
      queryClient.setQueryData(QUERY_KEY, query.data);
      setMessage(error instanceof Error ? error.message : "Urutan gagal disimpan.");
    }
  };

  return (
    <div className={`dynamic-machine-dashboard display-${displayMode.toLowerCase()}`} data-source={query.data?.source ?? "unavailable"}>
      <div className="machine-dashboard-toolbar">
        <div>
          <h4>Dynamic Machine Card Dashboard</h4>
          <p>Satu card untuk satu machine_id · realtime tanpa reload</p>
        </div>
        <div className="machine-dashboard-controls">
          <label>
            <span>Grouping</span>
            <select value={grouping} onChange={(event) => setGrouping(event.target.value as MachineGrouping)} aria-label="Kelompokkan Machine Card">
              {Object.entries(groupingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            <span>Display</span>
            <select value={displayMode} onChange={(event) => setDisplayMode(event.target.value as MachineDisplayMode)} aria-label="Ukuran Machine Card">
              {(["AUTO", "COMPACT", "STANDARD", "LARGE"] as const).map((mode) => <option key={mode}>{mode}</option>)}
            </select>
          </label>
          <button type="button" className={ordering ? "active" : ""} onClick={() => setOrdering((value) => !value)} aria-pressed={ordering}>
            {ordering ? "Selesai Atur" : "Atur Urutan"}
          </button>
          <span className={`realtime-connection ${realtimeConnection.toLowerCase()}`} role="status">
            <i aria-hidden="true" /> Realtime: {realtimeConnection}
            <small>PostgreSQL {databaseConnection}</small>
          </span>
        </div>
      </div>

      {message ? <div className="machine-dashboard-message" role="status">{message}</div> : null}
      {query.isPending ? <div className="machine-dashboard-state"><span className="machine-dashboard-spinner" /> Memuat konfigurasi mesin…</div> : null}
      {query.isError ? (
        <div className="machine-dashboard-state error" role="alert">
          <strong>Dashboard mesin belum tersedia.</strong>
          <span>{query.error instanceof Error ? query.error.message : "Backend tidak dapat dijangkau."}</span>
          <button type="button" onClick={() => query.refetch()}>Coba Lagi</button>
        </div>
      ) : null}
      {!query.isPending && !query.isError && machines.length === 0 ? (
        <div className="machine-dashboard-state">
          <strong>Belum ada mesin aktif.</strong>
          <span>Tambahkan atau aktifkan mesin melalui Master Machine.</span>
        </div>
      ) : null}

      {machines.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          {groups.map(([groupName, groupMachines]) => (
            <section
              className="machine-card-group"
              key={groupName}
              aria-label={grouping === "ALL" ? "Semua Mesin" : undefined}
              aria-labelledby={grouping === "ALL" ? undefined : `machine-group-${groupName.replace(/\W+/g, "-")}`}
            >
              {grouping !== "ALL" ? (
                <header>
                  <h5 id={`machine-group-${groupName.replace(/\W+/g, "-")}`}>{groupName}</h5>
                  <span>{groupMachines.length} mesin</span>
                </header>
              ) : null}
              <SortableContext items={groupMachines.map((machine) => machine.machineId)} strategy={rectSortingStrategy}>
                <div className="dynamic-machine-grid">
                  {groupMachines.map((machine) => (
                    <MachineCard
                      key={machine.machineId}
                      machine={machine}
                      displayMode={displayMode}
                      ordering={ordering}
                      onMissingUrl={onMissingUrl}
                    />
                  ))}
                </div>
              </SortableContext>
            </section>
          ))}
        </DndContext>
      ) : null}
    </div>
  );
}
