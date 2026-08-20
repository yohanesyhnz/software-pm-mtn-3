"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { fetchSmartAssistantPreferences, fetchSmartNotifications, saveSmartAssistantPreferences } from "./api";
import {
  DEFAULT_SMART_ASSISTANT_PREFERENCES,
  EMPTY_NOTIFICATION_SNAPSHOT,
  type SmartAssistantConnectionState,
  type SmartAssistantPreferences,
  type SmartNotificationSnapshot
} from "./types";

export const smartNotificationQueryKey = ["smart-assistant", "notifications"] as const;
const preferenceQueryKey = (username: string) => ["smart-assistant", "preferences", username] as const;

export function useSmartAssistantData(username: string, authenticated: boolean) {
  const queryClient = useQueryClient();
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempt = useRef(0);
  const [connectionState, setConnectionState] = useState<SmartAssistantConnectionState>("connecting");

  const notificationsQuery = useQuery({
    queryKey: smartNotificationQueryKey,
    queryFn: ({ signal }) => fetchSmartNotifications(signal),
    initialData: EMPTY_NOTIFICATION_SNAPSHOT,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled: authenticated
  });

  const preferencesQuery = useQuery({
    queryKey: preferenceQueryKey(username),
    queryFn: ({ signal }) => fetchSmartAssistantPreferences(username, signal),
    initialData: DEFAULT_SMART_ASSISTANT_PREFERENCES,
    staleTime: 60_000,
    enabled: authenticated
  });

  useEffect(() => {
    if (!authenticated) {
      setConnectionState("offline");
      return;
    }
    let disposed = false;
    let socket: WebSocket | null = null;

    const connect = () => {
      if (disposed) return;
      setConnectionState(reconnectAttempt.current > 0 ? "reconnecting" : "connecting");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(`${protocol}//${window.location.host}/api/smart-assistant/ws`);

      socket.addEventListener("open", () => {
        reconnectAttempt.current = 0;
        setConnectionState("live");
      });

      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(String(event.data)) as { type?: string; data?: SmartNotificationSnapshot };
          if (message.type === "smart-notifications" && message.data) {
            queryClient.setQueryData(smartNotificationQueryKey, message.data);
          }
        } catch {
          // Ignore malformed frames and keep the last valid notification snapshot.
        }
      });

      socket.addEventListener("close", () => {
        if (disposed) return;
        reconnectAttempt.current += 1;
        setConnectionState("reconnecting");
        const delay = Math.min(10_000, 1_000 * 2 ** Math.min(reconnectAttempt.current, 3));
        reconnectTimer.current = setTimeout(connect, delay);
      });

      socket.addEventListener("error", () => {
        setConnectionState("offline");
        socket?.close();
      });
    };

    connect();
    return () => {
      disposed = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      socket?.close();
    };
  }, [authenticated, queryClient]);

  async function updatePreferences(next: SmartAssistantPreferences) {
    queryClient.setQueryData(preferenceQueryKey(username), next);
    try {
      const saved = await saveSmartAssistantPreferences(username, next);
      queryClient.setQueryData(preferenceQueryKey(username), saved);
    } catch (error) {
      await queryClient.invalidateQueries({ queryKey: preferenceQueryKey(username) });
      throw error;
    }
  }

  return {
    snapshot: notificationsQuery.data,
    notificationsLoading: notificationsQuery.isFetching,
    notificationsError: notificationsQuery.error,
    preferences: preferencesQuery.data,
    preferencesLoading: preferencesQuery.isFetching,
    connectionState,
    updatePreferences
  };
}
