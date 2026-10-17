import { test } from "node:test";
import assert from "node:assert/strict";
import { brandTokens, oklchToHex, themeColors } from "../lib/theme.js";

const brand = { hue: 250, accentHue: 160, radius: "soft", motion: "standard", font: "inter" };

test("oklchToHex converts known colours", () => {
  assert.equal(oklchToHex(1, 0, 0), "#ffffff");
  assert.equal(oklchToHex(0, 0, 0), "#000000");
  const red = oklchToHex(0.628, 0.2577, 29.23);
  assert.match(red, /^#f[ef]0[0-4]0[0-4]$/);
});

test("brandTokens wipes the palette and defines roles with light-dark()", () => {
  const css = brandTokens(brand);
  assert.match(css, /--color-\*: initial;/);
  for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) assert.match(css, new RegExp(`--color-brand-${step}: oklch\\(`));
  assert.match(css, /--color-accent-600: oklch\(/);
  assert.match(css, /--color-surface: light-dark\(oklch\([^)]*\), oklch\([^)]*\)\);/);
  for (const role of ["surface-alt", "surface-raised", "ink", "ink-muted", "ink-inverse", "line", "line-strong", "focus", "success", "success-soft", "success-strong", "warning", "warning-soft", "warning-strong", "danger", "danger-soft", "danger-strong"]) {
    assert.match(css, new RegExp(`--color-${role}: light-dark\\(`), role);
  }
  assert.match(css, /--radius-md: 0\.5rem;/);
  assert.match(css, /--reveal-distance: 16px;/);
  assert.match(css, /--reveal-duration: 300ms;/);
  assert.match(css, /--reveal-stagger: 60ms;/);
  assert.match(css, /--font-sans: "Inter Variable", "Inter Fallback", system-ui, sans-serif;/);
});

test("hue 0, hue 360 and accent equal to brand still give valid distinct scales", () => {
  for (const hue of [0, 360]) {
    const css = brandTokens({ ...brand, hue, accentHue: hue });
    assert.doesNotMatch(css, /NaN|undefined/);
    // R-TOK-06: lightness 97…20 for steps 50…950, so 600 is 48% and 500 is 56%.
    assert.match(css, new RegExp(`--color-brand-600: oklch\\(48% 0\\.17 ${hue}\\)`));
    assert.match(css, new RegExp(`--color-accent-600: oklch\\(48% 0\\.17 ${hue}\\)`));
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
  assert.match(brandTokens({ ...brand, motion: "calm" }), /--reveal-distance: 8px;[\s\S]*--reveal-duration: 200ms;[\s\S]*--reveal-stagger: 0ms;/);
  assert.match(brandTokens({ ...brand, motion: "expressive" }), /--reveal-distance: 24px;[\s\S]*--reveal-duration: 500ms;[\s\S]*--reveal-stagger: 90ms;/);
});

test("system font gives a system stack and no fallback family", () => {
  assert.match(brandTokens({ ...brand, font: "system" }), /--font-sans: system-ui, sans-serif;/);
});
