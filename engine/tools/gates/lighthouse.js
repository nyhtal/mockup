import { readFileSync } from "node:fs";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import * as chromeLauncher from "chrome-launcher";
import { chromePath, pages } from "../lib/browser.js";

export const id = "lighthouse";
export const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];
export const checks = ["mobile/performance", "mobile/accessibility", "mobile/best-practices", "mobile/seo", "desktop/performance", "desktop/accessibility", "desktop/best-practices", "desktop/seo", "runtime"];

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

/** A page that opts out of indexing cannot pass Lighthouse's is-crawlable audit; SEO is not scored for it. */
export function isNoindex(file) {
  return /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(readFileSync(file, "utf8"));
}

function describeThrottling(settings) {
  const t = settings.throttling || {};
  return `${settings.throttlingMethod} (${t.rttMs}ms RTT, ${(t.throughputKbps / 1000).toFixed(1)}Mbps, ${t.cpuSlowdownMultiplier}x CPU)`;
}

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
    for (const { file, url } of pages(ctx)) {
      const noindex = isNoindex(file);
      const categories = noindex ? CATEGORIES.filter((c) => c !== "seo") : CATEGORIES;
      for (const profile of profiles) {
        const samples = Object.fromEntries(categories.map((c) => [c, []]));
        let chromeVersion = "", throttling = "";
        for (let i = 0; i < runs; i++) {
          const { lhr } = await lighthouse(url, { port: chrome.port, output: "json", onlyCategories: categories, logLevel: "silent" }, profile === "desktop" ? desktopConfig : undefined);
          if (lhr.runtimeError) { findings.push({ file: url, message: `${profile} run ${i + 1}: ${lhr.runtimeError.code} ${lhr.runtimeError.message}`, check: "lighthouse/runtime" }); continue; }
          chromeVersion ||= /Chrome\/([\d.]+)/.exec(lhr.environment?.hostUserAgent || "")?.[1] || "unknown";
          throttling ||= describeThrottling(lhr.configSettings);
          for (const c of categories) samples[c].push(Math.round((lhr.categories[c].score ?? 0) * 100));
        }
        const scores = Object.fromEntries(categories.map((c) => [c, samples[c].length ? median(samples[c]) : 0]));
        if (noindex) scores.seo = "n/a (noindex)";
        report.push({ url, profile, scores, runs, chrome: chromeVersion, throttling });
        for (const c of categories) if (scores[c] < 100) findings.push({ file: url, message: `${profile} ${c} median ${scores[c]}/100 over ${runs} run(s)`, check: `lighthouse/${profile}/${c}` });
      }
    }
  } finally {
    await chrome.kill();
  }
  return { id, ok: findings.length === 0, findings, report };
}
