import pa11y from "pa11y";
import { chromePath, pageUrls } from "../lib/browser.js";

export const id = "a11y";

/** axe-core via pa11y on every page; every issue is a finding. */
export async function run(ctx) {
  const findings = [];
  const report = [];
  const executablePath = chromePath();
  if (!executablePath) return { id, ok: false, findings: [{ file: "-", message: "Chrome not found; set CHROME_PATH", check: "a11y/chrome" }], report };
  for (const url of pageUrls(ctx)) {
    const result = await pa11y(url, {
      runners: ["axe"],
      standard: "WCAG2AA",
      includeWarnings: true,
      chromeLaunchConfig: { executablePath, args: ["--headless=new", "--no-sandbox"] },
    });
    report.push({ url, issues: result.issues.length });
    for (const issue of result.issues) {
      findings.push({ file: url, message: `${issue.message} (${issue.selector})`, check: `a11y/${issue.code}` });
    }
  }
  return { id, ok: findings.length === 0, findings, report };
}
