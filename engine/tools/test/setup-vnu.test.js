import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { vnuPath, vnuCommand, pinned, sha256File, installedVersion } from "../setup-vnu.js";

test("the pin in package.json names the expected version and the zip checksum", () => {
  const p = pinned();
  assert.match(p.version, /^\d+\.\d+\.\d+$/);
  assert.match(p.sha256, /^[0-9a-f]{64}$/);
});

test("sha256File hashes a file", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "sha-"));
  try {
    writeFileSync(path.join(dir, "f"), "abc");
    assert.equal(await sha256File(path.join(dir, "f")), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the installed checker matches the pinned version", { skip: !vnuPath() && "vnu not installed; run npm run setup" }, () => {
  const { command, args } = vnuCommand();
  const out = execFileSync(command, [...args, "--version"], { encoding: "utf8" });
  assert.match(out, /\d+\.\d+/);
  assert.equal(installedVersion(), pinned().version);
});
