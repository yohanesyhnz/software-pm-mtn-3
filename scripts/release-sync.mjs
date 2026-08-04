import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  bumpVersion, categorizeMessage, conventionalCommit, determineBump, formatSemver,
  renderChangelogEntry, renderReleaseNotes, updateReadmeVersion
} from "./lib/release-core.mjs";
import { runValidation } from "./validate-release.mjs";

const root = join(fileURLToPath(new URL("..", import.meta.url)));

function parseArguments(argv) {
  const options = {
    type: "", scope: "", message: "", summary: "", bump: "", dryRun: false, noPush: false, bootstrap: false,
    skipBuild: false, breaking: false, databaseChange: false, architectureChange: false, frameworkChange: false,
    apiBreaking: false, features: [], fixed: [], optimizations: [], improvements: [], breakingNotes: [], knownIssues: [], documentation: []
  };
  const valueOptions = new Map([
    ["--type", "type"], ["--scope", "scope"], ["--message", "message"], ["--summary", "summary"], ["--bump", "bump"],
    ["--feature", "features"], ["--fixed", "fixed"], ["--optimization", "optimizations"], ["--improvement", "improvements"],
    ["--breaking-note", "breakingNotes"], ["--known-issue", "knownIssues"], ["--documentation", "documentation"]
  ]);
  const flags = new Map([
    ["--dry-run", "dryRun"], ["--no-push", "noPush"], ["--bootstrap", "bootstrap"], ["--skip-build", "skipBuild"],
    ["--breaking", "breaking"], ["--database-change", "databaseChange"], ["--architecture-change", "architectureChange"],
    ["--framework-change", "frameworkChange"], ["--api-breaking", "apiBreaking"]
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (flags.has(arg)) { options[flags.get(arg)] = true; continue; }
    if (valueOptions.has(arg)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${arg} memerlukan nilai.`);
      const key = valueOptions.get(arg);
      if (Array.isArray(options[key])) options[key].push(value); else options[key] = value;
      index += 1;
      continue;
    }
    throw new Error(`Argumen tidak dikenal: ${arg}`);
  }
  if (!options.type || !options.message) throw new Error("--type dan --message wajib diisi.");
  return options;
}

function git(args, { allowFailure = false, inherit = false } = {}) {
  const result = spawnSync("git", args, { cwd: root, encoding: inherit ? undefined : "utf8", stdio: inherit ? "inherit" : "pipe" });
  if (!allowFailure && result.status !== 0) throw new Error((result.stderr ?? "").trim() || `git ${args.join(" ")} gagal.`);
  return { status: result.status ?? 1, stdout: (result.stdout ?? "").trim(), stderr: (result.stderr ?? "").trim() };
}

function writeTransactional(path, content, snapshots) {
  if (!snapshots.has(path)) snapshots.set(path, existsSync(path) ? readFileSync(path) : null);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function restoreSnapshots(snapshots) {
  for (const [path, content] of snapshots) {
    if (content === null) {
      try { if (existsSync(path)) unlinkSync(path); } catch { /* best effort */ }
    } else writeFileSync(path, content);
  }
}

function buildChanges(options) {
  const changes = categorizeMessage(options.type, options.message, options.breaking);
  changes.newFeatures.push(...options.features);
  changes.fixed.push(...options.fixed);
  changes.optimizations.push(...options.optimizations);
  changes.improvements.push(...options.improvements);
  changes.breakingChanges.push(...options.breakingNotes);
  changes.knownIssues.push(...options.knownIssues);
  changes.documentation.push(...options.documentation);
  return changes;
}

function prependChangelog(existing, entry) {
  const header = "# Changelog";
  const introduction = "Semua perubahan penting pada project ini didokumentasikan mengikuti Semantic Versioning dan Conventional Commits.";
  if (!existing.trim()) return `${header}\n\n${introduction}\n\n${entry}\n`;
  const firstEntry = existing.indexOf("\n## [");
  if (firstEntry >= 0) return `${existing.slice(0, firstEntry).trimEnd()}\n\n${entry}\n\n${existing.slice(firstEntry + 1).trimStart()}`;
  return `${existing.trimEnd()}\n\n${entry}\n`;
}

function buildNumber(date, hasHead) {
  const compactDate = date.replaceAll("-", "");
  const count = hasHead ? Number(git(["rev-list", "--count", "HEAD"]).stdout || 0) + 1 : 1;
  return `${compactDate}.${count}`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const versionPath = join(root, "VERSION");
  if (!existsSync(versionPath)) throw new Error("VERSION tidak ditemukan. Siapkan versi awal sebelum sinkronisasi.");
  const previousVersion = readFileSync(versionPath, "utf8").trim().replace(/^[vV]/, "");
  const hasHead = git(["rev-parse", "--verify", "HEAD"], { allowFailure: true }).status === 0;
  if (!hasHead && !options.bootstrap) throw new Error("Repository belum memiliki commit. Jalankan mode --bootstrap untuk rilis pertama.");
  if (hasHead && options.bootstrap) throw new Error("--bootstrap hanya digunakan ketika repository belum memiliki commit.");

  const level = options.bootstrap ? "bootstrap" : determineBump({
    type: options.type, breaking: options.breaking, databaseChange: options.databaseChange,
    architectureChange: options.architectureChange, frameworkChange: options.frameworkChange,
    apiBreaking: options.apiBreaking, explicit: options.bump
  });
  const currentVersion = options.bootstrap ? previousVersion : formatSemver(bumpVersion(previousVersion, level));
  const tag = `v${currentVersion}`;
  const commitMessage = conventionalCommit({ type: options.type, scope: options.scope, message: options.message, breaking: level === "major" });
  const branch = git(["branch", "--show-current"], { allowFailure: true }).stdout || "master";
  const remote = git(["remote", "get-url", "origin"], { allowFailure: true }).stdout;
  const summary = options.summary || options.message;
  const date = new Date().toISOString().slice(0, 10);
  const changes = buildChanges(options);

  if (options.dryRun) {
    const validation = await runValidation({ skipBuild: options.skipBuild });
    console.log(JSON.stringify({
      status: "DRY RUN BERHASIL", previousVersion, currentVersion, bump: level, tag, branch,
      remote: remote || "BELUM DIKONFIGURASI", conventionalCommit: commitMessage, filesChecked: validation.filesChecked, summary
    }, null, 2));
    return;
  }

  if (!options.noPush && !remote) throw new Error("Remote origin belum dikonfigurasi. Tambahkan remote GitHub atau gunakan --no-push.");
  if (git(["tag", "--list", tag], { allowFailure: true }).stdout) throw new Error(`Tag ${tag} sudah tersedia.`);

  const snapshots = new Map();
  try {
    if (!options.bootstrap) {
      writeTransactional(versionPath, `${currentVersion}\n`, snapshots);
      const packagePath = join(root, "package.json");
      const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
      packageJson.version = currentVersion;
      writeTransactional(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, snapshots);

      const changelogPath = join(root, "CHANGELOG.md");
      const changelog = existsSync(changelogPath) ? readFileSync(changelogPath, "utf8") : "";
      if (changelog.includes(`## [${currentVersion}]`)) throw new Error(`CHANGELOG ${currentVersion} sudah tersedia.`);
      writeTransactional(changelogPath, prependChangelog(changelog, renderChangelogEntry({ version: currentVersion, date, changes })), snapshots);

      const readmePath = join(root, "README.md");
      writeTransactional(readmePath, updateReadmeVersion(readFileSync(readmePath, "utf8"), currentVersion), snapshots);
      writeTransactional(join(root, "releases", `${tag}.md`), renderReleaseNotes({
        version: currentVersion, date, previousVersion, summary, changes, commitMessage
      }), snapshots);
      writeTransactional(join(root, "version.json"), `${JSON.stringify({
        version: tag, previousVersion: `v${previousVersion}`, build: buildNumber(date, hasHead), releaseDate: date,
        commitType: options.type, bump: level, summary, knownIssues: changes.knownIssues
      }, null, 2)}\n`, snapshots);

      if (options.databaseChange) {
        const migration = `# Migration Guide ${tag}\n\n## Ringkasan\n\n${summary}\n\n## Database Changes\n\n${changes.breakingChanges.length ? changes.breakingChanges.map((item) => `- ${item}`).join("\n") : "- Lengkapi langkah migrasi database sebelum release."}\n\n## Rollback\n\n1. Hentikan aplikasi.\n2. Pulihkan backup database dan konfigurasi dari versi v${previousVersion}.\n3. Deploy kembali tag v${previousVersion}.\n4. Verifikasi health check dan audit trail.\n`;
        writeTransactional(join(root, "docs", "migrations", `${tag}.md`), migration, snapshots);
      }
    }

    await runValidation({ skipBuild: options.skipBuild, requireMigration: options.databaseChange });
  } catch (error) {
    restoreSnapshots(snapshots);
    throw error;
  }

  const changedBeforeCommit = git(["status", "--porcelain"]).stdout.split(/\r?\n/).filter(Boolean).length;
  if (!changedBeforeCommit) throw new Error("Tidak ada perubahan untuk disinkronkan.");
  git(["add", "--all"]);
  git(["commit", "-m", commitMessage], { inherit: true });
  git(["tag", "-a", tag, "-m", `Release ${tag}`]);
  const commitHash = git(["rev-parse", "--short", "HEAD"]).stdout;
  const previousTag = git(["describe", "--tags", "--abbrev=0", "HEAD^"], { allowFailure: true }).stdout;
  const commitCount = previousTag ? Number(git(["rev-list", "--count", `${previousTag}..HEAD`]).stdout) : Number(git(["rev-list", "--count", "HEAD"]).stdout);

  let status = "LOCAL BERHASIL — BELUM PUSH";
  if (!options.noPush) {
    git(["push", "--atomic", "origin", `HEAD:${branch}`, tag], { inherit: true });
    status = "BERHASIL";
  }

  console.log(JSON.stringify({
    currentVersion: tag, previousVersion: options.bootstrap ? null : `v${previousVersion}`, commitHash, branch,
    changedFiles: changedBeforeCommit, commitCount, changelog: "CHANGELOG.md", gitTag: tag, synchronizationStatus: status, summary
  }, null, 2));
}

main().catch((error) => {
  console.error(`\nSINKRONISASI GAGAL\n${error.message}`);
  process.exitCode = 1;
});
