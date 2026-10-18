import { test } from "node:test";
import assert from "node:assert/strict";
import { brandTokens, oklchToHex, themeColors, contrast, contrastFailures } from "../lib/theme.js";

const brand = { hue: 250, accentHue: 160, radius: "soft", motion: "standard", font: "inter" };

test("oklchToHex converts known colours", () => {
  assert.equal(oklchToHex(1, 0, 0), "#ffffff");
  assert.equal(oklchToHex(0, 0, 0), "#000000");
  const red = oklchToHex(0.628, 0.2577, 29.23);
  assert.match(red, /^#f[ef]0[0-4]0[0-4]$/);
});

test("brandTokens wipes the palette and defines roles with light-dark() in sRGB hex", () => {
  const css = brandTokens(brand);
  assert.match(css, /--color-\*: initial;/);
  for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) assert.match(css, new RegExp(`--color-brand-${step}: #[0-9a-f]{6};`));
  assert.match(css, /--color-accent-600: #[0-9a-f]{6};/);
  assert.match(css, /--color-surface: light-dark\(#[0-9a-f]{6}, #[0-9a-f]{6}\);/);
  assert.doesNotMatch(css, /oklch\(/, "computed oklch() colours are misread by axe-core; tokens ship as hex");
  for (const role of ["surface-alt", "surface-raised", "ink", "ink-muted", "ink-brand", "line", "line-strong", "focus", "success", "success-soft", "success-strong", "warning", "warning-soft", "warning-strong", "danger", "danger-soft", "danger-strong"]) {
    assert.match(css, new RegExp(`--color-${role}: light-dark\\(`), role);
  }
  // ink-inverse sits on brand backgrounds, which do not change with the scheme, so it is fixed (R-COL-01, R-COL-03).
  assert.match(css, /--color-ink-inverse: #[0-9a-f]{6};/);
  assert.match(css, /--radius-md: 0\.5rem;/);
  assert.match(css, /--reveal-distance: 24px;/);
  assert.match(css, /--reveal-duration: 300ms;/);
  assert.match(css, /--reveal-stagger: 60ms;/);
  assert.match(css, /--font-sans: "Inter Variable", "Inter Fallback", system-ui, sans-serif;/);
});

test("hue 0, hue 360 and accent equal to brand still give valid distinct scales", () => {
  for (const hue of [0, 360]) {
    const css = brandTokens({ ...brand, hue, accentHue: hue });
    assert.doesNotMatch(css, /NaN|undefined/);
    // R-TOK-06: lightness 97…20 for steps 50…950, so 600 is 48% and 500 is 56%.
    const expected = oklchToHex(0.48, 0.17, hue);
    assert.match(css, new RegExp(`--color-brand-600: ${expected};`));
    assert.match(css, new RegExp(`--color-accent-600: ${expected};`));
  }
});

test("themeColors gives hex values for both schemes", () => {
  const { light, dark } = themeColors(brand);
  assert.match(light, /^#[0-9a-f]{6}$/);
  assert.match(dark, /^#[0-9a-f]{6}$/);
  assert.notEqual(light, dark);
});

test("radius and motion presets map to the bylaw values", () => {
  assert.match(brandTokens({ ...brand, radius: "sharp" }), /--radius-lg: 0;/);
  assert.match(brandTokens({ ...brand, radius: "round" }), /--radius-xl: 2rem;/);
  assert.match(brandTokens({ ...brand, motion: "calm" }), /--reveal-distance: 12px;[\s\S]*--reveal-duration: 200ms;[\s\S]*--reveal-stagger: 0ms;/);
  assert.match(brandTokens({ ...brand, motion: "expressive" }), /--reveal-distance: 32px;[\s\S]*--reveal-duration: 500ms;[\s\S]*--reveal-stagger: 90ms;/);
});

test("contrast follows WCAG 2", () => {
  assert.equal(Math.round(contrast("#000000", "#ffffff")), 21);
  assert.ok(Math.abs(contrast("#767676", "#ffffff") - 4.54) < 0.05);
});

test("text roles reach 4.5:1 on every surface, inverse text 4.5:1 on brand backgrounds, and UI lines 3:1, in both schemes for every hue", () => {
  for (const hue of [0, 30, 90, 160, 250, 300, 359]) {
    const fails = contrastFailures({ ...brand, hue, accentHue: (hue + 90) % 360 });
    assert.deepEqual(fails, [], `hue ${hue}: ${JSON.stringify(fails)}`);
  }
});

test("contrastFailures checks the inverse and boundary pairs in the dark scheme too", () => {
  const checked = contrastFailures.pairs.map((p) => p.join("/"));
  for (const pair of ["ink-inverse/brand-600", "ink-inverse/brand-700", "ink-inverse/accent-600", "brand-800/brand-50", "line-strong/surface", "line-strong/surface-raised"]) {
    assert.ok(checked.includes(pair), `${pair} is checked`);
  }
  assert.deepEqual(contrastFailures.schemes, ["light", "dark"]);
});

test("system font gives a system stack and no fallback family", () => {
  assert.match(brandTokens({ ...brand, font: "system" }), /--font-sans: system-ui, sans-serif;/);
});

test("script families join the font stack after the brand font, each before its own fallback (R-TYPO-12)", () => {
  const css = brandTokens(brand, { scriptFamilies: ["Noto Sans Arabic Variable"] });
  assert.match(css, /--font-sans: "Inter Variable", "Noto Sans Arabic Variable", "Inter Fallback", "Noto Sans Arabic Fallback", system-ui, sans-serif;/);
  assert.match(css, /--font-system: system-ui, sans-serif;/);
});
