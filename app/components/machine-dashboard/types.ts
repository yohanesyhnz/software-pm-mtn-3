export type MachineStatus = "RUNNING" | "STOPPED" | "IDLE" | "ALARM" | "MAINTENANCE" | "DATA OFFLINE" | "DATA UNAVAILABLE" | "DATABASE OFFLINE";
export type MachineParameterType = "COUNTER" | "SPEED" | "WEIGHT";
export type MachineDisplayMode = "AUTO" | "COMPACT" | "STANDARD" | "LARGE";
export type MachineGrouping = "ALL" | "LINE" | "AREA" | "DEPARTMENT" | "MACHINE_TYPE";

export type MachineCardConfiguration = {
  showImage: boolean;
  showMachineName: boolean;
  showMachineCode: boolean;
  showLine: boolean;
  showArea: boolean;
  showStatus: boolean;
  showCounter: boolean;
  showSpeed: boolean;
  showRunningHours: boolean;
  showHealth: boolean;
  showRealtimeValue: boolean;
};

export type MachineDashboardItem = {
  legacyId: number | null;
  machineId: string;
  machineName: string;
  machineCode: string;
  line: string;
  area: string;
  department: string;
  machineType: string;
  machineImageUrl: string | null;
  status: MachineStatus;
  counter: number | null;
  speed: number | null;
  counterUnit: string;
  speedUnit: string;
  parameterName: string | null;
  parameterType: MachineParameterType | null;
  parameterUnit: string | null;
  parameterValue: number | null;
  secondaryParameterName: string | null;
  secondaryParameterLabel: string | null;
  secondaryParameterUnit: string | null;
  secondaryParameterValue: number | null;
  runningHours: number | null;
  health: number | null;
  healthStatus: "HEALTHY" | "GOOD" | "WARNING" | "CRITICAL" | "N/A";
  realtimeDashboardUrl: string | null;
  displayOrder: number;
  displayMode: MachineDisplayMode;
  isActive: boolean;
  cardConfiguration: MachineCardConfiguration;
  connectionStatus: "REALTIME CONNECTED" | "DATA UNAVAILABLE" | "DATABASE OFFLINE";
  sourceTimestamp: string | null;
  realtimeUpdatedAt: string | null;
  updatedAt: string;
};

export type MachineDashboardSnapshot = {
  machines: MachineDashboardItem[];
  total: number;
  source: string;
  connectionStatus: "CONNECTED" | "OFFLINE" | "UNAVAILABLE";
  updatedAt: string;
};
