import { readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { pagesFor, parse } from "../lib/html.js";

export const id = "budget";

const ASSET = /\.(css|js|mjs|woff2|avif|webp|png|svg|ico)$/;

/** Local asset URLs a page loads: src, href and srcset candidates under /, filtered to asset extensions. */
export function localAssets(root) {
  const urls = new Set();
  const local = (u) => u && u.startsWith("/") && !u.startsWith("//");
  for (const el of root.querySelectorAll("[src],[href],[srcset]")) {
    for (const attr of ["src", "href"]) {
      const v = el.getAttribute(attr);
      if (local(v)) urls.add(v.split(/[?#]/)[0]);
    }
    const srcset = el.getAttribute("srcset");
    if (srcset) for (const c of srcset.split(",")) { const u = c.trim().split(/\s+/)[0]; if (local(u)) urls.add(u); }
  }
  return [...urls].filter((u) => ASSET.test(u));
}

export function loadBudgets() {
  return JSON.parse(readFileSync("engine/budgets.json", "utf8"));
}

export async function run(ctx) {
  const budgets = ctx.budgets || loadBudgets();
  const findings = [];
  const report = [];

  for (const file of pagesFor(ctx)) {
    const add = (check, message) => findings.push({ file, message, check: `budget/${check}` });
    const html = statSync(file).size;
    if (html > budgets.html) add("html", `${html} B > ${budgets.html} B`);
    let total = html;
    for (const u of localAssets(parse(file).root)) {
      const p = path.join(ctx.distDir, u);
      if (!existsSync(p)) { add("missing-asset", `${u} not found on disk`); continue; }
      const bytes = statSync(p).size;
      total += bytes;
      if (u.endsWith(".css") && bytes > budgets.css) add("css", `${u} ${bytes} B > ${budgets.css} B`);
      if (/\.m?js$/.test(u) && bytes > budgets.js) add("js", `${u} ${bytes} B > ${budgets.js} B`);
    }
    if (total > budgets.page) add("page", `${total} B > ${budgets.page} B`);
    report.push({ file, html, total });
  }
  return { id, ok: findings.length === 0, findings, report };
}
