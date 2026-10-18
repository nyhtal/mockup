import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { listHtml } from "./lib/html.js";
import { placeholderSvg } from "./lib/placeholder.js";
import { encodeIco } from "./lib/ico.js";
import { oklchToHex } from "./lib/theme.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** The mark outline on a 64-unit square: rounded corners of radius r, the bottom-right corner cut from (64, 42) to (42, 64). */
export function markPath(r = 14) {
  return r ? `M${r} 0H${64 - r}a${r} ${r} 0 0 1 ${r} ${r}V42L42 64H${r}a${r} ${r} 0 0 1 -${r} -${r}V${r}a${r} ${r} 0 0 1 ${r} -${r}z` : "M0 0H64V42L42 64H0z";
}

/** Monogram SVG used for every favicon size; `media` adds the dark-scheme variant for icon.svg. */
export function monogramSvg({ letter, hue, size = 64, rounded = true, media = false }) {
  const bg = oklchToHex(0.48, 0.17, hue), bgDark = oklchToHex(0.76, 0.11, hue), fgDark = oklchToHex(0.2, 0.02, hue);
  const style = media ? `<style>@media (prefers-color-scheme: dark){.bg{fill:${bgDark}}.fg{fill:${fgDark}}}</style>` : "";
  // The mark's silhouette (DESIGN §4): a rounded tile whose bottom-right corner is cut on the diagonal; the same path as the `logo` primitive.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${style}<path class="bg" d="${markPath(rounded ? 14 : 0)}" fill="${bg}"/><text class="fg" x="30" y="33" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#ffffff">${esc(letter)}</text></svg>`;
}

/** favicon.ico (16/32/48), icon.svg, apple-touch-icon.png (180, opaque corners), icon-192.png (R-ASSET-09). */
export async function generateFavicons(distDir, { letter, hue }) {
  const png = (size, rounded) => sharp(Buffer.from(monogramSvg({ letter, hue, size, rounded }))).png().toBuffer();
  const [p16, p32, p48, p180, p192] = await Promise.all([png(16, true), png(32, true), png(48, true), png(180, false), png(192, true)]);
  writeFileSync(path.join(distDir, "favicon.ico"), encodeIco([{ size: 16, png: p16 }, { size: 32, png: p32 }, { size: 48, png: p48 }]));
  writeFileSync(path.join(distDir, "icon.svg"), monogramSvg({ letter, hue, media: true }));
  writeFileSync(path.join(distDir, "apple-touch-icon.png"), p180);
  writeFileSync(path.join(distDir, "icon-192.png"), p192);
}

function wrap(text, max) {
  const words = text.split(/\s+/), lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max && line) { lines.push(line); line = w; } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 2).map((l, i) => (i === 1 && lines.length > 2 ? l.slice(0, max - 1) + "…" : l));
}

/** 1200×630 social image per page from dist/og-manifest.json: gradient, title (≤ 2 lines), site name (R-SEO-06, R-ASSET-10). */
export async function generateOgImages(distDir, brand = {}) {
  const manifest = path.join(distDir, "og-manifest.json");
  if (!existsSync(manifest)) return { generated: 0 };
  const pages = JSON.parse(readFileSync(manifest, "utf8"));
  const out = path.join(distDir, "assets", "og");
  mkdirSync(out, { recursive: true });
  let generated = 0;
  for (const { slug, title, site } of pages) {
    const file = path.join(out, `${slug}.png`);
    if (existsSync(file)) continue;
    const hue = brand.hue ?? 250, accent = brand.accentHue ?? hue;
    const lines = wrap(title, 32);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${oklchToHex(0.4, 0.14, hue)}"/><stop offset="1" stop-color="${oklchToHex(0.48, 0.17, accent)}"/></linearGradient></defs>` +
      `<rect width="1200" height="630" fill="url(#g)"/><circle cx="1040" cy="120" r="220" fill="#ffffff" fill-opacity="0.08"/>` +
      lines.map((l, i) => `<text x="80" y="${290 + i * 72}" font-family="Arial, Helvetica, sans-serif" font-size="60" font-weight="700" fill="#ffffff">${esc(l)}</text>`).join("") +
      `<text x="80" y="540" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#ffffff" fill-opacity="0.85">${esc(site)}</text></svg>`;
    writeFileSync(file, await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toBuffer());
    generated++;
  }
  rmSync(manifest);
  return { generated };
}

/** The aspect ratios a page may declare (R-LAY-10). */
export const RATIOS = { "16x9": [16, 9], "4x3": [4, 3], "3x2": [3, 2], "1x1": [1, 1], "21x9": [21, 9], "3x4": [3, 4] };
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
