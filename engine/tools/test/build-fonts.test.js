import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fontPlan, copyFonts } from "../build-fonts.js";

test("a Latin-only site ships latin and latin-ext subsets of the brand font and preloads latin", () => {
  const plan = fontPlan({ font: "inter" }, ["en", "de"]);
  assert.deepEqual(plan.faces.map((f) => f.subset).sort(), ["latin", "latin-ext"]);
  assert.equal(plan.preload, "/assets/fonts/inter-latin-wght-normal.woff2");
  assert.match(plan.css, /font-family: "Inter Variable";[\s\S]*unicode-range: U\+0000-00FF/);
  assert.match(plan.css, /font-family: "Inter Fallback";\s*src: local\("Arial"\);\s*size-adjust: 107\.12%/);
  assert.match(plan.css, /font-display: swap/);
  assert.match(plan.css, /src: url\(\/assets\/fonts\/inter-latin-wght-normal\.woff2\)/);
});

test("an Arabic locale adds the Arabic script font with its own unicode-range", () => {
  const plan = fontPlan({ font: "inter" }, ["en", "ar"]);
  const arabic = plan.faces.filter((f) => f.pkg === "noto-sans-arabic");
  assert.deepEqual(arabic.map((f) => f.subset), ["arabic"]);
  assert.match(plan.css, /font-family: "Noto Sans Arabic Variable";[\s\S]*unicode-range: U\+0600/);
  assert.equal(plan.faces.length, 3);
  assert.match(plan.css, /font-family: "Noto Sans Arabic Fallback"/);
});

test("system font ships nothing", () => {
  const plan = fontPlan({ font: "system" }, ["en"]);
  assert.deepEqual(plan.faces, []);
  assert.equal(plan.preload, null);
  assert.equal(plan.css, "");
});

test("copyFonts copies exactly the planned files", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "fonts-"));
  try {
    const plan = fontPlan({ font: "inter" }, ["en"]);
    copyFonts(plan, dir);
    for (const f of plan.faces) assert.ok(existsSync(path.join(dir, "assets", "fonts", f.file)), f.file);
    assert.ok(!existsSync(path.join(dir, "assets", "fonts", "inter-cyrillic-wght-normal.woff2")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("preloadFor picks the script's own file per locale: Arabic pages preload the Arabic face, others the Latin one", () => {
  const plan = fontPlan({ font: "inter" }, ["en", "ar"]);
  assert.equal(plan.preloadFor("ar"), "/assets/fonts/noto-sans-arabic-arabic-wght-normal.woff2");
  assert.equal(plan.preloadFor("en"), "/assets/fonts/inter-latin-wght-normal.woff2");
  assert.equal(fontPlan({ font: "system" }, ["en"]).preloadFor("en"), null);
});
