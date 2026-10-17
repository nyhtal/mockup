/**
 * Resolve a page's `sections` list into render steps: sample ids become section data, surfaces alternate
 * (R-SEC-06), reveals are marked below the fold (R-SEC-10), and every step carries the page context.
 * Lives in JS because Nunjucks cannot carry state across loop iterations.
 */
const MEDIA = new Set(["hero", "cta-band", "page-header", "article-meta", "pagination", "filter-bar", "was-this-helpful"]);
const STATIC = new Set(["search-box", "search-results", "person-bio", "download-detail", "event-detail", "job-detail", "prose", "confirmation", "error-state"]);

export function planSections(samples, sections, { locale, pageUrl, density, demote = false, breadcrumbs = [] }) {
  let surface = "bg-surface";
  return (sections || []).map((item, i) => {
    const s = typeof item === "string" ? samples.byId[item] : item;
    if (!s) throw new Error(`Unknown sample section id "${item}"`);
    const reveal = i > 0 && !MEDIA.has(s.type) && !STATIC.has(s.type);
    const step = { s, ctx: { locale, pageUrl, density: density || "comfortable", surface, reveal, index: i, demote: !!demote, breadcrumbs } };
    if (MEDIA.has(s.type)) surface = "bg-surface";
    else if (!s.surface) surface = surface === "bg-surface" ? "bg-surface-alt" : "bg-surface";
    return step;
  });
}
