import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSite } from "./lib/site.js";
import { listHtml } from "./lib/html.js";
import { startServer } from "./serve.js";
import { installedVersion } from "./setup-vnu.js";
import * as bylaws from "./gates/bylaws.js";
import * as html from "./gates/html.js";
import * as consistency from "./gates/consistency.js";
import * as schema from "./gates/schema.js";
import * as budget from "./gates/budget.js";
import * as i18n from "./gates/i18n.js";
import * as links from "./gates/links.js";
import * as a11y from "./gates/a11y.js";
import * as lighthouse from "./gates/lighthouse.js";

/** Gate order: cheap and offline first, browser-driven last. */
export const GATES = [bylaws, html, consistency, schema, budget, i18n, links, a11y, lighthouse];
export const GATE_IDS = GATES.map((g) => g.id);
/** gate id → the check names it can emit; the bylaws gate validates every `Gate:` line against this. */
export const GATE_CHECKS = Object.fromEntries(GATES.map((g) => [g.id, g.checks]));

export function parseArgs(argv) {
  const get = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : undefined; };
  const list = (v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);
  return { site: get("--site") || "reference", skip: list(get("--skip")), only: list(get("--only")), runs: get("--runs") ? Number(get("--runs")) : undefined };
}

const version = (pkg) => { try { return JSON.parse(readFileSync(path.join("node_modules", pkg, "package.json"), "utf8")).version; } catch { return "n/a"; } };
const sh = (cmd) => { try { return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return "n/a"; } };

export async function runGates({ site, skip = [], only = [], runs }) {
  const distDir = `dist/${site}`;
  if (!existsSync(distDir)) throw new Error(`${distDir} not found; run npm run build -- --site ${site}`);
  if (listHtml(distDir).length === 0) throw new Error(`${distDir} contains no pages; nothing to gate`);
  const { site: siteConfig, siteDir, i18n } = loadSite(site);
  const server = await startServer(distDir);
  const ctx = { distDir, siteDir, site: siteConfig, i18n, engineDir: "engine", baseUrl: server.url, gateChecks: GATE_CHECKS, runs };
  const results = [];
  try {
    for (const gate of GATES) {
      if (skip.includes(gate.id) || (only.length && !only.includes(gate.id))) { results.push({ id: gate.id, skipped: true, ok: true, findings: [] }); continue; }
      const started = Date.now();
      const r = await gate.run(ctx);
      results.push({ ...r, ms: Date.now() - started });
    }
  } finally {
    await server.close();
  }
  return { site, results, ctx };
}

export function formatReport({ site, results }) {
  let vnu = "not installed";
  try { vnu = installedVersion() || vnu; } catch { /* keep */ }
  const lines = [
    `# Gate report: ${site}`,
    "",
    `Date: ${new Date().toISOString()}  Commit: ${sh("git rev-parse --short HEAD")}  OS: ${process.platform} ${process.arch}`,
    `Node ${process.versions.node} · lighthouse ${version("lighthouse")} · tailwindcss ${version("tailwindcss")} · eleventy ${version("@11ty/eleventy")} · pa11y ${version("pa11y")} · vnu ${vnu}`,
    "",
    "| Gate | Result | Findings | Time |",
    "|---|---|---|---|",
    ...results.map((r) => `| ${r.id} | ${r.skipped ? "skipped" : r.ok ? "pass" : "FAIL"} | ${r.findings.length} | ${r.ms ? `${(r.ms / 1000).toFixed(1)}s` : "-"} |`),
  ];
  const lh = results.find((r) => r.id === "lighthouse" && r.report?.length);
  if (lh) {
    const first = lh.report[0];
    lines.push("", "## Lighthouse", "", `Chrome ${first.chrome} · ${first.runs} runs per page and profile, median reported · mobile: ${lh.report.find((p) => p.profile === "mobile")?.throttling || "-"} · desktop: ${lh.report.find((p) => p.profile === "desktop")?.throttling || "-"}`, "", "| Page | Profile | Perf | A11y | BP | SEO |", "|---|---|---|---|---|---|");
    for (const p of lh.report) lines.push(`| ${p.url.replace(/^https?:\/\/[^/]+/, "")} | ${p.profile} | ${p.scores.performance} | ${p.scores.accessibility} | ${p.scores["best-practices"]} | ${p.scores.seo} |`);
    if (lh.coverage?.length) {
      lines.push("", "## Lighthouse coverage", "", "Every page in the default locale; in every other locale the first page of each page type (R-GATE-10).", "", "| Locale | Page type | Measured on |", "|---|---|---|");
      for (const c of lh.coverage) lines.push(`| ${c.locale || "root"} | ${c.pageType} | ${c.url.replace(/^https?:\/\/[^/]+/, "")} |`);
    }
  }
  const bud = results.find((r) => r.id === "budget" && r.report?.length);
  if (bud) {
    lines.push("", "## Page weight", "", "| Page | HTML | Total (mobile) | Total over gzip |", "|---|---|---|---|");
    for (const p of bud.report) lines.push(`| ${"/" + path.relative(`dist/${site}`, p.file).replace(/\\/g, "/").replace(/index\.html$/, "")} | ${p.html} B | ${p.total} B | ${p.gzip ?? "-"} B |`);
  }
  const ax = results.find((r) => r.id === "a11y" && r.report);
  const review = ax ? ax.report.flatMap((p) => p.review) : [];
  if (review.length) {
    lines.push("", "## Needs human review (axe incomplete)", "");
    for (const f of review) lines.push(`- \`${f.check}\` ${f.file} — ${f.message}`);
  }
  const failing = results.filter((r) => !r.ok);
  if (failing.length) {
    lines.push("", "## Findings", "");
    for (const r of failing) for (const f of r.findings) lines.push(`- \`${f.check}\` ${f.file}${f.line ? `:${f.line}` : ""} — ${f.message}`);
  }
  return lines.join("\n") + "\n";
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runGates(parseArgs(process.argv.slice(2)))
    .then((out) => {
      const report = formatReport(out);
      mkdirSync("reports", { recursive: true });
      writeFileSync("reports/latest.md", report);
      console.log(report);
      process.exit(out.results.every((r) => r.ok) ? 0 : 1);
    })
    .catch((e) => { console.error(e.stack || e.message); process.exit(1); });
}
