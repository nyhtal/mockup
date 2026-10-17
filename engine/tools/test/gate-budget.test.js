import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run, localAssets } from "../gates/budget.js";
import { parse } from "../lib/html.js";

const page = (head, body = "<h1>A</h1>") =>
  `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>t</title>${head}</head><body>${body}</body></html>`;

let dir;
before(() => {
  dir = mkdtempSync(path.join(tmpdir(), "budget-"));
  mkdirSync(path.join(dir, "assets", "images"), { recursive: true });
  writeFileSync(path.join(dir, "assets", "app.css"), "a{}".repeat(100));
  writeFileSync(path.join(dir, "assets", "enhance.js"), "x");
  writeFileSync(path.join(dir, "assets", "images", "hero-800.avif"), Buffer.alloc(1000));
  writeFileSync(path.join(dir, "assets", "images", "hero-1600.avif"), Buffer.alloc(2000));
  writeFileSync(
    path.join(dir, "ok.html"),
    page(
      '<link rel="stylesheet" href="/assets/app.css"><script type="module" src="/assets/enhance.js"></script>',
      '<h1>A</h1><picture><source srcset="/assets/images/hero-800.avif 800w, /assets/images/hero-1600.avif 1600w" type="image/avif"><img src="/assets/images/hero-800.avif" alt="" width="800" height="450"></picture><a href="/en/about/">About</a><a href="https://example.com/x.css">ext</a>'
    )
  );
  writeFileSync(path.join(dir, "missing.html"), page('<link rel="stylesheet" href="/assets/nope.css">'));
});
after(() => rmSync(dir, { recursive: true, force: true }));

const budgets = { html: 51200, css: 30720, js: 2048, page: 307200 };
const ctx = (file, b = budgets) => ({ distDir: dir, only: [file], budgets: b });

test("localAssets lists each local asset once, including srcset candidates, ignoring pages and external URLs", () => {
  const { root } = parse(path.join(dir, "ok.html"));
  assert.deepEqual(localAssets(root).sort(), [
    "/assets/app.css",
    "/assets/enhance.js",
    "/assets/images/hero-1600.avif",
    "/assets/images/hero-800.avif",
  ]);
});

test("a page within budget passes and reports its weight", async () => {
  const r = await run(ctx("ok.html"));
  assert.equal(r.id, "budget");
  assert.deepEqual(r.findings, []);
  assert.equal(r.report[0].total, r.report[0].html + 300 + 1 + 1000 + 2000);
});

test("a referenced asset that does not exist is a finding, not zero bytes", async () => {
  const r = await run(ctx("missing.html"));
  assert.deepEqual(r.findings.map((f) => f.check), ["budget/missing-asset"]);
});

test("each budget is enforced by its own check", async () => {
  const r = await run(ctx("ok.html", { html: 10, css: 10, js: 0, page: 10 }));
  assert.deepEqual(r.findings.map((f) => f.check).sort(), ["budget/css", "budget/html", "budget/js", "budget/page"]);
});
