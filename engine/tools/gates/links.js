import { LinkChecker } from "linkinator";
import { pageUrls } from "../lib/browser.js";

export const id = "links";

/** Crawl from every page: broken internal links fail; external links fail unless allow-listed. */
export async function run(ctx) {
  const base = ctx.baseUrl;
  const allowed = new Set(ctx.site?.allowedExternal || []);
  const checker = new LinkChecker();
  const result = await checker.check({
    path: pageUrls(ctx),
    recurse: true,
    linksToSkip: async (url) => !url.startsWith(base),
  });
  const findings = [];
  for (const link of result.links) {
    const external = !link.url.startsWith(base);
    if (external && !allowed.has(link.url)) findings.push({ file: link.parent, message: `external link ${link.url}`, check: "links/external" });
    else if (!external && link.state === "BROKEN") findings.push({ file: link.parent, message: `${link.url} → ${link.status}`, check: "links/broken" });
  }
  return { id, ok: findings.length === 0, findings, report: { scanned: result.links.length } };
}
