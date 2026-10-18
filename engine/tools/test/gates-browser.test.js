import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { startServer } from "../serve.js";
import * as lighthouse from "../gates/lighthouse.js";
import * as a11y from "../gates/a11y.js";
import * as links from "../gates/links.js";

const distDir = "dist/reference";
const skip = !process.env.SMOKE ? "set SMOKE=1 to run browser gates" : !existsSync(distDir) && "build the reference site first";

const page = (body, head = "") =>
  `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>t</title><meta name="description" content="d">${head}</head><body>${body}</body></html>`;

let server, fixtures, fixtureServer;
before(async () => {
  if (skip) return;
  server = await startServer(distDir);
  fixtures = mkdtempSync(path.join(tmpdir(), "a11y-"));
  for (const d of ["moderate", "contrast-hex", "contrast-oklch", "noindex", "small-target", "wide"]) mkdirSync(path.join(fixtures, d));
  writeFileSync(path.join(fixtures, "wide", "index.html"), page('<main><h1>A</h1><div class="w">too wide</div></main>', "<style>.w{width:600px}</style>"));
  // heading-order and landmark-one-main are "moderate" impact in axe: they must be findings, not review items.
  writeFileSync(path.join(fixtures, "moderate", "index.html"), page("<h1>A</h1><h3>C</h3><p>no main landmark</p>"));
  writeFileSync(path.join(fixtures, "contrast-hex", "index.html"), page('<main><h1>A</h1><p class="x">low contrast</p></main>', "<style>.x{color:#999;background:#fff}</style>"));
  writeFileSync(path.join(fixtures, "contrast-oklch", "index.html"), page('<main><h1>A</h1><p class="x">low contrast</p></main>', "<style>.x{color:oklch(70% 0 0);background:oklch(100% 0 0)}</style>"));
  writeFileSync(path.join(fixtures, "small-target", "index.html"), page('<main><h1>A</h1><p><a href="/" class="t">a</a></p><p><a href="/" class="t">b</a></p></main>', "<style>.t{display:inline-block;width:10px;height:10px;font-size:4px}p{margin:0;line-height:10px}</style>"));
  writeFileSync(path.join(fixtures, "noindex", "index.html"), page("<main><h1>Thanks</h1></main>", '<meta name="robots" content="noindex">'));
  fixtureServer = await startServer(fixtures);
});
after(async () => {
  if (server) await server.close();
  if (fixtureServer) await fixtureServer.close();
  if (fixtures) rmSync(fixtures, { recursive: true, force: true });
});

const ctx = () => ({ distDir, baseUrl: server.url, site: { url: "https://example.com", allowedExternal: [] } });
const fctx = (only) => ({ distDir: fixtures, baseUrl: fixtureServer.url, only, site: { url: "https://example.com" } });

test("lighthouse gate records medians, Chrome version, throttling and run count per page and profile", { skip, timeout: 300000 }, async () => {
  const r = await lighthouse.run({ ...ctx(), runs: 1, profiles: ["mobile"], only: ["en/index.html"] });
  assert.equal(r.id, "lighthouse");
  assert.equal(r.report.length, 1);
  const { url, profile, scores, chrome, throttling, runs } = r.report[0];
  assert.match(url, /\/en\/$/);
  assert.equal(profile, "mobile");
  assert.equal(runs, 1);
  assert.match(chrome, /^\d+\./);
  assert.match(throttling, /simulate/);
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) assert.ok(scores[c] >= 0 && scores[c] <= 100, c);
  for (const f of r.findings) assert.match(f.check, /^lighthouse\/mobile\//);
});

test("lighthouse gate skips the SEO category on noindex pages and says so in the report", { skip, timeout: 300000 }, async () => {
  const r = await lighthouse.run({ ...fctx(["noindex/index.html"]), runs: 1, profiles: ["mobile"] });
  assert.equal(r.report[0].scores.seo, "n/a (noindex)");
  assert.ok(!r.findings.some((f) => f.check === "lighthouse/mobile/seo"), "no SEO finding on a noindex page");
});

test("a11y gate fails on moderate-impact axe violations (heading order, missing main landmark)", { skip, timeout: 120000 }, async () => {
  const r = await a11y.run(fctx(["moderate/index.html"]));
  assert.equal(r.ok, false);
  const checks = r.findings.map((f) => f.check);
  assert.ok(checks.includes("a11y/heading-order"), `heading-order in ${checks}`);
  assert.ok(checks.includes("a11y/landmark-one-main"), `landmark-one-main in ${checks}`);
});

test("a11y gate fails a page that scrolls horizontally at 320 px (reflow)", { skip, timeout: 120000 }, async () => {
  const r = await a11y.run(fctx(["wide/index.html"]));
  const reflow = r.findings.filter((f) => f.check === "a11y/reflow");
  assert.ok(reflow.length >= 1, "reflow finding present");
  assert.match(reflow[0].message, /at 320 px the document is 6\d\d px wide/);
  const clean = await a11y.run(fctx(["noindex/index.html"]));
  assert.deepEqual(clean.findings.filter((f) => f.check === "a11y/reflow"), []);
});

test("a11y gate runs the WCAG 2.2 target-size rule", { skip, timeout: 120000 }, async () => {
  const r = await a11y.run(fctx(["small-target/index.html"]));
  const all = [...r.findings, ...r.report.flatMap((p) => p.review)].map((f) => f.check);
  assert.ok(all.includes("a11y/target-size"), `target-size evaluated: ${all}`);
});

test("a11y gate fails on a low-contrast hex colour and classifies oklch by what axe can measure", { skip, timeout: 120000 }, async () => {
  const hex = await a11y.run(fctx(["contrast-hex/index.html"]));
  assert.ok(hex.findings.some((f) => f.check === "a11y/color-contrast"), "hex contrast is a finding");
  const ok = await a11y.run(fctx(["contrast-oklch/index.html"]));
  const asFinding = ok.findings.some((f) => f.check === "a11y/color-contrast");
  const asReview = ok.report[0].review.some((f) => f.check === "a11y/color-contrast");
  assert.ok(asFinding || asReview, "oklch contrast is either measured (finding) or flagged for review");
  console.log(`axe oklch contrast → ${asFinding ? "FINDING (axe can parse oklch)" : "REVIEW (axe cannot parse oklch)"}`);
});

test("a11y gate on the reference page has no violations", { skip, timeout: 120000 }, async () => {
  const r = await a11y.run({ ...ctx(), only: ["en/index.html"] });
  assert.equal(r.id, "a11y");
  assert.deepEqual(r.findings, []);
});

test("links gate crawls the site and reports broken and external links", { skip, timeout: 120000 }, async () => {
  const r = await links.run(ctx());
  assert.equal(r.id, "links");
  assert.ok(r.report.scanned >= 2, "scanned at least the page and its css");
  for (const f of r.findings) assert.match(f.check, /^links\/(broken|external)$/);
});
