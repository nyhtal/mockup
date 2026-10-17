import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { listHtml } from "./lib/html.js";
import { placeholderSvg } from "./lib/placeholder.js";

/** The aspect ratios a page may declare (R-LAY-10). */
export const RATIOS = { "16x9": [16, 9], "4x3": [4, 3], "3x2": [3, 2], "1x1": [1, 1], "21x9": [21, 9] };
export const WIDTHS = [480, 768, 1200, 1600];
const NAME = /^\/assets\/images\/([a-z0-9]+(?:-[a-z0-9]+)*)-(\d+x\d+)-(\d+)\.(avif|webp)$/;

/** /assets/images/<slug>-<WxH>-<width>.<fmt> → { slug, ratio, width, height, format, url } or null. */
export function parseImageName(url) {
  const m = NAME.exec(url);
  if (!m) return null;
  const ratio = RATIOS[m[2]];
  if (!ratio) return null;
  const width = Number(m[3]);
  return { slug: m[1], ratio, width, height: Math.round((width * ratio[1]) / ratio[0]), format: m[4], url };
}

/** Every distinct placeholder image URL referenced by any page under distDir. */
export function referencedImages(distDir) {
  const seen = new Map();
  for (const file of listHtml(distDir)) {
    const html = readFileSync(file, "utf8");
    for (const m of html.matchAll(/\/assets\/images\/[a-z0-9-]+-\d+x\d+-\d+\.(?:avif|webp)/g)) {
      const parsed = parseImageName(m[0]);
      if (parsed) seen.set(m[0], parsed);
      else throw new Error(`${file}: image "${m[0]}" uses an unknown ratio; allowed: ${Object.keys(RATIOS).join(", ")}`);
    }
  }
  return [...seen.values()];
}

/** Render every referenced image that does not exist yet (AVIF q50, WebP q75). Returns counts. */
export async function generateImages(distDir, brand = {}) {
  const out = path.join(distDir, "assets", "images");
  mkdirSync(out, { recursive: true });
  let generated = 0, skipped = 0;
  for (const img of referencedImages(distDir)) {
    const file = path.join(distDir, img.url);
    if (existsSync(file)) { skipped++; continue; }
    const svg = Buffer.from(placeholderSvg({ slug: img.slug, width: img.width, height: img.height, hue: brand.hue ?? 250, accentHue: brand.accentHue ?? brand.hue ?? 250 }));
    const pipeline = sharp(svg, { density: 72 });
    const buf = img.format === "avif" ? await pipeline.avif({ quality: 50, effort: 4 }).toBuffer() : await pipeline.webp({ quality: 75 }).toBuffer();
    writeFileSync(file, buf);
    generated++;
  }
  return { generated, skipped };
}
