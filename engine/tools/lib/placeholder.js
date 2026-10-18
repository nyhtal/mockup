/**
 * Deterministic abstract placeholder art (R-ASSET-05): brand-hue gradient plus a few translucent shapes,
 * seeded by the image slug so a rebuild never changes a committed-looking image. No text, no faces.
 * Colours are emitted as hex because sharp's SVG renderer (librsvg) does not understand oklch().
 */
import { oklchToHex } from "./theme.js";

/** FNV-1a 32-bit hash of a string → non-negative integer. */
export function seed(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32 PRNG → function returning floats in [0, 1). */
export function rng(s) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => Math.round(n * 10) / 10;
const hex = (l, c, h) => oklchToHex(l / 100, c, h);

export function placeholderSvg({ slug, width, height, hue = 250, accentHue = 160 }) {
  const r = rng(seed(slug));
  const dark = r() > 0.5;
  const l1 = dark ? 30 + r() * 15 : 85 + r() * 10;
  const l2 = dark ? 18 + r() * 12 : 70 + r() * 15;
  const angle = Math.floor(r() * 360);
  const shapes = [];
  const count = 4 + Math.floor(r() * 4);
  for (let i = 0; i < count; i++) {
    const h = r() > 0.5 ? hue : accentHue;
    const l = dark ? 40 + r() * 35 : 55 + r() * 35;
    const c = 0.06 + r() * 0.12;
    const fill = hex(l, c, h);
    const op = f(0.25 + r() * 0.45);
    if (r() > 0.45) {
      const rad = (0.12 + r() * 0.35) * Math.min(width, height);
      shapes.push(`<circle cx="${f(r() * width)}" cy="${f(r() * height)}" r="${f(rad)}" fill="${fill}" fill-opacity="${op}"/>`);
    } else {
      const w = (0.2 + r() * 0.5) * width, hh = (0.15 + r() * 0.5) * height;
      const rx = f(Math.min(w, hh) * (0.1 + r() * 0.4));
      shapes.push(`<rect x="${f(r() * width - w / 2)}" y="${f(r() * height - hh / 2)}" width="${f(w)}" height="${f(hh)}" rx="${rx}" fill="${fill}" fill-opacity="${op}" transform="rotate(${Math.floor(r() * 40 - 20)} ${f(width / 2)} ${f(height / 2)})"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs><linearGradient id="g" gradientTransform="rotate(${angle} 0.5 0.5)"><stop offset="0" stop-color="${hex(l1, 0.06, hue)}"/><stop offset="1" stop-color="${hex(l2, 0.08, accentHue)}"/></linearGradient></defs>` +
    `<rect width="${width}" height="${height}" fill="url(#g)"/>${shapes.join("")}</svg>`;
}
