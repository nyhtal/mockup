import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../gates/schema.js";

const ORG = { "@type": "Organization", "@id": "https://example.com/#organization", name: "Northwind", url: "https://example.com/" };
const SITE = { "@type": "WebSite", "@id": "https://example.com/#website", url: "https://example.com/", publisher: { "@id": "https://example.com/#organization" } };
const PAGE = { "@type": "WebPage", "@id": "https://example.com/en/", url: "https://example.com/en/", isPartOf: { "@id": "https://example.com/#website" } };

const page = (graph, pageType = "home", blocks = 1) => {
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  const script = `<script type="application/ld+json">${json}</script>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>t</title>${script.repeat(blocks)}</head><body data-page="${pageType}"><h1>A</h1></body></html>`;
};

const FIXTURES = {
  "ok.html": page([ORG, SITE, PAGE]),
  "dangling-ref.html": page([ORG, { ...SITE, publisher: { "@id": "https://example.com/#nope" } }, PAGE]),
  "relative-url.html": page([ORG, SITE, { ...PAGE, url: "/en/" }]),
  "missing-type.html": page([ORG, SITE]),
  "two-blocks.html": page([ORG, SITE, PAGE], "home", 2),
  "no-graph.html": `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>t</title><script type="application/ld+json">${JSON.stringify(ORG)}</script></head><body data-page="home"><h1>A</h1></body></html>`,
  "bad-json.html": `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>t</title><script type="application/ld+json">{nope</script></head><body data-page="home"><h1>A</h1></body></html>`,
};

let dir;
before(() => {
  dir = mkdtempSync(path.join(tmpdir(), "schema-"));
  for (const [name, html] of Object.entries(FIXTURES)) writeFileSync(path.join(dir, name), html);
});
after(() => rmSync(dir, { recursive: true, force: true }));

const contracts = { home: { required: ["Organization", "WebSite", "WebPage"] } };
const ctx = (file) => ({ distDir: dir, only: [file], contracts });

test("a complete graph passes", async () => {
  const r = await run(ctx("ok.html"));
  assert.equal(r.id, "schema");
  assert.deepEqual(r.findings, []);
});

for (const [file, check] of [
  ["dangling-ref.html", "schema/ref-resolves"],
  ["relative-url.html", "schema/absolute-url"],
  ["missing-type.html", "schema/contract"],
  ["two-blocks.html", "schema/single-block"],
  ["no-graph.html", "schema/graph"],
  ["bad-json.html", "schema/parse"],
]) {
  test(`${file} reports ${check}`, async () => {
    const r = await run(ctx(file));
    assert.equal(r.ok, false);
    assert.deepEqual(r.findings.map((f) => f.check), [check]);
  });
}
