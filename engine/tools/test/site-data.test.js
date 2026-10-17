import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadSite } from "../lib/site.js";

function withRepo(fn) {
  const root = mkdtempSync(path.join(tmpdir(), "site-"));
  const prev = process.cwd();
  try {
    mkdirSync(path.join(root, "engine", "i18n"), { recursive: true });
    writeFileSync(path.join(root, "engine", "i18n", "en.json"), JSON.stringify({ nav: { home: "Home", cta: "Engine CTA" }, ui: { close: "Close" } }));
    writeFileSync(path.join(root, "engine", "i18n", "de.json"), JSON.stringify({ nav: { home: "Start", cta: "Engine CTA" }, ui: { close: "Schließen" } }));
    process.chdir(root);
    fn(root);
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
  }
}

const siteJson = { name: "X", url: "https://example.com", defaultLocale: "en", locales: ["en", "de"] };

test("a site without data or i18n folders loads with empty data and the engine strings", () => {
  withRepo((root) => {
    mkdirSync(path.join(root, "sites", "bare"), { recursive: true });
    writeFileSync(path.join(root, "sites", "bare", "site.json"), JSON.stringify(siteJson));
    const { site, data, i18n } = loadSite("bare");
    assert.equal(site.name, "X");
    assert.deepEqual(data, { en: { entities: {}, pages: {} }, de: { entities: {}, pages: {} } });
    assert.equal(i18n.de.ui.close, "Schließen");
    assert.equal(i18n.en.nav.cta, "Engine CTA");
  });
});

test("site i18n overlays the engine strings per locale, and data folders load entities and pages", () => {
  withRepo((root) => {
    const dir = path.join(root, "sites", "full");
    mkdirSync(path.join(dir, "i18n"), { recursive: true });
    mkdirSync(path.join(dir, "data", "en"), { recursive: true });
    writeFileSync(path.join(dir, "site.json"), JSON.stringify(siteJson));
    writeFileSync(path.join(dir, "i18n", "en.json"), JSON.stringify({ nav: { cta: "Book a demo", services: "Services" } }));
    writeFileSync(path.join(dir, "data", "en", "entities.json"), JSON.stringify({ services: [{ slug: "a", title: "A" }] }));
    writeFileSync(path.join(dir, "data", "en", "pages.json"), JSON.stringify({ home: { title: "Home" } }));
    const { data, i18n } = loadSite("full");
    assert.equal(i18n.en.nav.cta, "Book a demo", "site key wins");
    assert.equal(i18n.en.nav.home, "Home", "engine key kept");
    assert.equal(i18n.en.nav.services, "Services", "site-only key added");
    assert.equal(i18n.en.ui.close, "Close", "untouched branch kept");
    assert.equal(i18n.de.nav.cta, "Engine CTA", "no de overlay: engine value");
    assert.deepEqual(data.en.entities.services, [{ slug: "a", title: "A" }]);
    assert.equal(data.en.pages.home.title, "Home");
    assert.deepEqual(data.de, { entities: {}, pages: {} });
  });
});
