import { chmodSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], { cwd: root, stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);
if (process.platform !== "win32") chmodSync(join(root, ".githooks", "pre-push"), 0o755);
console.log("Git hooks aktif: setiap push akan menjalankan validasi release.");
