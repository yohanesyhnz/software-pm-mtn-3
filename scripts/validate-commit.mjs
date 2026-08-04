import { spawnSync } from "node:child_process";
import { isConventionalCommit } from "./lib/release-core.mjs";

const supplied = process.argv.slice(2).join(" ").trim();
const commit = supplied || spawnSync("git", ["log", "-1", "--pretty=%B"], { encoding: "utf8" }).stdout.trim();

if (!isConventionalCommit(commit)) {
  console.error(`Commit tidak mengikuti Conventional Commits:\n  ${commit.split(/\r?\n/)[0]}\n\nContoh: feat(versioning): add automatic release flow`);
  process.exitCode = 1;
} else {
  console.log(`Conventional Commit valid: ${commit.split(/\r?\n/)[0]}`);
}
