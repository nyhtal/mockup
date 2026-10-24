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

test("`into` names the key a `from` list or `md` body lands in, and `{e.path|date}` formats a date", () => {
  const entity = { tiers: [{ name: "Starter" }], bio: "Bio", posted: "2026-10-06" };
  const plan = planSections(samples, [{ type: "pricing", from: "e.tiers", into: "tiers" }, { type: "person-bio", md: "e.bio", into: "bio" }, { type: "job-detail", posted: "{e.posted|date}", postedIso: "{e.posted}" }], { ...full, entity });
  assert.deepEqual(plan[0].s.tiers, entity.tiers);
  assert.equal(plan[0].s.items, undefined);
  assert.equal(plan[1].s.bio, "<p>Bio</p>");
  assert.equal(plan[2].s.posted, "D(2026-10-06)");
  assert.equal(plan[2].s.postedIso, "2026-10-06");
});

test("`md` as a map renders several entity fields into named keys", () => {
  const plan = planSections(samples, [{ type: "download-detail", md: { summary: "e.summary", body: "e.body" }, from: "e.contents", into: "contents" }], { ...full, entity: { summary: "S", body: "B", contents: ["a"] } });
  assert.equal(plan[0].s.summary, "<p>S</p>");
  assert.equal(plan[0].s.body, "<p>B</p>");
  assert.deepEqual(plan[0].s.contents, ["a"]);
  assert.equal(plan[0].s.html, undefined);
});

test("a `header` is prepended as a page-header unless the page already opens with a hero or page-header", () => {
  const header = { eyebrow: "Company", title: "About us", lede: "L" };
  const plan = planSections(samples, ["grid"], { ...opts, header });
  assert.deepEqual(plan.map((p) => p.s.type), ["page-header", "feature-grid"]);
  assert.equal(plan[0].s.title, "About us");
  assert.equal(plan[0].ctx.reveal, false);
  assert.deepEqual(planSections(samples, ["hero", "grid"], { ...opts, header }).map((p) => p.s.type), ["hero", "feature-grid"]);
  assert.deepEqual(planSections(samples, [{ type: "page-header", title: "Own" }], { ...opts, header }).map((p) => p.s.title), ["Own"]);
  assert.deepEqual(planSections(samples, [], { ...opts, header }).map((p) => p.s.type), ["page-header"]);
});


test("a site section id that exists in the default locale but not in this locale fails the build instead of falling back to a catalog sample (R-I18N-12)", () => {
  const defaultSiteSections = { grid: { type: "feature-grid", title: "English site grid" } };
  assert.throws(() => planSections(samples, ["grid"], { ...full, siteSections: {}, defaultSiteSections }), /Section "grid" is defined for the default locale but not for "de"/);
  // Catalog sample ids that no locale redefines still resolve.
  assert.equal(planSections(samples, ["hero"], { ...full, siteSections: {}, defaultSiteSections })[0].s.type, "hero");
});

test("opening group (R-LAY-02): a page header joins the plain section after it; strips, bands, own backgrounds, an alternate surface and non-shell sections keep the full header padding", () => {
  const s = { byId: { ...samples.byId, statsBand: { type: "stats" }, statsPlain: { type: "stats", variant: "plain" }, filter: { type: "filter-bar" }, err: { type: "error-state" }, alt: { type: "feature-grid", surface: "bg-surface-alt" } } };
  const flags = (list, o = {}) => planSections(s, list, { ...opts, header: { title: "About" }, ...o }).map((p) => [p.s.type, !!p.ctx.joined, !!p.ctx.opening]);
  assert.deepEqual(flags(["grid", "grid"]), [["page-header", true, false], ["feature-grid", false, true], ["feature-grid", false, false]]);
  assert.deepEqual(flags(["statsPlain"]), [["page-header", true, false], ["stats", false, true]]);
  for (const id of ["filter", "band", "statsBand", "alt", "err"]) assert.deepEqual(flags([id]).map((f) => f.slice(1)), [[false, false], [false, false]], `${id} after a page header`);
  assert.deepEqual(flags([]), [["page-header", false, false]], "a header with nothing after it keeps its padding");
  assert.deepEqual(flags(["filter", "grid"]).map((f) => f.slice(1)), [[false, false], [false, false], [false, false]], "the section after a strip is an ordinary section");
  assert.deepEqual(flags(["hero", "grid"], { header: undefined }).map((f) => f.slice(1)), [[false, false], [false, false]], "a hero page has no opening group");
  // The surfaces are unchanged: the opening section stays on the page surface and the next one alternates.
  assert.deepEqual(planSections(s, ["grid", "grid"], { ...opts, header: { title: "About" } }).map((p) => p.ctx.surface), ["bg-surface", "bg-surface", "bg-surface-alt"]);
});

test("page-header variants (R-SEC-08): a banner or band header with a picture keeps its padding, a split header joins, the variant travels from the header", () => {
  const img = { slug: "h" };
  const flags = (variant) => planSections(samples, ["grid"], { ...opts, header: { title: "About", variant, image: img } }).map((p) => [p.s.variant, !!p.ctx.joined, !!p.ctx.opening]);
  assert.deepEqual(flags("banner")[0], ["banner", false, false]);
  assert.deepEqual(flags("band"), [["band", false, false], [undefined, false, false]]);
  assert.deepEqual(flags("split"), [["split", true, false], [undefined, false, true]]);
  const noImage = planSections(samples, ["grid"], { ...opts, header: { title: "About", variant: "banner" } });
  assert.equal(noImage[0].s.variant, undefined, "a variant without a picture is a plain header");
  assert.equal(noImage[0].ctx.joined, true);
});

test("a search box that opens the page is its header: no page header is added, it takes the page's title and the results' query, and sits on the alternate surface (0.13.0)", () => {
  const s = { byId: { ...samples.byId, sb: { type: "search-box", title: "Search", suggestions: ["a"] }, sr: { type: "search-results", query: "safety", items: [] } } };
  const steps = planSections(s, ["sb", "sr"], { ...opts, header: { eyebrow: "Search", title: "Search", lede: "Find it" } });
  assert.deepEqual(steps.map((p) => p.s.type), ["search-box", "search-results"]);
  assert.deepEqual(steps[0].s.opener, { eyebrow: "Search", title: "Search", lede: "Find it" });
  assert.equal(steps[0].s.query, "safety");
  assert.equal(steps[0].s.surface, "bg-surface-alt");
  assert.equal(steps[1].ctx.surface, "bg-surface", "the results sit on the page surface");
  const inside = planSections(s, ["grid", "sb"], { ...opts, header: { title: "Help" } });
  assert.equal(inside[0].s.type, "page-header", "a search box further down is an ordinary section");
  assert.equal(inside[2].s.opener, undefined);
});

test("brand version (R-SEC-13): a brand bar never joins a page header and restarts the alternation; a contained brand panel joins like a plain section; a brand header keeps its padding", () => {
  const s = { byId: { ...samples.byId, bar: { type: "feature-grid", tone: "brand" }, box: { type: "feature-grid", tone: "brand", frame: "contained" } } };
  const plan = (list, header = { title: "About" }) => planSections(s, list, { ...opts, header });
  const bar = plan(["bar", "grid"]);
  assert.deepEqual(bar.map((p) => [p.s.type, !!p.ctx.joined, !!p.ctx.opening]), [["page-header", false, false], ["feature-grid", false, false], ["feature-grid", false, false]]);
  assert.equal(bar[2].ctx.surface, "bg-surface", "after a brand bar the alternation restarts on the page surface");
  const box = plan(["box"]);
  assert.deepEqual(box.map((p) => [!!p.ctx.joined, !!p.ctx.opening]), [[true, false], [false, true]], "the contained panel sits on the page surface, so it joins");
  const brandHeader = plan(["grid"], { title: "Industries", variant: "brand" });
  assert.equal(brandHeader[0].s.variant, "brand", "a brand header needs no image");
  assert.equal(brandHeader[0].ctx.joined, undefined, "and keeps its padding");
});

test("animate is accepted only on a full-bleed dark backdrop hero with the planes-flow art at comfortable density (Review Focus 5)", () => {
  const img = { slug: "home-backdrop", ratio: "16:9", art: "planes-flow", animate: true };
  assert.equal(planSections(samples, [{ type: "hero", variant: "backdrop", image: img }], opts)[0].s.image.animate, true);
  assert.equal(planSections(samples, [{ type: "hero", variant: "backdrop", image: { ...img, art: undefined } }], opts)[0].s.image.animate, true);
  assert.throws(() => planSections(samples, [{ type: "hero", variant: "split", image: img }], opts), /\/en\/about\/: image "home-backdrop" declares animate/);
  assert.throws(() => planSections(samples, [{ type: "hero", variant: "backdrop", image: { ...img, art: "planes-energy" } }], opts), /declares animate/);
  assert.throws(() => planSections(samples, [{ type: "feature-rows", image: img }], opts), /declares animate/);
  const hero = { type: "hero", variant: "backdrop", image: img };
  assert.throws(() => planSections(samples, [{ ...hero, light: true }], opts), /declares animate/, "the twin is dark only: a light hero would put dark ink over dark art");
  assert.throws(() => planSections(samples, [{ ...hero, image: { ...img, tone: "light" } }], opts), /declares animate/);
  assert.throws(() => planSections(samples, [{ ...hero, inset: true }], opts), /declares animate/, "the pause switch would cover the inset frame's bottom text");
  assert.throws(() => planSections(samples, [hero], { ...opts, density: "compact" }), /declares animate/, "and so would it at compact density");
});
