import type { MachineDashboardSnapshot } from "./types";

export async function fetchMachineDashboard(signal?: AbortSignal): Promise<MachineDashboardSnapshot> {
  const response = await fetch("/api/machine-dashboard", { cache: "no-store", signal });
  if (!response.ok) throw new Error(`Machine Dashboard API gagal (${response.status}).`);
  return response.json() as Promise<MachineDashboardSnapshot>;
}

export async function saveMachineOrder(machineIds: string[]): Promise<void> {
  const response = await fetch("/api/machine-dashboard/order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ machineIds }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Urutan Machine Card gagal disimpan.");
  }
}

export function machineDashboardWebSocketUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/machine-dashboard/ws`;
}
