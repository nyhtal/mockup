import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { symbol, usedIcons, injectSprites, ICONS } from "../build-icons.js";

test("every allow-listed icon exists in lucide-static", () => {
  for (const name of ICONS) assert.ok(existsSync(path.join("node_modules", "lucide-static", "icons", `${name}.svg`)), name);
});

test("symbol wraps the icon paths in a <symbol> with the shared stroke attributes and nothing else", () => {
  const s = symbol("arrow-right");
  assert.match(s, /^<symbol id="i-arrow-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">/);
  assert.match(s, /<path d="M5 12h14"\s*\/>/);
  assert.match(s, /<path d="m12 5 7 7-7 7"\s*\/>/);
  assert.doesNotMatch(s, /class=|width=|height=|<!--/);
  assert.match(s, /<\/symbol>$/);
});

test("symbol refuses names outside the allow-list", () => {
  assert.throws(() => symbol("nope"), /Unknown icon "nope"/);
});

test("usedIcons lists each referenced icon once", () => {
  assert.deepEqual(usedIcons('<use href="#i-check"></use><use href="#i-x"></use><use href="#i-check"></use>'), ["check", "x"]);
});

let dir;
const page = (body) => `<!DOCTYPE html><html lang="en"><head><title>t</title></head><body>${body}<!--sprite--><script type="module" src="/assets/enhance.js"></script></body></html>`;
before(() => {
  dir = mkdtempSync(path.join(tmpdir(), "icons-"));
  mkdirSync(path.join(dir, "a"));
  mkdirSync(path.join(dir, "b"));
  mkdirSync(path.join(dir, "c"));
  writeFileSync(path.join(dir, "a", "index.html"), page('<svg aria-hidden="true"><use href="#i-check"></use></svg><svg aria-hidden="true"><use href="#i-menu"></use></svg>'));
  writeFileSync(path.join(dir, "b", "index.html"), page("<p>no icons</p>"));
  writeFileSync(path.join(dir, "c", "index.html"), page('<svg aria-hidden="true"><use href="#i-nope"></use></svg>'));
});
after(() => rmSync(dir, { recursive: true, force: true }));

test("injectSprites gives each page only its own symbols, removes the placeholder elsewhere, and is deterministic", () => {
  const r = injectSprites(dir, { only: ["a/index.html", "b/index.html"] });
  assert.equal(r.pages, 2);
  const a = readFileSync(path.join(dir, "a", "index.html"), "utf8");
  assert.match(a, /<svg class="hidden" aria-hidden="true"><symbol id="i-check"[\s\S]*<symbol id="i-menu"[\s\S]*<\/svg><script type="module"/);
  assert.doesNotMatch(a, /i-arrow-right|<!--sprite-->/);
  const b = readFileSync(path.join(dir, "b", "index.html"), "utf8");
  assert.doesNotMatch(b, /<!--sprite-->|<symbol/);
  const again = injectSprites(dir, { only: ["a/index.html", "b/index.html"] });
  assert.equal(readFileSync(path.join(dir, "a", "index.html"), "utf8"), a, "second run leaves the file identical");
  assert.equal(again.pages, 2);
});

test("an unknown icon on a page fails the build naming the page and the icon", () => {
  assert.throws(() => injectSprites(dir, { only: ["c/index.html"] }), /c[\\/]index\.html.*"nope"|"nope".*c[\\/]index\.html/);
});
