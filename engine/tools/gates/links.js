import { LinkChecker } from "linkinator";
import { pageUrls } from "../lib/browser.js";

export const id = "links";

/** Crawl from every page: broken internal links fail; external links fail unless allow-listed. */
export async function run(ctx) {
  const base = ctx.baseUrl;
  const own = ctx.site?.url; // absolute URLs on the site's own origin (canonical, hreflang, JSON-LD) are internal
  const internal = (url) => url.startsWith(base) || (own && url.startsWith(own));
  const allowed = new Set(ctx.site?.allowedExternal || []);
  const checker = new LinkChecker();
  const result = await checker.check({
    path: pageUrls(ctx),
    recurse: true,
    linksToSkip: async (url) => !url.startsWith(base),
  });
  const findings = [];
  for (const link of result.links) {
    if (!internal(link.url)) { if (!allowed.has(link.url)) findings.push({ file: link.parent, message: `external link ${link.url}`, check: "links/external" }); continue; }
    if (link.url.startsWith(base) && link.state === "BROKEN") findings.push({ file: link.parent, message: `${link.url} → ${link.status}`, check: "links/broken" });
  }
  return { id, ok: findings.length === 0, findings, report: { scanned: result.links.length } };
}
