import { test } from "node:test";
import assert from "node:assert/strict";
import { placeholderSvg, seed } from "../lib/placeholder.js";

const base = { slug: "hero-automation", width: 480, height: 270, hue: 250, accentHue: 160 };

test("the same input always gives the same SVG", () => {
  assert.equal(placeholderSvg(base), placeholderSvg({ ...base }));
});

test("a different slug gives a different picture", () => {
  assert.notEqual(placeholderSvg(base), placeholderSvg({ ...base, slug: "team-office" }));
});

test("the SVG is sized to the request, uses hex colours the renderer understands, follows the brand hues and contains no text", () => {
  const svg = placeholderSvg(base);
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="480" height="270" viewBox="0 0 480 270">/);
  assert.doesNotMatch(svg, /oklch\(/, "librsvg renders oklch() as black");
  assert.match(svg, /fill="#[0-9a-f]{6}"/);
  assert.notEqual(svg, placeholderSvg({ ...base, hue: 30 }), "a different brand hue changes the colours");
  assert.doesNotMatch(svg, /<text/);
  assert.ok((svg.match(/<(circle|rect)/g) || []).length >= 4);
});

test("seed is a stable 32-bit hash", () => {
  assert.equal(seed("a"), seed("a"));
  assert.notEqual(seed("a"), seed("b"));
  assert.ok(Number.isInteger(seed("hero")) && seed("hero") >= 0);
});
