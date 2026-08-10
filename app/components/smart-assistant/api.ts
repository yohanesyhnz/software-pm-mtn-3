import type { SmartAssistantPreferences, SmartNotificationSnapshot } from "./types";

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Smart Assistant API gagal merespons (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

export async function fetchSmartNotifications(signal?: AbortSignal): Promise<SmartNotificationSnapshot> {
  return readJson<SmartNotificationSnapshot>(await fetch("/api/smart-assistant/notifications", {
    cache: "no-store",
    signal
  }));
}

export async function fetchSmartAssistantPreferences(
  username: string,
  signal?: AbortSignal
): Promise<SmartAssistantPreferences> {
  return readJson<SmartAssistantPreferences>(await fetch(
    `/api/smart-assistant/preferences?username=${encodeURIComponent(username)}`,
    { cache: "no-store", signal }
  ));
}

export async function saveSmartAssistantPreferences(
  username: string,
  preferences: SmartAssistantPreferences
): Promise<SmartAssistantPreferences> {
  const response = await fetch(`/api/smart-assistant/preferences?username=${encodeURIComponent(username)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences)
  });
  const result = await readJson<{ preferences: SmartAssistantPreferences }>(response);
  return result.preferences;
}
