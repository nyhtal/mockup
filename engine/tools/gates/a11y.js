import { createRequire } from "node:module";
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";

/** axe-core's browser bundle, injected into every page (R-GATE-09). */
const AXE_SOURCE = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
/** The WCAG 2.2 AA tag set plus axe's best practices (landmarks, heading order, region), as the bylaws cite them. */
export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
import { chromePath, pages } from "../lib/browser.js";
import { samplePages } from "../lib/sampling.js";

/** Widths at which no page may scroll horizontally (R-LAY-05): the smallest supported phone and the common one. */
export const REFLOW_WIDTHS = [320, 375];

/** The widest the document gets while stepping through a page half a viewport at a time (scroll-driven transforms can widen it only mid-scroll), per width. */
export async function reflowOf(browser, url, widths = REFLOW_WIDTHS) {
  const out = [];
  const page = await browser.newPage();
  try {
    for (const width of widths) {
      await page.setViewport({ width, height: 800, isMobile: true, hasTouch: true });
      await page.goto(url, { waitUntil: "load" });
      let worst;
      try {
        worst = await page.evaluate(async () => {
        const d = document.documentElement;
        const settle = () => new Promise((r) => { requestAnimationFrame(() => requestAnimationFrame(r)); setTimeout(r, 500); });
        const read = (at) => ({ scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, at });
        let worst = read(0);
        const step = Math.max(1, Math.round(innerHeight / 2));
        for (let y = 0; y <= d.scrollHeight; y += step) {
          window.scrollTo({ top: y, behavior: "instant" });
          await settle();
          const m = read(Math.min(y, d.scrollHeight));
          if (m.scrollWidth > worst.scrollWidth) worst = m;
        }
        return worst;
        });
      } catch (e) {
        if (/Execution context was destroyed/.test(e.message) && page.url() !== url) continue; // the page redirected itself (meta refresh)
        throw e;
      }
      out.push({ width, worst });
    }
  } finally { await page.close(); }
  return out;
}

export const id = "a11y";
/** Findings are named after axe rule ids (a11y/<rule>). This list is the subset the bylaws may cite; "chrome" is the tooling failure. */
export const checks = [
  "chrome",
  "aria-allowed-attr", "autocomplete-valid", "button-name", "bypass", "color-contrast", "heading-order", "image-alt",
  "label", "landmark-one-main", "landmark-unique", "link-in-text-block", "link-name", "page-has-heading-one", "region",
  "tabindex", "target-size", "th-has-data-cells", "reflow",
];

/** How many pages are checked at once on the shared browser, and the ceiling for one page's checks. */
export const CONCURRENCY = 4;
export const PAGE_TIMEOUT = 90000;

const withTimeout = (promise, ms, what) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`${what} did not finish within ${ms / 1000} s`)), ms).unref?.())]);

/** axe via pa11y plus the reflow stepping on every page, on one shared browser; a page whose tooling fails or stalls becomes an a11y/chrome finding instead of a hung run. */
export async function run(ctx) {
  const executablePath = chromePath();
  if (!executablePath) return { id, ok: false, findings: [{ file: "-", message: "Chrome not found; set CHROME_PATH", check: "a11y/chrome" }], report: [] };
  // --sample (development): one page per page type and locale; the full sweep stays the pre-delivery run (R-GATE-09).
  const all = ctx.sample ? samplePages(pages(ctx), ctx.site || { defaultLocale: "", locales: [] }) : pages(ctx);
  const redirects = new Set(all.filter((p) => /<meta http-equiv="refresh"/i.test(readFileSync(p.file, "utf8"))).map((p) => p.url));
  const urls = all.map((p) => p.url);
  const results = new Array(urls.length);
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  let next = 0, done = 0;
  const checkPage = async (url) => {
    const r = { url, issues: 0, review: [], findings: [] };
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1280, height: 1024 });
      // axe sees final states: with reduced motion the pending: entrance state never applies, so content below the fold is checked at full opacity instead of being skipped as invisible (R-GATE-09, R-MOT-05). Reflow below keeps motion, since an offset entrance could widen the page.
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      await page.goto(url, { waitUntil: "load", timeout: 60000 });
      await page.evaluate(AXE_SOURCE);
      const result = await page.evaluate(async (tags) => await axe.run(document, { runOnly: { type: "tag", values: tags }, rules: { "target-size": { enabled: true } }, resultTypes: ["violations", "incomplete"] }), AXE_TAGS);
      // Every violation is a finding whatever its impact; axe's "incomplete" results go to a human.
      for (const [list, kind] of [[result.violations, "findings"], [result.incomplete, "review"]]) {
        for (const v of list) for (const n of v.nodes) {
          const d = n.any?.[0]?.data;
          const detail = d?.fgColor && d?.bgColor ? ` [${d.fgColor} on ${d.bgColor} = ${d.contrastRatio}, needs ${d.expectedContrastRatio}]` : d?.messageKey ? ` [${d.messageKey}]` : "";
          r[kind].push({ file: url, message: `${v.help}${detail} (${n.target.join(" ")})`, check: `a11y/${v.id}` });
        }
      }
      r.issues = r.findings.length;
    } finally { await page.close(); }
    // Reflow (R-LAY-05): the document must never be wider than the viewport at 320 and 375 px, at any scroll position.
    for (const { width, worst: m } of await reflowOf(browser, url, ctx.reflowWidths)) {
      if (m.scrollWidth > m.clientWidth + 1) r.findings.push({ file: url, message: `at ${width} px the document is ${m.scrollWidth} px wide (viewport ${m.clientWidth}) after scrolling ${m.at} px`, check: "a11y/reflow" });
    }
    return r;
  };
  const worker = async () => {
    while (next < urls.length) {
      const i = next++;
      const url = urls[i];
      try {
        results[i] = redirects.has(url) ? { url, issues: 0, review: [], findings: [], skipped: "redirects itself (meta refresh)" } : await withTimeout(checkPage(url), ctx.pageTimeout || PAGE_TIMEOUT, `a11y checks for ${url}`);
      } catch (e) {
        results[i] = { url, issues: 0, review: [], findings: [{ file: url, message: `tooling failed: ${e.message}`, check: "a11y/chrome" }] };
      }
      done++;
      if (done % 25 === 0 || done === urls.length) process.stderr.write(`a11y: ${done}/${urls.length} pages\n`);
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(ctx.concurrency || CONCURRENCY, urls.length) }, worker));
  } finally {
    await browser.close();
  }
  const findings = results.flatMap((r) => r.findings);
  const report = results.map(({ url, issues, review, skipped }) => (skipped ? { url, issues, review, skipped } : { url, issues, review }));
  return { id, ok: findings.length === 0, findings, report };
}
