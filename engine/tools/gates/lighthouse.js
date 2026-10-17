import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import * as chromeLauncher from "chrome-launcher";
import { chromePath, pageUrls } from "../lib/browser.js";

export const id = "lighthouse";
export const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

/**
 * Lighthouse 13 via its Node API. Mobile = default config (simulated throttling);
 * desktop = bundled desktop config. Median of ctx.runs (default 5) per URL and profile.
 */
export async function run(ctx) {
  const runs = ctx.runs || 5;
  const profiles = ctx.profiles || ["mobile", "desktop"];
  const findings = [];
  const report = [];
  const chrome = await chromeLauncher.launch({ chromePath: chromePath() || undefined, chromeFlags: ["--headless=new", "--no-first-run"] });
  try {
    for (const url of pageUrls(ctx)) {
      for (const profile of profiles) {
        const samples = Object.fromEntries(CATEGORIES.map((c) => [c, []]));
        for (let i = 0; i < runs; i++) {
          const { lhr } = await lighthouse(url, { port: chrome.port, output: "json", onlyCategories: CATEGORIES, logLevel: "silent" }, profile === "desktop" ? desktopConfig : undefined);
          for (const c of CATEGORIES) samples[c].push(Math.round((lhr.categories[c].score ?? 0) * 100));
        }
        const scores = Object.fromEntries(CATEGORIES.map((c) => [c, median(samples[c])]));
        report.push({ url, profile, scores, runs });
        for (const c of CATEGORIES) if (scores[c] < 100) findings.push({ file: url, message: `${profile} ${c} median ${scores[c]}/100 over ${runs} run(s)`, check: `lighthouse/${profile}/${c}` });
      }
    }
  } finally {
    await chrome.kill();
  }
  return { id, ok: findings.length === 0, findings, report };
}
