import test from "node:test";
import assert from "node:assert/strict";
import {
  bumpVersion, conventionalCommit, determineBump, formatSemver, isConventionalCommit, parseSemver, updateReadmeVersion
} from "../lib/release-core.mjs";

test("parse dan format Semantic Version", () => {
  assert.deepEqual(parseSemver("v2.1.5"), { major: 2, minor: 1, patch: 5 });
  assert.equal(formatSemver(parseSemver("V2.1.5")), "2.1.5");
  assert.throws(() => parseSemver("2.1"));
});

test("bump mereset bagian versi yang lebih rendah", () => {
  assert.equal(formatSemver(bumpVersion("1.9.4", "major")), "2.0.0");
  assert.equal(formatSemver(bumpVersion("1.0.3", "minor")), "1.1.0");
  assert.equal(formatSemver(bumpVersion("1.0.0", "patch")), "1.0.1");
});

test("aturan perubahan menentukan bump", () => {
  assert.equal(determineBump({ type: "fix" }), "patch");
  assert.equal(determineBump({ type: "feat" }), "minor");
  assert.equal(determineBump({ type: "feat", databaseChange: true }), "major");
  assert.equal(determineBump({ type: "fix", breaking: true }), "major");
});

test("Conventional Commit dibentuk dan divalidasi", () => {
  const commit = conventionalCommit({ type: "feat", scope: "versioning", message: "add automatic release flow" });
  assert.equal(commit, "feat(versioning): add automatic release flow");
  assert.equal(isConventionalCommit(commit), true);
  assert.equal(isConventionalCommit("updated files"), false);
});

test("README version marker dapat diperbarui berulang", () => {
  const first = updateReadmeVersion("# App\n", "1.0.0");
  const second = updateReadmeVersion(first, "1.1.0");
  assert.match(second, /Current Version:\*\* `v1\.1\.0`/);
  assert.equal((second.match(/SOFTWARE_VERSION:START/g) ?? []).length, 1);
});
