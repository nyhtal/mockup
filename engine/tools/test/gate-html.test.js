import { test } from "node:test";
import assert from "node:assert/strict";
import { run } from "../gates/html.js";
import { vnuPath } from "../setup-vnu.js";

const fixtures = "engine/tools/test/fixtures";
const skip = !vnuPath() && "vnu not installed; run npm run setup";

test("html gate passes a valid page", { skip }, async () => {
  const r = await run({ distDir: fixtures, only: ["valid.html"] });
  assert.equal(r.id, "html");
  assert.deepEqual(r.findings, []);
  assert.equal(r.ok, true);
});

test("html gate fails on a Nu warning, not only errors", { skip }, async () => {
  const r = await run({ distDir: fixtures, only: ["section-no-heading.html"] });
  assert.equal(r.ok, false);
  assert.equal(r.findings.length, 1);
  assert.match(r.findings[0].message, /heading/i);
  assert.equal(r.findings[0].check, "html/info");
  assert.match(r.findings[0].file, /section-no-heading\.html$/);
});
