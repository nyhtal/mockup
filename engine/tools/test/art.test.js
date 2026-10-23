import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { loadLibrary, ramp, pickArt, pickTone, renderArt } from "../lib/art.js";

// sharp's operation cache keeps file handles open, which blocks temp-dir removal on Windows.
sharp.cache(false);
const lib = loadLibrary();

/** OKLCH lightness of an sRGB colour (0–255 channels): the inverse of theme.js's oklchToHex, lightness only. */
function lightness(r, g, b) {
  const lin = [r, g, b].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const l = Math.cbrt(0.4122214708 * lin[0] + 0.5363325363 * lin[1] + 0.0514459929 * lin[2]);
  const m = Math.cbrt(0.2119034982 * lin[0] + 0.6806995451 * lin[1] + 0.1073969566 * lin[2]);
  const s = Math.cbrt(0.0883024619 * lin[0] + 0.2817188376 * lin[1] + 0.6299787005 * lin[2]);
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

test("the library has twelve pieces, each with a file and a known composition", () => {
  assert.equal(lib.pieces.size, 12);
  for (const p of lib.pieces.values()) {
    assert.ok(["quiet", "field", "glow"].includes(p.composition), p.id);
    assert.ok(["right", "centre", "bottom"].includes(p.crop), p.id);
  }
  assert.ok(lib.prompt.length > 100, "the shared prompt travels with the library");
});

test("a missing source file fails loading with its id", () => {
  assert.throws(() => loadLibrary("engine/tools/test/fixtures/art-missing"), /ghost\.webp is missing/);
});

test("ramp is deterministic, 256 RGB steps, and follows the hues", () => {
  const a = ramp("dark", 250, 160);
  assert.equal(a.length, 768);
  assert.deepEqual(a, ramp("dark", 250, 160));
  assert.notDeepEqual(a, ramp("dark", 25, 60));
  assert.notDeepEqual(a, ramp("light", 250, 160));
});

test("for any hue the dark ramp keeps its first quarter at L ≤ .25 and the light ramp at L ≥ .9 (Review Focus 5)", () => {
  for (const h of [25, 160, 250, 300]) {
    const d = ramp("dark", h, h + 40), l = ramp("light", h, h + 40);
    for (const i of [0, 32, 64]) {
      assert.ok(lightness(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]) <= 0.25, `dark, hue ${h}, step ${i}`);
      assert.ok(lightness(l[i * 3], l[i * 3 + 1], l[i * 3 + 2]) >= 0.9, `light, hue ${h}, step ${i}`);
    }
  }
});

test("pickArt and pickTone are stable per slug; pickArt keeps to the allowed list and never picks a glow by default", () => {
  assert.equal(pickArt("hero-automation", lib), pickArt("hero-automation", lib));
  assert.equal(pickArt("anything", lib, ["folds"]), "folds");
  const picks = new Set(Array.from({ length: 200 }, (_, i) => pickArt(`s${i}`, lib)));
  assert.ok(picks.size >= 8, "the default pool spreads over the library");
  assert.ok(!picks.has("glow"), "glow is only used when declared");
  assert.equal(pickTone("hero-automation"), pickTone("hero-automation"));
  const tones = new Set(Array.from({ length: 50 }, (_, i) => pickTone(`t${i}`)));
  assert.deepEqual([...tones].sort(), ["dark", "light"]);
});

test("brand.art naming a piece that does not exist fails with its id (Review Focus 3)", () => {
  assert.throws(() => pickArt("a", lib, ["contours-quiet", "nope"]), /unknown piece "nope"/);
});

test("renderArt gives the requested size, recoloured, deterministic", { timeout: 60000 }, async () => {
  const opts = { library: lib, id: "ribbon-quiet", tone: "dark", width: 320, height: 180, hue: 250, accentHue: 160 };
  const a = await (await renderArt(opts)).png().toBuffer();
  const b = await (await renderArt(opts)).png().toBuffer();
  assert.deepEqual(a, b);
  const meta = await sharp(a).metadata();
  assert.equal(meta.width, 320);
  assert.equal(meta.height, 180);
  const stats = await sharp(a).stats();
  assert.ok(stats.channels[2].mean > stats.channels[0].mean, "a blue brand hue makes a blue-leaning picture");
});

test("a quiet piece cropped square or portrait keeps its structured end side (Review Focus 4)", { timeout: 60000 }, async () => {
  // sharp's stats() reads the input, not the pipeline's output, so every measurement encodes first.
  const mean = async (img) => (await sharp(await img.png().toBuffer()).stats()).channels[0].mean;
  const piece = lib.pieces.get("contours-quiet");
  for (const [w, h] of [[240, 240], [180, 240]]) {
    const img = await renderArt({ library: lib, id: piece.id, tone: "dark", width: w, height: h, hue: 250, accentHue: 160 });
    const kept = await mean(img.greyscale());
    const quietSide = await mean(sharp(piece.file).greyscale().resize(w, h, { fit: "cover", position: "left" }));
    const endSide = await mean(sharp(piece.file).greyscale().resize(w, h, { fit: "cover", position: "right" }));
    assert.ok(endSide > quietSide * 1.5, `${w}×${h}: the source's end side is the structured one`);
    const darkQuiet = await mean((await renderArt({ library: { pieces: new Map([[piece.id, { ...piece, crop: "left" }]]) }, id: piece.id, tone: "dark", width: w, height: h, hue: 250, accentHue: 160 })).greyscale());
    assert.ok(kept > darkQuiet, `${w}×${h}: the crop keeps the structured end, not the quiet start`);
  }
});
