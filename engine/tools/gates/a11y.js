import pa11y from "pa11y";
import puppeteer from "puppeteer";
import { chromePath, pageUrls } from "../lib/browser.js";

/** Widths at which no page may scroll horizontally (R-LAY-05): the smallest supported phone and the common one. */
export const REFLOW_WIDTHS = [320, 375];

/** Document and viewport widths at the top and the bottom of a page, per width. */
export async function reflowOf(browser, url, widths = REFLOW_WIDTHS) {
  const out = [];
  const page = await browser.newPage();
  try {
    for (const width of widths) {
      await page.setViewport({ width, height: 800, isMobile: true, hasTouch: true });
      await page.goto(url, { waitUntil: "load" });
      const top = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await new Promise((r) => setTimeout(r, 150));
      const bottom = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
      out.push({ width, top, bottom });
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

/** axe-core via pa11y on every page; every violation is a finding, every "incomplete" result is listed for review. */
export async function run(ctx) {
  const findings = [];
  const report = [];
  const executablePath = chromePath();
  if (!executablePath) return { id, ok: false, findings: [{ file: "-", message: "Chrome not found; set CHROME_PATH", check: "a11y/chrome" }], report };
  for (const url of pageUrls(ctx)) {
    const result = await pa11y(url, {
      runners: ["axe"],
      standard: "WCAG2AA",
      // pa11y maps axe impact to error/warning/notice; all three are violations, so keep them all.
      includeWarnings: true,
      includeNotices: true,
      // pa11y's WCAG2AA tag set stops at WCAG 2.1; add the 2.2 rules axe ships by id.
      rules: ["target-size"],
      chromeLaunchConfig: { executablePath, args: ["--headless=new", "--no-sandbox"] },
    });
    const review = [];
    for (const issue of result.issues) {
      const entry = { file: url, message: `${issue.message} (${issue.selector})`, check: `a11y/${issue.code}` };
      // Only axe "incomplete" results (needsFurtherReview) go to a human; impact level never downgrades a violation.
      if (issue.runnerExtras?.needsFurtherReview) review.push(entry);
      else findings.push(entry);
    }
    report.push({ url, issues: result.issues.length - review.length, review });
  }
  // Reflow (R-LAY-05): the document must not be wider than the viewport at 320 and 375 px, at the top and the bottom.
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  try {
    for (const url of pageUrls(ctx)) {
      for (const { width, top, bottom } of await reflowOf(browser, url, ctx.reflowWidths)) {
        for (const [where, m] of [["top", top], ["bottom", bottom]]) {
          if (m.scrollWidth > m.clientWidth + 1) findings.push({ file: url, message: `at ${width} px the document is ${m.scrollWidth} px wide (viewport ${m.clientWidth}) at the ${where}`, check: "a11y/reflow" });
        }
      }
    }
  } finally { await browser.close(); }
  return { id, ok: findings.length === 0, findings, report };
}
