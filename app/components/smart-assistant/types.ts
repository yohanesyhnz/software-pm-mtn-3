export type NotificationSeverity = "CRITICAL" | "WARNING" | "HEALTHY";

export type SmartNotification = {
  id: string;
  machineName: string;
  partName: string;
  remainingHours: number;
  remainingPercentage: number;
  status: Exclude<NotificationSeverity, "HEALTHY">;
  nextReplacementDate?: string | null;
  lastReplacementDate?: string | null;
};

export type SmartNotificationSnapshot = {
  notifications: SmartNotification[];
  total: number;
  criticalCount: number;
  warningCount: number;
  highestSeverity: NotificationSeverity;
  source: "postgresql" | "state-store-fallback" | string;
  updatedAt: string;
};

export type SmartAssistantPreferences = {
  enableSmartAssistant: boolean;
  enableRobotAnimation: boolean;
  enableAutoPopup: boolean;
};

export type SmartAssistantConnectionState = "connecting" | "live" | "reconnecting" | "offline";

export const DEFAULT_SMART_ASSISTANT_PREFERENCES: SmartAssistantPreferences = {
  enableSmartAssistant: true,
  enableRobotAnimation: true,
  enableAutoPopup: true
};

export const EMPTY_NOTIFICATION_SNAPSHOT: SmartNotificationSnapshot = {
  notifications: [],
  total: 0,
  criticalCount: 0,
  warningCount: 0,
  highestSeverity: "HEALTHY",
  source: "state-store-fallback",
  updatedAt: new Date(0).toISOString()
};
