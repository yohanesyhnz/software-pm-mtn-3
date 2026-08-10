export type MachineStatus = "RUNNING" | "STOPPED" | "IDLE" | "ALARM" | "MAINTENANCE" | "DATA OFFLINE";
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
  runningHours: number | null;
  health: number | null;
  healthStatus: "HEALTHY" | "GOOD" | "WARNING" | "CRITICAL" | "N/A";
  realtimeDashboardUrl: string | null;
  displayOrder: number;
  displayMode: MachineDisplayMode;
  isActive: boolean;
  cardConfiguration: MachineCardConfiguration;
  realtimeUpdatedAt: string | null;
  updatedAt: string;
};

export type MachineDashboardSnapshot = {
  machines: MachineDashboardItem[];
  total: number;
  source: string;
  updatedAt: string;
};
