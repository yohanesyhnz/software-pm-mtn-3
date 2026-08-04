import { existsSync, readFileSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { isConventionalCommit, parseSemver } from "./lib/release-core.mjs";

const root = join(fileURLToPath(new URL("..", import.meta.url)));

function git(args, allowFailure = false) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (!allowFailure && result.status !== 0) throw new Error(result.stderr.trim() || `git ${args.join(" ")} gagal.`);
  return { status: result.status ?? 1, stdout: result.stdout?.trim() ?? "", stderr: result.stderr?.trim() ?? "" };
}

function candidateFiles() {
  const names = new Set();
  for (const args of [["diff", "--name-only"], ["diff", "--cached", "--name-only"]]) {
    for (const name of git(args, true).stdout.split(/\r?\n/).filter(Boolean)) names.add(name);
  }
  for (const line of git(["status", "--porcelain"], true).stdout.split(/\r?\n/).filter(Boolean)) {
    const raw = line.slice(3).split(" -> ").at(-1);
    if (raw) names.add(raw.replace(/^"|"$/g, ""));
  }
  return [...names].filter((name) => !name.startsWith("node_modules/") && !name.startsWith(".next/") && !name.startsWith("data/"));
}

function scanRepository(files) {
  const issues = [];
  const textExtensions = new Set([".cs", ".conf", ".css", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".php", ".ps1", ".sql", ".ts", ".tsx", ".txt", ".yaml", ".yml"]);
  const sensitiveNames = /(^|\/)(\.env(?!\.example$)|credentials?[^/]*|secrets?[^/]*|id_rsa|.*\.(pem|key|p12|pfx))$/i;
  const secretPatterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /(?:password|passwd|pwd|token|api[_-]?key|client[_-]?secret)\s*[:=]\s*["'][^"'${}\s][^"']{7,}["']/i
  ];

  for (const name of files) {
    const normalized = name.replaceAll("\\", "/");
    if (sensitiveNames.test(normalized) && !normalized.endsWith(".env.example")) {
      issues.push(`File sensitif terdeteksi: ${normalized}`);
      continue;
    }
    const path = join(root, name);
    if (!existsSync(path) || !textExtensions.has(extname(path).toLowerCase())) continue;
    const content = readFileSync(path, "utf8");
    if (/^(<<<<<<<|=======|>>>>>>>)(?: |$)/m.test(content)) issues.push(`Merge conflict marker: ${normalized}`);
    if (!normalized.endsWith(".example") && secretPatterns.some((pattern) => pattern.test(content))) issues.push(`Kemungkinan secret pada: ${normalized}`);
  }
  return issues;
}

function validateVersionFiles(expectedTag, requireTagAtHead) {
  const issues = [];
  if (!existsSync(join(root, "VERSION"))) return ["File VERSION belum tersedia."];
  const version = readFileSync(join(root, "VERSION"), "utf8").trim().replace(/^[vV]/, "");
  try { parseSemver(version); } catch (error) { issues.push(error.message); }
  const packageVersion = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
  if (packageVersion !== version) issues.push(`package.json (${packageVersion}) tidak sama dengan VERSION (${version}).`);
  const versionMetadata = existsSync(join(root, "version.json")) ? JSON.parse(readFileSync(join(root, "version.json"), "utf8")) : null;
  if (!versionMetadata || versionMetadata.version !== `v${version}`) issues.push(`version.json belum konsisten dengan v${version}.`);
  const changelog = existsSync(join(root, "CHANGELOG.md")) ? readFileSync(join(root, "CHANGELOG.md"), "utf8") : "";
  if (!changelog.includes(`## [${version}]`)) issues.push(`CHANGELOG.md belum memiliki entry ${version}.`);
  const releasePath = join(root, "releases", `v${version}.md`);
  if (!existsSync(releasePath)) issues.push(`Release Notes releases/v${version}.md belum tersedia.`);
  const readme = readFileSync(join(root, "README.md"), "utf8");
  if (!readme.includes(`Current Version:** \`v${version}\``)) issues.push(`README.md belum menampilkan v${version}.`);
  if (expectedTag && expectedTag !== `v${version}`) issues.push(`Git tag ${expectedTag} tidak sama dengan VERSION v${version}.`);
  if (requireTagAtHead || expectedTag) {
    const requiredTag = expectedTag || `v${version}`;
    const tagsAtHead = git(["tag", "--points-at", "HEAD"], true).stdout.split(/\r?\n/).filter(Boolean);
    if (!tagsAtHead.includes(requiredTag)) issues.push(`HEAD belum memiliki tag ${requiredTag}. Gunakan release:sync, bukan git push langsung.`);
    else if (git(["cat-file", "-t", requiredTag], true).stdout !== "tag") issues.push(`${requiredTag} harus berupa annotated Git tag.`);
  }
  return issues;
}

function run(command, args, label) {
  console.log(`\n[validate] ${label}`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env: process.env });
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${label} gagal dengan exit code ${result.status}.`);
}

export async function runValidation({ skipBuild = false, skipTests = false, expectedTag = "", requireMigration = false, requireTagAtHead = false } = {}) {
  const issues = [];
  const files = candidateFiles();
  issues.push(...scanRepository(files));
  issues.push(...validateVersionFiles(expectedTag, requireTagAtHead));

  const unmerged = git(["ls-files", "-u"], true).stdout;
  if (unmerged) issues.push("Repository masih memiliki konflik merge yang belum diselesaikan.");
  const diffCheck = git(["diff", "--check"], true);
  if (diffCheck.status !== 0 || diffCheck.stdout) issues.push(`git diff --check gagal: ${diffCheck.stdout || diffCheck.stderr}`);

  if (requireMigration) {
    const version = readFileSync(join(root, "VERSION"), "utf8").trim().replace(/^[vV]/, "");
    if (!existsSync(join(root, "docs", "migrations", `v${version}.md`))) issues.push(`Migration Guide docs/migrations/v${version}.md wajib untuk perubahan database.`);
  }

  if (issues.length) throw new Error(`Validasi dihentikan:\n- ${issues.join("\n- ")}`);

  if (!skipTests) run(process.execPath, ["--test", "scripts/tests/*.test.mjs"], "Unit test versioning");
  if (!skipBuild) {
    run(process.execPath, ["node_modules/typescript/bin/tsc", "--noEmit"], "TypeScript check");
    run(process.execPath, ["node_modules/next/dist/bin/next", "build"], "Next.js production build");
    const dotnet = process.env.DOTNET_EXE || "dotnet";
    run(dotnet, ["build", "backend/PredictaCore.Api.csproj", "-c", "Release", "--nologo"], ".NET 10 build");
  }

  return { version: readFileSync(join(root, "VERSION"), "utf8").trim(), filesChecked: files.length, status: "Berhasil" };
}

function readArguments(argv) {
  const values = new Set(argv);
  const expectedIndex = argv.indexOf("--expected-tag");
  return {
    skipBuild: values.has("--skip-build"), skipTests: values.has("--skip-tests"), requireMigration: values.has("--require-migration"), requireTagAtHead: values.has("--require-tag-at-head"),
    expectedTag: expectedIndex >= 0 ? argv[expectedIndex + 1] : (process.env.RELEASE_TAG ?? "")
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const result = await runValidation(readArguments(process.argv.slice(2)));
    console.log(`\nVALIDASI BERHASIL — v${result.version}, ${result.filesChecked} file diperiksa.`);
  } catch (error) {
    console.error(`\nVALIDASI GAGAL\n${error.message}`);
    process.exitCode = 1;
  }
}
