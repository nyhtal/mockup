import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { listHtml } from "./lib/html.js";

/** The icon allow-list (R-ASSET-03). */
export const ICONS = JSON.parse(readFileSync(path.join("engine", "icons.json"), "utf8"));
const ALLOWED = new Set(ICONS);
const ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const cache = new Map();

/** One <symbol> for an allow-listed Lucide icon: the icon's inner elements under the shared stroke attributes. */
export function symbol(name) {
  if (!ALLOWED.has(name)) throw new Error(`Unknown icon "${name}": add it to engine/icons.json if it is a Lucide icon`);
  if (cache.has(name)) return cache.get(name);
  const svg = readFileSync(path.join("node_modules", "lucide-static", "icons", `${name}.svg`), "utf8");
  const inner = svg.replace(/<!--[\s\S]*?-->/g, "").replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const body = inner.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join("");
  const out = `<symbol id="i-${name}" ${ATTRS}>${body}</symbol>`;
  cache.set(name, out);
  return out;
}

/** Distinct icon names referenced by <use href="#i-…"> in a page, in first-use order. */
export function usedIcons(html) {
  return [...new Set([...html.matchAll(/href="#i-([a-z0-9-]+)"/g)].map((m) => m[1]))];
}

/**
 * Replace the <!--sprite--> placeholder in every page with a sprite holding only that page's icons
 * (R-PERF-13). Pages without icons lose the placeholder. Unknown icons fail the build naming the page.
 */
export function injectSprites(distDir, opts = {}) {
  const files = opts.only ? opts.only.map((f) => path.join(distDir, f)) : listHtml(distDir);
  let pages = 0, symbols = 0;
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    if (!html.includes("<!--sprite-->")) continue;
    const names = usedIcons(html).sort();
    let sprite = "";
    try {
      sprite = names.length ? `<svg class="hidden" aria-hidden="true">${names.map(symbol).join("")}</svg>` : "";
    } catch (e) {
      throw new Error(`${file}: ${e.message}`);
    }
    writeFileSync(file, html.replace("<!--sprite-->", sprite));
    pages++;
    symbols += names.length;
  }
  return { pages, symbols };
}
