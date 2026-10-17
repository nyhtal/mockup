import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { startServer } from "../serve.js";
import * as lighthouse from "../gates/lighthouse.js";
import * as a11y from "../gates/a11y.js";
import * as links from "../gates/links.js";

const distDir = "dist/reference";
const skip = !process.env.SMOKE ? "set SMOKE=1 to run browser gates" : !existsSync(distDir) && "build the reference site first";

let server;
before(async () => { if (!skip) server = await startServer(distDir); });
after(async () => { if (server) await server.close(); });

const ctx = () => ({ distDir, baseUrl: server.url, site: { url: "https://example.com", allowedExternal: [] } });

test("lighthouse gate returns category medians per page and profile", { skip, timeout: 300000 }, async () => {
  const r = await lighthouse.run({ ...ctx(), runs: 1, profiles: ["mobile"], only: ["en/index.html"] });
  assert.equal(r.id, "lighthouse");
  assert.equal(r.report.length, 1);
  const { url, profile, scores } = r.report[0];
  assert.match(url, /\/en\/$/);
  assert.equal(profile, "mobile");
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) assert.ok(scores[c] >= 0 && scores[c] <= 100, c);
  for (const f of r.findings) assert.match(f.check, /^lighthouse\/mobile\//);
});

test("a11y gate runs axe on every page and reports issues as findings", { skip, timeout: 120000 }, async () => {
  const r = await a11y.run({ ...ctx(), only: ["en/index.html"] });
  assert.equal(r.id, "a11y");
  assert.equal(r.report.length, 1);
  for (const f of r.findings) { assert.match(f.check, /^a11y\//); assert.ok(f.message); }
});

test("links gate crawls the site and reports broken and external links", { skip, timeout: 120000 }, async () => {
  const r = await links.run(ctx());
  assert.equal(r.id, "links");
  assert.ok(r.report.scanned >= 2, "scanned at least the page and its css");
  for (const f of r.findings) assert.match(f.check, /^links\/(broken|external)$/);
});
