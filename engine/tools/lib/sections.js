/**
 * Resolve a page's `sections` list into render steps: ids become section data (site sections first, then the
 * catalog samples), `from` lists expand entities into card items, `{e.path}` placeholders read the page's entity,
 * surfaces alternate (R-SEC-06), reveals are marked below the fold (R-SEC-10), and every step carries the page
 * context. Lives in JS because Nunjucks cannot carry state across loop iterations.
 */
import { cardOf, sortEntities } from "./entities.js";
import { flairFor } from "./theme.js";

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

/** Replace "{e.path}" and "{e.path|date}" placeholders in strings, recursively, from the page's entity. */
function fill(value, entity, fmt) {
  if (typeof value === "string") {
    if (!value.includes("{e.")) return value;
    return value.replace(/\{e\.([\w.]+)(?:\|(\w+))?\}/g, (_, p, f) => {
      const v = get(entity, p);
      if (v == null) return "";
      return f && fmt?.[f] ? fmt[f](v) : String(v);
    });
  }
  if (Array.isArray(value)) return value.map((v) => fill(v, entity, fmt));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v, entity, fmt)]));
  return value;
}

function expand(raw, opts) {
  const s = fill(raw, opts.entity || {}, opts.fmt);
  const into = s.into;
  delete s.into;
  if (s.from) {
    const kind = typeof s.from === "string" && !s.from.startsWith("e.") ? s.from : null;
    let list = source(s.from, opts);
    const only = typeof s.only === "string" ? source(s.only, opts) : s.only;
    if (only) list = only.map((slug) => list.find((e) => e.slug === slug)).filter(Boolean);
    if (s.filter) list = list.filter((e) => matches(e, s.filter));
    if (s.limit) list = list.slice(0, s.limit);
    const ctx = { locale: opts.locale, fmt: opts.fmt, site: opts.site };
    s[into || "items"] = kind ? list.map((e) => cardOf(kind, e, ctx)) : list;
    delete s.from; delete s.only; delete s.filter; delete s.limit;
  }
  if (s.md) {
    // "e.body" renders into `into` (default html); a map { key: "e.field" } renders several fields.
    const render = (ref) => { const text = typeof ref === "string" && ref.startsWith("e.") ? get(opts.entity, ref.slice(2)) : ref; return [text || "", opts.md ? opts.md(text || "") : text]; };
    if (typeof s.md === "string") {
      const [text, html] = render(s.md);
      s[into || "html"] = html;
      if (s.toc === true) s.toc = opts.toc ? opts.toc(text) : [];
    } else {
      for (const [key, ref] of Object.entries(s.md)) s[key] = render(ref)[1];
    }
    delete s.md;
  }
  return s;
}

export function planSections(samples, sections, opts) {
  const { locale, pageUrl, density, motion, demote = false, breadcrumbs = [], siteSections = {}, defaultSiteSections, header } = opts;
  const flair = flairFor(motion);
  let surface = "bg-surface";
  const steps = [];
  const list = [...(sections || [])];
  // Non-home pages open with a page-header (R-SEC-08): prepend one from the page's title unless the page brings its own opener.
  if (header) {
    const first = typeof list[0] === "string" ? siteSections[list[0]] || samples.byId[list[0]] : list[0];
    if (!first || !["hero", "page-header"].includes(first.type)) list.unshift({ type: "page-header", eyebrow: header.eyebrow, title: header.title, lede: header.lede });
  }
  for (const item of list) {
    // A site section the default locale defines must exist in this locale too: no silent fallback to English sample copy (R-I18N-12).
    if (typeof item === "string" && defaultSiteSections && !siteSections[item] && defaultSiteSections[item]) throw new Error(`Section "${item}" is defined for the default locale but not for "${locale}"`);
    const raw = typeof item === "string" ? siteSections[item] || samples.byId[item] : item;
    if (!raw) throw new Error(`Unknown section id "${item}"`);
    const s = expand(raw, opts);
    if (s.skipEmpty && (!s[s.skipEmpty === true ? "items" : s.skipEmpty] || s[s.skipEmpty === true ? "items" : s.skipEmpty].length === 0)) continue;
    delete s.skipEmpty;
    const i = steps.length;
    const reveal = i > 0 && !MEDIA.has(s.type) && !STATIC.has(s.type);
    steps.push({ s, ctx: { locale, pageUrl, density: density || "comfortable", surface, reveal, index: i, demote: !!demote, breadcrumbs, flair } });
    if (MEDIA.has(s.type)) surface = "bg-surface";
    else if (!s.surface) surface = surface === "bg-surface" ? "bg-surface-alt" : "bg-surface";
  }
  return steps;
}

/** Public: fill "{e.path}" placeholders in a recipe string (undefined stays undefined). */
export function fillPlaceholders(value, entity, fmt) {
  return value == null ? value : fill(value, entity || {}, fmt);
}
