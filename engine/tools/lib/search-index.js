import { cardOf } from "./entities.js";

/** Entity kinds the site search covers, and the filter group each one falls under. */
export const SEARCH_GROUPS = {
  services: "offer", products: "offer", industries: "offer",
  posts: "articles", press: "articles", cases: "articles",
  jobs: "jobs",
  events: "events",
  downloads: "resources", docs: "resources",
};
export const GROUP_ORDER = ["offer", "articles", "jobs", "events", "resources"];

/** Every searchable entity of a locale as a result: { href, title, excerpt, group }, in a fixed order. */
export function searchIndex(entities, ctx) {
  return Object.entries(SEARCH_GROUPS).flatMap(([kind, group]) =>
    (entities[kind] || []).map((e) => {
      const c = cardOf(kind, e, ctx);
      return { href: c.href, title: c.title || c.name, excerpt: c.text || c.quote || e.excerpt || e.summary || e.description || "", group };
    }));
}

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** HTML-escaped text with every case-insensitive occurrence of the query wrapped in <mark> (the matched term in a result). */
export function markQuery(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;
  return safe.replace(new RegExp(escapeRe(escapeHtml(query)), "giu"), (m) => `<mark class="rounded-sm bg-accent-100 px-0.5 text-ink">${m}</mark>`);
}

/**
 * One page of results: items that match the query come first (stable), then the rest; `perPage` per page.
 * Returns { items (with titleHtml, excerptHtml), total, page, pages, counts: { all, <group>: n } for this page }.
 */
export function searchPage(index, query, page = 1, perPage = 12) {
  const q = (query || "").toLocaleLowerCase();
  const hit = (r) => `${r.title} ${r.excerpt}`.toLocaleLowerCase().includes(q);
  const ordered = q ? [...index.filter(hit), ...index.filter((r) => !hit(r))] : index;
  const pages = Math.max(1, Math.ceil(ordered.length / perPage));
  const items = ordered.slice((page - 1) * perPage, page * perPage).map((r) => ({ ...r, titleHtml: markQuery(r.title, query), excerptHtml: markQuery(r.excerpt, query) }));
  const counts = Object.fromEntries([["all", items.length], ...GROUP_ORDER.map((g) => [g, items.filter((r) => r.group === g).length])]);
  return { items, total: ordered.length, page, pages, counts, groups: GROUP_ORDER };
}
