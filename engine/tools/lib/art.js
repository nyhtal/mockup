/**
 * The art library (R-ASSET-05): abstract greyscale sources in engine/art/, recoloured to a site's brand and accent
 * hues through a 256-step ramp, cropped to the declared ratio. Deterministic: the same inputs give the same pixels.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { oklchToHex } from "./theme.js";
import { seed } from "./placeholder.js";

/**
 * Ramp stops per tone: [grey level 0–1, OKLCH L, C, "b" brand hue | "a" accent hue]. The dark ramp keeps the quiet
 * quarter at L ≤ .25 so inverse text over it holds contrast and puts its brightest structure on the accent (where the light
 * is); the light ramp stays in the brand hue alone, since an accent at its darkest end read as ink blots.
 */
export const RAMPS = {
  dark: [[0, 0.15, 0.03, "b"], [0.25, 0.24, 0.07, "b"], [0.5, 0.47, 0.15, "b"], [0.78, 0.72, 0.13, "a"], [1, 0.97, 0.03, "a"]],
  light: [[0, 0.975, 0.01, "b"], [0.3, 0.93, 0.035, "b"], [0.6, 0.79, 0.09, "b"], [0.86, 0.63, 0.13, "b"], [1, 0.57, 0.13, "b"]],
};

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** engine/art/manifest.json → { prompt, pieces: Map<id, { id, composition, crop, subject, file }> }; a missing file throws. */
export function loadLibrary(dir = "engine/art") {
  const manifest = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const pieces = new Map();
  for (const p of manifest.pieces) {
    const file = path.join(dir, `${p.id}.webp`);
    if (!existsSync(file)) throw new Error(`art library: ${p.id}.webp is missing`);
    pieces.set(p.id, { ...p, file });
  }
  return { prompt: manifest.prompt, pieces };
}

/** 256 RGB triplets, grey level → colour, for a tone and the two hues. */
export function ramp(tone, hue, accentHue) {
  const stops = RAMPS[tone].map(([p, l, c, which]) => [p, rgb(oklchToHex(l, c, which === "a" ? accentHue : hue))]);
  const out = new Uint8Array(768);
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    let k = 0;
    while (k < stops.length - 2 && x > stops[k + 1][0]) k++;
    const [p0, c0] = stops[k], [p1, c1] = stops[k + 1];
    const t = Math.min(1, Math.max(0, (x - p0) / (p1 - p0)));
    for (let ch = 0; ch < 3; ch++) out[i * 3 + ch] = Math.round(c0[ch] + (c1[ch] - c0[ch]) * t);
  }
  return out;
}

/** The piece for an image that declares none: seeded by the slug over the site's `brand.art` (or the whole library), calm pieces excluded (they are for text-heavy cards and are declared). */
export function pickArt(slug, library, allowed) {
  for (const id of allowed || []) if (!library.pieces.has(id)) throw new Error(`brand.art: unknown piece "${id}"`);
  const pool = [...(allowed && allowed.length ? allowed : library.pieces.keys())].filter((id) => library.pieces.get(id).composition !== "calm");
  if (!pool.length) throw new Error("brand.art: no piece left once calm pieces are excluded");
  return pool[seed(slug) % pool.length];
}

/** The tone for an image that declares none, seeded by the slug. */
export const pickTone = (slug) => (seed(`${slug}#tone`) % 2 ? "dark" : "light");

/** A sharp instance holding the recoloured crop, ready for .avif() / .webp(). */
export async function renderArt({ library, id, tone, width, height, hue, accentHue }) {
  const piece = library.pieces.get(id);
  if (!piece) throw new Error(`unknown art "${id}"`);
  const { data, info } = await sharp(piece.file).greyscale().resize(width, height, { fit: "cover", position: piece.crop }).raw().toBuffer({ resolveWithObject: true });
  const lut = ramp(tone, hue, accentHue);
  const out = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0, n = info.width * info.height; i < n; i++) {
    const g = data[i * info.channels] * 3;
    out[i * 3] = lut[g];
    out[i * 3 + 1] = lut[g + 1];
    out[i * 3 + 2] = lut[g + 2];
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } });
}
