export type ChangeLog = {
  newFeatures: string[];
  improvements: string[];
  bugFixes: string[];
  securityUpdates: string[];
  databaseChanges: string[];
  apiChanges: string[];
  uiChanges: string[];
  performanceImprovements: string[];
  knownIssues: string[];
};

export type SoftwareVersion = {
  version: string;
  build: string;
  releaseDate: string;
  releaseTime: string;
  developer: string;
  buildEnvironment: string;
  databaseVersion: string;
  apiVersion: string;
  frontendVersion: string;
  backendVersion: string;
  postgreSqlVersion: string;
  plcDriverVersion: string;
  description: string;
  status: "Current" | "Available" | "Superseded" | string;
  license: string;
  copyright: string;
  changeLog: ChangeLog;
};

export type VersionAudit = {
  date: string;
  time: string;
  user: string;
  oldVersion: string;
  newVersion: string;
  action: string;
  notes: string;
  status: string;
  backupFile?: string;
};

export const changeLogSections: Array<{ key: keyof ChangeLog; label: string; tone: string }> = [
  { key: "newFeatures", label: "New Features", tone: "cyan" },
  { key: "improvements", label: "Improvements", tone: "blue" },
  { key: "bugFixes", label: "Bug Fixes", tone: "amber" },
  { key: "securityUpdates", label: "Security Updates", tone: "green" },
  { key: "databaseChanges", label: "Database Changes", tone: "violet" },
  { key: "apiChanges", label: "API Changes", tone: "blue" },
  { key: "uiChanges", label: "UI Changes", tone: "cyan" },
  { key: "performanceImprovements", label: "Performance Improvements", tone: "green" },
  { key: "knownIssues", label: "Known Issues", tone: "red" }
];

export function formatReleaseDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}
