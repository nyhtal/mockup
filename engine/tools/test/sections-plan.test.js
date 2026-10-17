import { test } from "node:test";
import assert from "node:assert/strict";
import { planSections } from "../lib/sections.js";

const samples = { byId: { hero: { id: "hero", type: "hero" }, grid: { id: "grid", type: "feature-grid" }, band: { id: "band", type: "cta-band" } } };
const opts = { locale: "en", pageUrl: "/en/about/", density: "comfortable", breadcrumbs: [{ name: "Home", url: "/en/" }, { name: "About", url: "/en/about/" }] };

test("ids resolve to samples and unknown ids fail loudly", () => {
  assert.equal(planSections(samples, ["hero"], opts)[0].s.type, "hero");
  assert.throws(() => planSections(samples, ["nope"], opts), /Unknown section id "nope"/);
});

test("surfaces alternate after non-media sections and reset after media sections; the first section never reveals", () => {
  const plan = planSections(samples, ["hero", "grid", { type: "feature-grid" }, "band", "grid"], opts);
  assert.deepEqual(plan.map((p) => p.ctx.surface), ["bg-surface", "bg-surface", "bg-surface-alt", "bg-surface", "bg-surface"]);
  assert.deepEqual(plan.map((p) => p.ctx.reveal), [false, true, true, false, true]);
});

test("every section's ctx carries the page's breadcrumbs, locale, url, density and demote flag", () => {
  const [step] = planSections(samples, ["grid"], { ...opts, demote: true });
  assert.deepEqual(step.ctx.breadcrumbs, opts.breadcrumbs);
  assert.equal(step.ctx.locale, "en");
  assert.equal(step.ctx.pageUrl, "/en/about/");
  assert.equal(step.ctx.demote, true);
});

const site = { name: "Northwind", url: "https://example.com", defaultLocale: "en", locales: ["en", "de"] };
const entities = {
  services: [{ slug: "a", title: "A", lede: "LA", icon: "cpu" }, { slug: "b", title: "B", lede: "LB", icon: "zap" }],
  posts: [{ slug: "old", title: "Old", excerpt: "x", date: "2026-01-01", tags: ["ops"] }, { slug: "new", title: "New", excerpt: "y", date: "2026-10-03", tags: ["eng", "ops"] }, { slug: "mid", title: "Mid", excerpt: "z", date: "2026-05-05", tags: ["eng"] }],
  testimonials: [{ quote: "Q1", name: "N1" }, { quote: "Q2", name: "N2" }],
};
const siteSections = { "hero-home": { type: "hero", variant: "centered", title: "Site hero" }, grid: { type: "feature-grid", title: "Site grid wins over the sample" } };
const full = { ...opts, locale: "de", siteSections, entities, site, fmt: { date: (iso) => `D(${iso})` }, md: (s) => `<p>${s}</p>` };

test("site section ids win over sample ids; `from` expands entities into cards with locale hrefs; limit, filter and only apply", () => {
  const plan = planSections(samples, ["hero-home", "grid", { type: "service-cards", title: "S", from: "services" }, { type: "article-cards", from: "posts", limit: 2 }, { type: "article-cards", from: "posts", filter: { tags: "eng" } }, { type: "service-cards", from: "services", only: ["b"] }, { type: "testimonials", from: "testimonials" }], full);
  assert.equal(plan[0].s.title, "Site hero");
  assert.equal(plan[1].s.title, "Site grid wins over the sample");
  assert.deepEqual(plan[2].s.items.map((i) => i.href), ["/de/services/a/", "/de/services/b/"]);
  assert.equal(plan[2].s.items[0].text, "LA");
  // posts: newest first, then limited
  assert.deepEqual(plan[3].s.items.map((i) => i.title), ["New", "Mid"]);
  assert.equal(plan[3].s.items[0].date, "D(2026-10-03)");
  assert.deepEqual(plan[4].s.items.map((i) => i.title), ["New", "Mid"]);
  assert.deepEqual(plan[5].s.items.map((i) => i.title), ["B"]);
  assert.deepEqual(plan[6].s.items, entities.testimonials);
  assert.throws(() => planSections(samples, [{ type: "x", from: "nope" }], full), /Unknown entity source "nope"/);
});

test("`{e.path}` placeholders, `from: e.<list>` and `md: e.<field>` read from the page's entity", () => {
  const entity = { title: "Line automation", body: "Body text", steps: [{ title: "One" }, { title: "Two" }], faq: [], related: ["b"] };
  const plan = planSections(samples, [{ type: "page-header", title: "{e.title}", lede: "About {e.title} today" }, { type: "steps", from: "e.steps" }, { type: "prose", md: "e.body", toc: true }, { type: "related-items", from: "services", only: "e.related" }], { ...full, entity });
  assert.equal(plan[0].s.title, "Line automation");
  assert.equal(plan[0].s.lede, "About Line automation today");
  assert.deepEqual(plan[1].s.items, entity.steps);
  assert.equal(plan[2].s.html, "<p>Body text</p>");
  assert.deepEqual(plan[2].s.toc, []);
  assert.deepEqual(plan[3].s.items.map((i) => i.title), ["B"]);
});

test("a section whose `from` list is empty is dropped when it declares `skipEmpty`", () => {
  const plan = planSections(samples, [{ type: "faq", from: "e.faq", skipEmpty: true }, { type: "hero", title: "H" }], { ...full, entity: { faq: [] } });
  assert.deepEqual(plan.map((p) => p.s.type), ["hero"]);
});
