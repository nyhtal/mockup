import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { vnuPath, vnuCommand } from "../setup-vnu.js";

test("vnuPath points at a working checker once installed", () => {
  const p = vnuPath();
  if (!p) return assert.ok(true, "vnu not installed; run npm run setup");
  assert.match(p, /vnu(\.bat)?$/);
  const { command, args } = vnuCommand();
  const out = execFileSync(command, [...args, "--version"], { encoding: "utf8" });
  assert.match(out, /\d+\.\d+/);
});
