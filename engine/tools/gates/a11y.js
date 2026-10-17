import pa11y from "pa11y";
import { chromePath, pageUrls } from "../lib/browser.js";

export const id = "a11y";
/** Findings are named after axe rule ids (a11y/<rule>). This list is the subset the bylaws may cite; "chrome" is the tooling failure. */
export const checks = [
  "chrome",
  "aria-allowed-attr", "autocomplete-valid", "button-name", "bypass", "color-contrast", "heading-order", "image-alt",
  "label", "landmark-one-main", "landmark-unique", "link-in-text-block", "link-name", "page-has-heading-one", "region",
  "tabindex", "target-size", "th-has-data-cells",
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
  return { id, ok: findings.length === 0, findings, report };
}
