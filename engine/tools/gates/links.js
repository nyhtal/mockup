import { LinkChecker } from "linkinator";
import { pageUrls } from "../lib/browser.js";

export const id = "links";
export const checks = ["broken", "external"];

/**
 * internal: served by this site (localhost base) or an absolute URL on the site's own origin.
 * scheme:   mailto:/tel:/sms:/geo: links, which are not web requests and never leave the page.
 * external: anything else.
 */
export function classifyLink(url, base, own) {
  if (/^(mailto|tel|sms|geo):/i.test(url)) return "scheme";
  if (url.startsWith(base) || (own && url.startsWith(own))) return "internal";
  return "external";
}

/** Crawl from every page: broken internal links fail; external links fail unless allow-listed (R-HTML-16, R-SEO-13). */
export async function run(ctx) {
  const base = ctx.baseUrl;
  const own = ctx.site?.url; // absolute URLs on the site's own origin (canonical, hreflang, JSON-LD) are internal
  const allowed = new Set(ctx.site?.allowedExternal || []);
  const checker = new LinkChecker();
  const result = await checker.check({
    path: pageUrls(ctx),
    recurse: true,
    linksToSkip: async (url) => !url.startsWith(base),
  });
  const findings = [];
  for (const link of result.links) {
    const kind = classifyLink(link.url, base, own);
    if (kind === "external" && !allowed.has(link.url)) findings.push({ file: link.parent, message: `external link ${link.url}`, check: "links/external" });
    else if (kind === "internal" && link.url.startsWith(base) && link.state === "BROKEN") findings.push({ file: link.parent, message: `${link.url} → ${link.status}`, check: "links/broken" });
  }
  return { id, ok: findings.length === 0, findings, report: { scanned: result.links.length } };
}
