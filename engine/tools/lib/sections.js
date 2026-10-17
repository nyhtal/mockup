/**
 * Resolve a page's `sections` list into render steps: ids become section data (site sections first, then the
 * catalog samples), `from` lists expand entities into card items, `{e.path}` placeholders read the page's entity,
 * surfaces alternate (R-SEC-06), reveals are marked below the fold (R-SEC-10), and every step carries the page
 * context. Lives in JS because Nunjucks cannot carry state across loop iterations.
 */
import { cardOf, sortEntities } from "./entities.js";

const MEDIA = new Set(["hero", "cta-band", "page-header", "article-meta", "pagination", "filter-bar", "was-this-helpful"]);
const STATIC = new Set(["search-box", "search-results", "person-bio", "download-detail", "event-detail", "job-detail", "prose", "confirmation", "error-state"]);

const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

/** "e.steps" → the entity's list; "posts" → the site's entities of that kind. */
function source(ref, opts) {
  if (typeof ref !== "string") return ref;
  if (ref.startsWith("e.")) return get(opts.entity, ref.slice(2)) || [];
  const list = opts.entities?.[ref];
  if (!list) throw new Error(`Unknown entity source "${ref}"`);
  return sortEntities(ref, list);
}

const matches = (item, filter) => Object.entries(filter).every(([k, v]) => (Array.isArray(item[k]) ? item[k].includes(v) : item[k] === v));

/** Replace "{e.path}" placeholders in strings, recursively, from the page's entity. */
function fill(value, entity) {
  if (typeof value === "string") {
    if (!value.includes("{e.")) return value;
    return value.replace(/\{e\.([\w.]+)\}/g, (_, p) => { const v = get(entity, p); return v == null ? "" : String(v); });
  }
  if (Array.isArray(value)) return value.map((v) => fill(v, entity));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v, entity)]));
  return value;
}

function expand(raw, opts) {
  const s = fill(raw, opts.entity || {});
  if (s.from) {
    const kind = typeof s.from === "string" && !s.from.startsWith("e.") ? s.from : null;
    let list = source(s.from, opts);
    const only = typeof s.only === "string" ? source(s.only, opts) : s.only;
    if (only) list = only.map((slug) => list.find((e) => e.slug === slug)).filter(Boolean);
    if (s.filter) list = list.filter((e) => matches(e, s.filter));
    if (s.limit) list = list.slice(0, s.limit);
    const ctx = { locale: opts.locale, fmt: opts.fmt, site: opts.site };
    s.items = kind ? list.map((e) => cardOf(kind, e, ctx)) : list;
    delete s.from; delete s.only; delete s.filter; delete s.limit;
  }
  if (s.md) {
    const text = s.md.startsWith("e.") ? get(opts.entity, s.md.slice(2)) : s.md;
    s.html = opts.md ? opts.md(text || "") : text;
    if (s.toc === true) s.toc = opts.toc ? opts.toc(text || "") : [];
    delete s.md;
  }
  return s;
}

export function planSections(samples, sections, opts) {
  const { locale, pageUrl, density, demote = false, breadcrumbs = [], siteSections = {} } = opts;
  let surface = "bg-surface";
  const steps = [];
  for (const item of sections || []) {
    const raw = typeof item === "string" ? siteSections[item] || samples.byId[item] : item;
    if (!raw) throw new Error(`Unknown section id "${item}"`);
    const s = expand(raw, opts);
    if (s.skipEmpty && (!s.items || s.items.length === 0)) continue;
    delete s.skipEmpty;
    const i = steps.length;
    const reveal = i > 0 && !MEDIA.has(s.type) && !STATIC.has(s.type);
    steps.push({ s, ctx: { locale, pageUrl, density: density || "comfortable", surface, reveal, index: i, demote: !!demote, breadcrumbs } });
    if (MEDIA.has(s.type)) surface = "bg-surface";
    else if (!s.surface) surface = surface === "bg-surface" ? "bg-surface-alt" : "bg-surface";
  }
  return steps;
}

/** Public: fill "{e.path}" placeholders in a recipe string (undefined stays undefined). */
export function fillPlaceholders(value, entity) {
  return value == null ? value : fill(value, entity || {});
}
