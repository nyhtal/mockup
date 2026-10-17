import { readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { pagesFor, parse } from "../lib/html.js";

export const id = "budget";
export const checks = ["html", "css", "js", "page", "missing-asset"];

const ASSET = /\.(css|js|mjs|woff2|avif|webp|png|svg|ico)$/;
const local = (u) => typeof u === "string" && u.startsWith("/") && !u.startsWith("//");
const clean = (u) => u.split(/[?#]/)[0];

/** Pick one candidate from a srcset for a screen `width` CSS px wide: the smallest that covers it, else the largest. */
export function pickCandidate(srcset, width) {
  const cands = srcset.split(",").map((c) => c.trim().split(/\s+/)).filter(([u]) => local(u)).map(([u, d]) => ({ url: clean(u), w: d?.endsWith("w") ? Number(d.slice(0, -1)) : Infinity }));
  if (!cands.length) return null;
  const covering = cands.filter((c) => c.w >= width).sort((a, b) => a.w - b.w);
  return (covering[0] || cands.sort((a, b) => b.w - a.w)[0]).url;
}

/**
 * Assets a mobile browser downloads for the page: stylesheets, scripts, and for each image element
 * exactly one candidate (first <source> of a <picture>, else the img's srcset, else its src).
 */
export function pageAssets(root, mobileWidth = 720) {
  const urls = new Set();
  for (const el of root.querySelectorAll("link[href],script[src]")) {
    const u = el.getAttribute("href") || el.getAttribute("src");
    if (local(u)) urls.add(clean(u));
  }
  for (const pic of root.querySelectorAll("picture")) {
    const source = pic.querySelector("source[srcset]");
    const img = pic.querySelector("img");
    const pick = source ? pickCandidate(source.getAttribute("srcset"), mobileWidth) : img?.getAttribute("srcset") ? pickCandidate(img.getAttribute("srcset"), mobileWidth) : img && local(img.getAttribute("src")) ? clean(img.getAttribute("src")) : null;
    if (pick) urls.add(pick);
  }
  for (const img of root.querySelectorAll("img")) {
    if (img.closest("picture")) continue;
    const pick = img.getAttribute("srcset") ? pickCandidate(img.getAttribute("srcset"), mobileWidth) : local(img.getAttribute("src")) ? clean(img.getAttribute("src")) : null;
    if (pick) urls.add(pick);
  }
  return [...urls].filter((u) => ASSET.test(u));
}

function parseRanges(spec) {
  return spec.split(",").map((r) => r.trim().replace(/^U\+/i, "")).map((r) => {
    if (r.includes("-")) { const [a, b] = r.split("-"); return [parseInt(a, 16), parseInt(b, 16)]; }
    if (r.includes("?")) return [parseInt(r.replaceAll("?", "0"), 16), parseInt(r.replaceAll("?", "F"), 16)];
    return [parseInt(r, 16), parseInt(r, 16)];
  });
}

/** Font files the page actually needs: every @font-face url whose unicode-range (if any) matches a character on the page. */
export function fontsForPage(css, root) {
  const text = root.querySelector("body")?.text || root.text || "";
  const codes = new Set([...text].map((ch) => ch.codePointAt(0)));
  const out = new Set();
  for (const block of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const body = block[1];
    const url = /url\(\s*["']?([^"')]+?\.woff2)["']?\s*\)/i.exec(body)?.[1];
    if (!url || !local(url)) continue;
    const range = /unicode-range\s*:\s*([^;]+)/i.exec(body)?.[1];
    if (!range) { out.add(url); continue; }
    const ranges = parseRanges(range);
    for (const c of codes) if (ranges.some(([a, b]) => c >= a && c <= b)) { out.add(url); break; }
  }
  return [...out];
}

export function loadBudgets() {
  return JSON.parse(readFileSync("engine/budgets.json", "utf8"));
}

export async function run(ctx) {
  const budgets = ctx.budgets || loadBudgets();
  const mobileWidth = budgets.mobileWidth || 720;
  const findings = [];
  const report = [];

  for (const file of pagesFor(ctx)) {
    const add = (check, message) => findings.push({ file, message, check: `budget/${check}` });
    const html = statSync(file).size;
    if (html > budgets.html) add("html", `${html} B > ${budgets.html} B`);
    let total = html;
    const { root } = parse(file);
    const assets = pageAssets(root, mobileWidth);
    const cssFiles = assets.filter((u) => u.endsWith(".css"));
    for (const u of cssFiles) {
      const p = path.join(ctx.distDir, u);
      if (existsSync(p)) for (const f of fontsForPage(readFileSync(p, "utf8"), root)) if (!assets.includes(f)) assets.push(f);
    }
    for (const u of assets) {
      const p = path.join(ctx.distDir, u);
      if (!existsSync(p)) { add("missing-asset", `${u} not found on disk`); continue; }
      const bytes = statSync(p).size;
      total += bytes;
      if (u.endsWith(".css") && bytes > budgets.css) add("css", `${u} ${bytes} B > ${budgets.css} B`);
      if (/\.m?js$/.test(u) && bytes > budgets.js) add("js", `${u} ${bytes} B > ${budgets.js} B`);
    }
    if (total > budgets.page) add("page", `${total} B > ${budgets.page} B`);
    report.push({ file, html, total, assets: assets.length });
  }
  return { id, ok: findings.length === 0, findings, report };
}
