import { readFileSync } from "node:fs";

/** Page type of a built page, from <body data-page> (base.njk); "generic" when absent. */
export function pageTypeOf(file) {
  return /<body[^>]*\sdata-page="([^"]*)"/.exec(readFileSync(file, "utf8"))?.[1] || "generic";
}

/** Locale folder of a page URL (/de/about/ → "de"), or "" for root pages. */
function localeOf(url, site) {
  const seg = url.replace(/^https?:\/\/[^/]+/, "").split("/")[1] || "";
  return (site.locales || []).includes(seg) ? seg : "";
}

/**
 * Lighthouse page sampling (R-GATE-10): every page in the default locale (and every root page);
 * in each other locale the first page of every page type. Returns the pages to measure and a coverage
 * table naming, per locale and page type, the URL that stood for it.
 */
export function lighthousePages(pages, site) {
  const sampled = [];
  const coverage = [];
  const seen = new Set();
  for (const p of pages) {
    const locale = localeOf(p.url, site);
    const pageType = pageTypeOf(p.file);
    const key = `${locale}:${pageType}`;
    const full = locale === "" || locale === site.defaultLocale;
    if (!full && seen.has(key)) continue;
    if (!seen.has(key)) { seen.add(key); coverage.push({ locale, pageType, url: p.url }); }
    sampled.push({ ...p, locale, pageType });
  }
  return { sampled, coverage };
}
