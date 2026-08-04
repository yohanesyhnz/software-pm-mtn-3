export const conventionalTypes = [
  "feat", "fix", "perf", "refactor", "docs", "style", "test", "build", "ci", "chore", "revert"
];

export function parseSemver(input) {
  const match = String(input).trim().match(/^[vV]?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  if (!match) throw new Error(`Versi "${input}" tidak menggunakan format Major.Minor.Patch.`);
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

export function formatSemver(version, prefix = "") {
  return `${prefix}${version.major}.${version.minor}.${version.patch}`;
}

export function bumpVersion(input, level) {
  const version = typeof input === "string" ? parseSemver(input) : input;
  if (level === "major") return { major: version.major + 1, minor: 0, patch: 0 };
  if (level === "minor") return { major: version.major, minor: version.minor + 1, patch: 0 };
  if (level === "patch") return { major: version.major, minor: version.minor, patch: version.patch + 1 };
  throw new Error(`Level versi tidak dikenal: ${level}`);
}

export function determineBump({ type, breaking = false, databaseChange = false, architectureChange = false, frameworkChange = false, apiBreaking = false, explicit }) {
  if (explicit) {
    if (!["major", "minor", "patch"].includes(explicit)) throw new Error("--bump harus major, minor, atau patch.");
    return explicit;
  }
  if (breaking || databaseChange || architectureChange || frameworkChange || apiBreaking) return "major";
  if (type === "feat") return "minor";
  return "patch";
}

export function conventionalCommit({ type, scope, message, breaking = false }) {
  if (!conventionalTypes.includes(type)) throw new Error(`Tipe commit tidak valid: ${type}`);
  const cleanMessage = String(message ?? "").trim();
  if (cleanMessage.length < 3) throw new Error("Pesan commit minimal tiga karakter.");
  const scopePart = scope ? `(${scope})` : "";
  return `${type}${scopePart}${breaking ? "!" : ""}: ${cleanMessage}`;
}

export function isConventionalCommit(message) {
  const firstLine = String(message).trim().split(/\r?\n/, 1)[0];
  if (/^(Merge |Revert ")/.test(firstLine)) return true;
  return /^(feat|fix|perf|refactor|docs|style|test|build|ci|chore|revert)(\([a-z0-9._/-]+\))?!?: .{3,}$/i.test(firstLine);
}

export function emptyChanges() {
  return {
    newFeatures: [], improvements: [], fixed: [], optimizations: [], breakingChanges: [], knownIssues: [], documentation: []
  };
}

export function categorizeMessage(type, message, breaking = false) {
  const changes = emptyChanges();
  if (breaking) changes.breakingChanges.push(message);
  if (type === "feat") changes.newFeatures.push(message);
  else if (type === "fix") changes.fixed.push(message);
  else if (type === "perf") changes.optimizations.push(message);
  else if (type === "docs") changes.documentation.push(message);
  else changes.improvements.push(message);
  return changes;
}

const sections = [
  ["newFeatures", "New Features"], ["improvements", "Improvements"], ["fixed", "Fixed"],
  ["optimizations", "Optimizations"], ["breakingChanges", "Breaking Changes"],
  ["knownIssues", "Known Issues"], ["documentation", "Documentation"]
];

function renderSections(changes, emptyText = "Tidak ada.") {
  return sections.map(([key, label]) => {
    const values = changes[key] ?? [];
    return `### ${label}\n\n${values.length ? values.map((value) => `- ${value}`).join("\n") : `- ${emptyText}`}`;
  }).join("\n\n");
}

export function renderChangelogEntry({ version, date, changes }) {
  return `## [${version}] - ${date}\n\n${renderSections(changes)}`;
}

export function renderReleaseNotes({ version, date, previousVersion, summary, changes, commitMessage }) {
  return `# Release ${version}\n\n` +
    `**Tanggal:** ${date}  \n**Versi sebelumnya:** ${previousVersion ? `v${previousVersion}` : "Initial release"}  \n**Commit:** \`${commitMessage}\`\n\n` +
    `## Ringkasan\n\n${summary}\n\n${renderSections(changes)}\n`;
}

export function updateReadmeVersion(readme, version) {
  const block = `<!-- SOFTWARE_VERSION:START -->\n**Current Version:** \`v${version}\`\n<!-- SOFTWARE_VERSION:END -->`;
  const pattern = /<!-- SOFTWARE_VERSION:START -->[\s\S]*?<!-- SOFTWARE_VERSION:END -->/;
  return pattern.test(readme) ? readme.replace(pattern, block) : `${readme.trimEnd()}\n\n${block}\n`;
}
