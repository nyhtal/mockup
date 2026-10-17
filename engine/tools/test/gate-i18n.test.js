import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run, flattenKeys } from "../gates/i18n.js";

const ORIGIN = "https://example.com";
const alt = (pairs) => pairs.map(([l, p]) => `<link rel="alternate" hreflang="${l}" href="${ORIGIN}${p}">`).join("");
const page = (lang, head) =>
  `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><title>t</title>${head}</head><body><h1>A</h1></body></html>`;

let dir, i18nDir;
before(() => {
  dir = mkdtempSync(path.join(tmpdir(), "i18n-"));
  i18nDir = path.join(dir, "i18n");
  for (const d of ["i18n", "en", "de", "en/about", "de/about", "en/contact", "de/contact", "en/lonely"]) mkdirSync(path.join(dir, d), { recursive: true });
  writeFileSync(path.join(i18nDir, "en.json"), JSON.stringify({ nav: { skip: "Skip", home: "Home" }, footer: { rights: "x" } }));
  writeFileSync(path.join(i18nDir, "de.json"), JSON.stringify({ nav: { skip: "Überspringen" }, footer: { rights: "x", extra: "y" } }));

  const full = (p) => alt([["en", `/en${p}`], ["de", `/de${p}`], ["x-default", `/en${p}`]]);
  writeFileSync(path.join(dir, "en/index.html"), page("en", full("/")));
  writeFileSync(path.join(dir, "de/index.html"), page("de", full("/")));
  // about: de page does not link back to en
  writeFileSync(path.join(dir, "en/about/index.html"), page("en", full("/about/")));
  writeFileSync(path.join(dir, "de/about/index.html"), page("de", alt([["de", "/de/about/"], ["x-default", "/en/about/"]])));
  // contact: no x-default, and de page has wrong lang attribute
  writeFileSync(path.join(dir, "en/contact/index.html"), page("en", alt([["en", "/en/contact/"], ["de", "/de/contact/"]])));
  writeFileSync(path.join(dir, "de/contact/index.html"), page("en", alt([["en", "/en/contact/"], ["de", "/de/contact/"], ["x-default", "/en/contact/"]])));
  // lonely: alternate points at a page that does not exist
  writeFileSync(path.join(dir, "en/lonely/index.html"), page("en", alt([["en", "/en/lonely/"], ["de", "/de/lonely/"], ["x-default", "/en/lonely/"]])));
});
after(() => rmSync(dir, { recursive: true, force: true }));

const site = { locales: ["en", "de"], defaultLocale: "en", url: ORIGIN };
const ctx = (only) => ({ distDir: dir, only, i18nDir, site });
const checks = (r) => r.findings.map((f) => f.check).sort();

test("flattenKeys produces dotted paths", () => {
  assert.deepEqual(flattenKeys({ a: { b: 1, c: { d: 2 } }, e: 3 }), ["a.b", "a.c.d", "e"]);
});

test("missing and extra keys between locales are reported both ways", async () => {
  const r = await run(ctx(["en/index.html", "de/index.html"]));
  const keyFindings = r.findings.filter((f) => f.check === "i18n/keys").map((f) => f.message);
  assert.equal(keyFindings.length, 2);
  assert.ok(keyFindings.some((m) => m.includes("nav.home") && m.includes("de")));
  assert.ok(keyFindings.some((m) => m.includes("footer.extra") && m.includes("en")));
});

test("reciprocal pages with x-default pass the link checks", async () => {
  const r = await run(ctx(["en/index.html", "de/index.html"]));
  assert.deepEqual(r.findings.filter((f) => f.check !== "i18n/keys"), []);
});

test("a target that does not link back is reported", async () => {
  const r = await run(ctx(["en/about/index.html"]));
  assert.deepEqual(checks(r).filter((c) => c !== "i18n/keys"), ["i18n/hreflang-reciprocal"]);
});

test("missing x-default and wrong lang attribute are reported", async () => {
  const r = await run(ctx(["en/contact/index.html", "de/contact/index.html"]));
  assert.deepEqual(checks(r).filter((c) => c !== "i18n/keys"), ["i18n/lang-attr", "i18n/x-default"]);
});

test("an alternate pointing at a missing page is reported", async () => {
  const r = await run(ctx(["en/lonely/index.html"]));
  assert.deepEqual(checks(r).filter((c) => c !== "i18n/keys"), ["i18n/hreflang-target"]);
});
