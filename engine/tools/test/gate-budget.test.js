import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run, pageAssets, fontsForPage } from "../gates/budget.js";
import { parse } from "../lib/html.js";

const page = (head, body = "<h1>A</h1>") =>
  `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>t</title>${head}</head><body>${body}</body></html>`;

const CSS =
  "@font-face{font-family:Inter;src:url(/assets/fonts/inter-latin.woff2) format(\"woff2\");unicode-range:U+0000-00FF,U+0131}" +
  "@font-face{font-family:Noto;src:url(/assets/fonts/noto-arabic.woff2) format(\"woff2\");unicode-range:U+0600-06FF}" +
  "@font-face{font-family:Any;src:url(/assets/fonts/any.woff2) format(\"woff2\")}" +
  "a{}".repeat(50);

let dir;
before(() => {
  dir = mkdtempSync(path.join(tmpdir(), "budget-"));
  mkdirSync(path.join(dir, "assets", "images"), { recursive: true });
  mkdirSync(path.join(dir, "assets", "fonts"), { recursive: true });
  writeFileSync(path.join(dir, "assets", "app.css"), CSS);
  writeFileSync(path.join(dir, "assets", "enhance.js"), "x");
  writeFileSync(path.join(dir, "assets", "fonts", "inter-latin.woff2"), Buffer.alloc(100));
  writeFileSync(path.join(dir, "assets", "fonts", "noto-arabic.woff2"), Buffer.alloc(70));
  writeFileSync(path.join(dir, "assets", "fonts", "any.woff2"), Buffer.alloc(10));
  for (const [n, size] of [["hero-480.avif", 480], ["hero-768.avif", 768], ["hero-1200.avif", 1200], ["hero-1600.avif", 1600], ["hero-480.webp", 9000], ["hero-1600.webp", 9000], ["logo.svg", 5]]) {
    writeFileSync(path.join(dir, "assets", "images", n), Buffer.alloc(size));
  }
  writeFileSync(
    path.join(dir, "ok.html"),
    page(
      '<link rel="stylesheet" href="/assets/app.css"><script type="module" src="/assets/enhance.js"></script>',
      '<h1>Hello</h1><picture>' +
        '<source type="image/avif" srcset="/assets/images/hero-480.avif 480w, /assets/images/hero-768.avif 768w, /assets/images/hero-1200.avif 1200w, /assets/images/hero-1600.avif 1600w">' +
        '<source type="image/webp" srcset="/assets/images/hero-480.webp 480w, /assets/images/hero-1600.webp 1600w">' +
        '<img src="/assets/images/hero-480.webp" alt="" width="800" height="450"></picture>' +
        '<img src="/assets/images/logo.svg" alt="" width="10" height="10"><a href="/en/about/">About</a><a href="https://example.com/x.css">ext</a>'
    )
  );
  writeFileSync(path.join(dir, "missing.html"), page('<link rel="stylesheet" href="/assets/nope.css">'));
  writeFileSync(path.join(dir, "arabic.html"), page('<link rel="stylesheet" href="/assets/app.css">', "<h1>مرحبا</h1>"));
});
after(() => rmSync(dir, { recursive: true, force: true }));

const budgets = { html: 51200, css: 30720, js: 2048, page: 307200, mobileWidth: 720 };
const ctx = (file, b = budgets) => ({ distDir: dir, only: [file], budgets: b });

test("pageAssets picks one candidate per image: the smallest width that covers a mobile screen, from the first source", () => {
  const { root } = parse(path.join(dir, "ok.html"));
  assert.deepEqual(pageAssets(root, 720).sort(), [
    "/assets/app.css",
    "/assets/enhance.js",
    "/assets/images/hero-768.avif",
    "/assets/images/logo.svg",
  ]);
});

test("fontsForPage counts only fonts whose unicode-range matches text on the page (or that have no range)", () => {
  const { root } = parse(path.join(dir, "ok.html"));
  assert.deepEqual(fontsForPage(CSS, root).sort(), ["/assets/fonts/any.woff2", "/assets/fonts/inter-latin.woff2"]);
  const ar = parse(path.join(dir, "arabic.html")).root;
  assert.deepEqual(fontsForPage(CSS, ar).sort(), ["/assets/fonts/any.woff2", "/assets/fonts/noto-arabic.woff2"]);
});

test("a page within budget passes and reports its weight including fonts", async () => {
  const r = await run(ctx("ok.html"));
  assert.equal(r.id, "budget");
  assert.deepEqual(r.findings, []);
  const css = CSS.length;
  assert.equal(r.report[0].total, r.report[0].html + css + 1 + 768 + 5 + 100 + 10);
});

test("a referenced asset that does not exist is a finding, not zero bytes", async () => {
  const r = await run(ctx("missing.html"));
  assert.deepEqual(r.findings.map((f) => f.check), ["budget/missing-asset"]);
});

test("each budget is enforced by its own check", async () => {
  const r = await run(ctx("ok.html", { html: 10, css: 10, js: 0, page: 10, mobileWidth: 720 }));
  assert.deepEqual(r.findings.map((f) => f.check).sort(), ["budget/css", "budget/html", "budget/js", "budget/page"]);
});
