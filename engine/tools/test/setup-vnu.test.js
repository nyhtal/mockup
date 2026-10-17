import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { vnuPath } from "../setup-vnu.js";

test("vnuPath points at a working checker once installed", () => {
  const p = vnuPath();
  if (!p) return assert.ok(true, "vnu not installed; run npm run setup");
  assert.match(p, /vnu(\.bat)?$/);
  const out = execFileSync(p, ["--version"], { encoding: "utf8", shell: process.platform === "win32" });
  assert.match(out, /\d+\.\d+/);
});
