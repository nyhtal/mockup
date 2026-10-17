import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { lighthousePages } from "../lib/sampling.js";

const page = (type) => `<!DOCTYPE html><html lang="x"><head><title>t</title></head><body data-page="${type}"><h1>A</h1></body></html>`;

function fixture() {
  const dir = mkdtempSync(path.join(tmpdir(), "sampling-"));
  const files = { "en/index.html": "home", "en/about/index.html": "about", "en/blog/index.html": "blog", "en/blog/one/index.html": "post", "en/blog/two/index.html": "post",
    "de/index.html": "home", "de/about/index.html": "about", "de/blog/index.html": "blog", "de/blog/one/index.html": "post", "de/blog/two/index.html": "post",
    "ar/index.html": "home", "ar/about/index.html": "about", "ar/blog/index.html": "blog", "ar/blog/one/index.html": "post", "ar/legal/imprint/index.html": "legal",
    "404.html": "error", "index.html": "redirect" };
  for (const [rel, type] of Object.entries(files)) { mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); writeFileSync(path.join(dir, rel), page(type)); }
  return dir;
}

const site = { defaultLocale: "en", locales: ["en", "de", "ar"] };
const toPages = (dir, rels) => rels.map((rel) => ({ file: path.join(dir, rel), url: "http://x/" + rel.replace(/index\.html$/, "") }));

test("the default locale is measured in full and every other locale once per page type", () => {
  const dir = fixture();
  try {
    const all = toPages(dir, ["en/index.html", "en/about/index.html", "en/blog/index.html", "en/blog/one/index.html", "en/blog/two/index.html", "de/index.html", "de/about/index.html", "de/blog/index.html", "de/blog/one/index.html", "de/blog/two/index.html", "ar/index.html", "ar/about/index.html", "ar/blog/index.html", "ar/blog/one/index.html", "ar/legal/imprint/index.html", "404.html", "index.html"]);
    const { sampled, coverage } = lighthousePages(all, site);
    const urls = sampled.map((p) => p.url.replace("http://x/", "/"));
    assert.deepEqual(urls.filter((u) => u.startsWith("/en/")), ["/en/", "/en/about/", "/en/blog/", "/en/blog/one/", "/en/blog/two/"]);
    assert.deepEqual(urls.filter((u) => u.startsWith("/de/")), ["/de/", "/de/about/", "/de/blog/", "/de/blog/one/"]);
    // A type that exists only in ar is still measured there.
    assert.ok(urls.includes("/ar/legal/imprint/"));
    // Root pages (no locale folder) are measured as they are.
    assert.ok(urls.includes("/404.html") && urls.includes("/"));
    for (const p of sampled) assert.ok(p.pageType && p.locale !== undefined, "pageType and locale set");
    const cov = coverage.map((c) => `${c.locale}:${c.pageType}`);
    for (const pair of ["en:home", "en:post", "de:post", "ar:legal", "ar:post", "de:about"]) assert.ok(cov.includes(pair), pair);
    assert.equal(coverage.find((c) => c.locale === "de" && c.pageType === "post").url, "http://x/de/blog/one/");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("a single-locale site is measured in full", () => {
  const dir = fixture();
  try {
    const all = toPages(dir, ["en/index.html", "en/blog/one/index.html", "en/blog/two/index.html"]);
    const { sampled } = lighthousePages(all, { defaultLocale: "en", locales: ["en"] });
    assert.equal(sampled.length, 3);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
