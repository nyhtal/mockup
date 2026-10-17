import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parse as parseHtml } from "node-html-parser";

/** Every .html file under dir, recursively, as repo-relative paths. */
export function listHtml(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) out.push(...listHtml(p));
    else if (e.endsWith(".html")) out.push(p);
  }
  return out;
}

/** Files to check for a gate: ctx.only (relative to distDir) or every page. */
export function pagesFor(ctx) {
  return ctx.only ? ctx.only.map((f) => path.join(ctx.distDir, f)) : listHtml(ctx.distDir);
}

export function parse(file) {
  const html = readFileSync(file, "utf8");
  return { html, root: parseHtml(html) };
}

/** Parsed JSON-LD blocks on a page (throws on invalid JSON). */
export function jsonLd(root) {
  return root.querySelectorAll('script[type="application/ld+json"]').map((s) => JSON.parse(s.textContent));
}
