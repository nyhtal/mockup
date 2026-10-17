# Mockup Engine Phase 4 Implementation Plan (reference site in en, de, ar)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `sites/reference/` as Northwind Dynamics in three locales (en default, de, ar) with every core and optional page type of bylaw 09, so that every gate is green across all pages and the engine is proven on LTR, text expansion and RTL.

**Architecture:** Copy lives in data, not pages. Each locale has `sites/reference/data/<locale>/entities.json` (services, products, industries, people, offices, jobs, events, downloads, posts, press, cases, docs, faq, glossary, help, testimonials, customers, integrations, values, benefits, awards, badges, timeline, stats) and `pages.json` (per page type: title, description, lede, section list). Eleventy pagination templates in `sites/reference/content/<locale>/` generate detail pages from entities; index pages compose sections from the same data through a `siteSections` resolver that extends the engine's samples. Legal pages and posts carry prose as markdown in the data. UI strings come from a per-site locale overlay merged over the engine's `i18n/<locale>.json`.

**Tech Stack:** Eleventy 3 pagination (`pagination: { data, size: 1, alias }` with `permalink` from data), existing catalog and gates, `@fontsource-variable/noto-sans-arabic` for `ar`.

**Spec:** `docs/superpowers/specs/2026-10-17-mockup-engine-design.md`; bylaws `engine/bylaws/09-pages.md`, `11-i18n.md`, `13-schema.md`, `10-content.md` are the binding inventories.

## Global Constraints

- Pages contain no markup: front matter and data only (R-SEC-12, R-PREC-06). Prose bodies are markdown in data rendered through the `prose` section.
- Every page exists in every locale (R-I18N-01); locale-specific legal pages (`imprint` for `de`) are declared in `site.json` `localeOnly` and exempted from coverage.
- Shared slugs across locales (R-PAGE-02 default); no translated slugs in this phase.
- UI strings only via `t`; content copy only in `data/<locale>/`; `i18n/keys` must pass for `de` and `ar` (R-I18N-05, R-I18N-12).
- All copy is fictional, plausible and respects the limits in R-TYPO-07, R-SEC-03, R-SEC-04, R-CONT-08 (title ≤ 60, description 120–155 in every locale).
- Arabic pages: `dir="rtl"`, Noto Sans Arabic subset shipped and preloaded, `leading-loose` on prose, Latin digits (R-I18N-07 default).
- Lighthouse coverage rule (new, R-GATE-10): every page in the default locale, every page type once in each other locale; medians of 5 runs; coverage listed in the report. Every other gate runs on every page.
- Commit at the end of every task on branch `mockup-engine`.

## Review Focus

1. A German string 35 % longer than English in a button, nav item or badge must not truncate or overflow its container (Task 5: manual check at 320 px, recorded; plus the `meta-length`/consistency gates).
2. An Arabic page must preload the Arabic font file and count it in the budget, not the Latin one, and `rtl:` icon flips must apply (Task 2 test for per-page preload; Task 5 manual RTL check).
3. A page type missing in `de` or `ar` must fail the build naming the page (existing coverage check; Task 4 verifies with a deliberately removed page).
4. Entity-generated detail pages must emit the right schema contract (JobPosting with datePosted/validThrough, Event with startDate, BlogPosting with author/datePublished) and a BreadcrumbList that matches the visible breadcrumb (Task 3 schema-json tests per type).
5. The Lighthouse sampling must never silently skip a page type: the report must list every page type with the URL it was measured on, per locale (Task 1 test on the sampler).

---

## File structure

```
engine/tools/lib/sampling.js              lighthousePages(pages, site) → sampled list + coverage table
engine/tools/gates/lighthouse.js          uses sampling; report.coverage
engine/tools/lib/site.js                  loadSite also loads data/<locale>/{entities,pages}.json and site i18n overlay
eleventy.config.js                        siteData global, entity collections per locale, sections resolver (site ids then engine samples), per-page fontPreload, feed/search/sitemap-page/thank-you virtual pages
engine/bylaws/19-quality-gates.md         R-GATE-10 sampling rule
engine/i18n/de.json, ar.json              engine UI strings
sites/reference/site.json                 locales [en,de,ar], nav, footer, legal, localeOnly, hasSearch, allowedExternal
sites/reference/i18n/{en,de,ar}.json      site-specific UI strings (nav labels, footer columns, CTA)
sites/reference/data/<locale>/entities.json
sites/reference/data/<locale>/pages.json
sites/reference/content/<locale>/*.md     one file per singular page (front matter only)
sites/reference/content/<locale>/_detail/*.njk   pagination templates: services, products, industries, team, offices, jobs, events, downloads, posts, press, cases, docs, tags, authors
sites/reference/DECISIONS.md              site overrides and the fictional-content statement
engine/tools/test/{sampling,site-data,schema-json}.test.js
```

Data shapes (identical in every locale; only values differ):

```jsonc
// entities.json
{
  "services": [{ "slug": "line-automation", "title": "…", "lede": "…", "icon": "cpu", "summary": "…", "body": "markdown", "steps": [...], "stats": [...], "faq": [...], "related": ["plant-programmes"] }],
  "products": [{ "slug", "title", "lede", "image": {slug, ratio, alt}, "features": [...], "pricing": {...}, "faq": [...] }],
  "industries": [{ "slug", "title", "lede", "icon", "body", "cases": ["alder-foods"] }],
  "people": [{ "slug", "name", "role", "bio": "markdown", "posts": true }],
  "offices": [{ "slug", "city", "address", "phone", "email", "hours": [[...]], "map": {slug} }],
  "jobs": [{ "slug", "title", "team", "location", "employment", "posted": "2026-10-06", "validThrough": "2026-12-31", "body": "markdown" }],
  "events": [{ "slug", "title", "date": "2026-11-12", "time", "location", "format", "body", "speakers": ["mei-chen"] }],
  "downloads": [{ "slug", "title", "fileType", "pages", "summary", "contents": [...], "gated": true }],
  "posts": [{ "slug", "title", "eyebrow", "date", "author": "priya-natarajan", "tags": ["engineering"], "excerpt", "body": "markdown", "toc": [...] }],
  "press": [{ "slug", "title", "date", "excerpt", "body" }],
  "cases": [{ "slug", "company", "title", "metricValue", "metricLabel", "quote", "body", "stats": [...], "industry": "food" }],
  "docs": [{ "slug", "title", "category", "body", "toc" }],
  "faqGroups": [...], "glossary": [...], "helpCategories": [...], "testimonials": [...], "customers": [...], "integrations": [...],
  "values": [...], "benefits": [...], "awards": [...], "badges": [...], "timeline": [...], "stats": [...], "tags": [{ "slug", "label" }]
}
// pages.json: { "<pageType>": { "title", "description", "eyebrow", "lede", "sections": [ "site:hero-home" | { type, … } ] } }
// site section ids ("site:…") are defined in pages.json "sections" map and may reference entities by slug lists.
```

Section resolution order: `site:<id>` → `pages.json.sections[id]`; otherwise engine sample id; otherwise inline object. Entity lists in site sections are expressed as `{ "type": "service-cards", "from": "services" }` or `{ "type": "article-cards", "from": "posts", "limit": 3 }` and expanded by the resolver into card items with locale URLs.

---

### Task 1: Lighthouse sampling and the site data loader

**Files:** `engine/tools/lib/sampling.js`, `engine/tools/lib/site.js`, `engine/tools/gates/lighthouse.js`, `engine/tools/gate.js` (coverage in report), `engine/bylaws/19-quality-gates.md` (R-GATE-10), `engine/tools/test/sampling.test.js`, `engine/tools/test/site-data.test.js`.

**Interfaces:**
- `lighthousePages(pages, { defaultLocale, locales }) → { sampled: [{file,url,locale,pageType}], coverage: [{pageType, locale, url}] }`; `pageType` read from `<body data-page>`; default locale: every page; other locales: first page per `pageType`.
- `loadSite(name)` returns `{ site, siteDir, data: { [locale]: { entities, pages } }, i18n: { [locale]: mergedStrings } }` where site `i18n/<locale>.json` is deep-merged over `engine/i18n/<locale>.json`; missing files are `{}`.

- [ ] Tests: sampler picks all default-locale pages and one per type elsewhere; coverage lists every (type, locale) pair; a type present only in `ar` still appears. Loader merges overlay keys and leaves engine keys intact; missing data folder → empty.
- [ ] Implement; `gate.js` prints "Lighthouse coverage" table; R-GATE-10 updated. Commit `feat(gates): Lighthouse page-type sampling per locale; site data and i18n overlay loading`.

### Task 2: Eleventy: site data, resolver, per-page font preload, engine pages per locale

**Files:** `eleventy.config.js`, `engine/tools/lib/sections.js` (resolver with `site:` ids and `from` expansion), `engine/catalog/virtual/{feed.njk,search.njk,sitemap-page.njk,thank-you.njk}`, `engine/tools/test/sections-plan.test.js`, `engine/tools/test/build.test.js`.

**Interfaces:**
- Global data `siteData[locale]`; collections `entities_<kind>_<locale>`.
- `planSections(samples, sections, opts, siteSections, entities, locale)`: `from` expansion maps entities to card items (`{ title, text: lede|excerpt, href: /<locale>/<index>/<slug>/, image, icon, date, dateIso, … }`), `limit`, `filter: { industry }`.
- `fontPreload` becomes computed per page: Arabic file for `ar` pages, Latin elsewhere (R-I18N-11).
- Virtual pages per locale: `feed.xml` (Atom from posts), `search/` (search-box + static results from pages.json), `sitemap/` (sitemap-list from the inventory), `<form>/thank-you/` for contact, demo, newsletter, gated, registration, application, unsubscribe (noindex, `confirmation` section).

- [ ] Tests: resolver expands `from: posts, limit 3` into three article cards with locale hrefs; `site:` id wins over engine id; unknown `from` throws. Build test: `/ar/` preloads `noto-sans-arabic-arabic-wght-normal.woff2` and `/en/` preloads Inter.
- [ ] Implement. Commit `feat(engine): site data resolver, per-page font preload, feed/search/sitemap/thank-you pages per locale`.

### Task 3: Detail page templates and schema per type

**Files:** `sites/reference/content/en/_detail/*.njk` (13 pagination templates; `de`/`ar` copies in Task 5), `eleventy.config.js` (entity front matter → `entity` for schema: JobPosting, Event, BlogPosting, NewsArticle, Article, Service, Product, Person, Place), `engine/tools/test/schema-json.test.js`.

Each template: front matter `pagination: { data: "siteData.<locale>.entities.<kind>", size: 1, alias: "e" }`, `permalink: "/<locale>/<index>/{{ e.slug }}/index.html"`, `layout: page.njk` or `article.njk`, `pageType`, `eleventyComputed: { title: e.title, description: e.lede|excerpt, entity: {…}, sections: […] }`.

- [ ] Tests per type for the entity node fields (JobPosting datePosted/validThrough/hiringOrganization; Event startDate/location; BlogPosting author ref/datePublished/image; Person worksFor).
- [ ] Implement en templates; build; schema gate green on generated pages. Commit `feat(site): data-driven detail pages for every entity kind (en)`.

### Task 4: English content and singular pages

**Files:** `sites/reference/data/en/entities.json`, `sites/reference/data/en/pages.json`, `sites/reference/content/en/*.md` (home, about, team, history, values, locations, services, products, industries, pricing, partners, customers, resources, blog, downloads, events, faq, glossary, help, news, media-kit, careers, culture, sustainability, trust, contact, demo, newsletter, preferences, unsubscribe, landing, style-guide handled by engine, legal × 5), `sites/reference/site.json` (nav, footer, legal, hasSearch true, errorLinks), `sites/reference/i18n/en.json`, `sites/reference/DECISIONS.md`.

- [ ] Write entities (3 services, 3 products, 3 industries, 4 people, 3 offices, 4 jobs, 3 events, 3 downloads, 3 posts with ~250-word bodies, 3 press releases, 3 case studies, 3 docs, 2 FAQ groups × 4, 8 glossary terms, 3 help categories, 4 testimonials, 6 customers, 4 integrations, 3 values, 4 benefits, 3 awards, 3 badges, 4 timeline, 4 stats, 3 tags) and pages.json for every page type in the inventory (core + optional; modules excluded).
- [ ] Build; offline gates green on all en pages; fix content-limit findings. Commit `feat(site): English reference content, every core and optional page`.

### Task 5: German and Arabic

**Files:** `engine/i18n/de.json`, `engine/i18n/ar.json`, `sites/reference/i18n/{de,ar}.json`, `sites/reference/data/{de,ar}/{entities,pages}.json`, `sites/reference/content/{de,ar}/` (front matter files and `_detail` templates), `sites/reference/site.json` (`locales: ["en","de","ar"]`, `localeOnly: { "legal/imprint": ["de"] }`).

- [ ] Translate UI strings (engine + site) and content; German uses native quotes „…“, Arabic uses Latin digits and `ar` punctuation (،؟).
- [ ] Build; `i18n/keys` and coverage green; manual checks in the browser pane recorded in the ledger: 320 px German nav and buttons; Arabic page direction, mirrored chevrons, Arabic font applied, locale switcher names. Commit `feat(site): German and Arabic content; imprint for de`.

### Task 6: Legal prose, remaining utilities, bylaw and decisions updates

**Files:** legal bodies in `data/<locale>/pages.json` (privacy, cookies, terms, accessibility statement, imprint), `engine/bylaws/19-quality-gates.md`, `engine/DECISIONS.md` (D26 Lighthouse sampling), `engine/CHANGELOG.md` 0.3.0.

- [ ] Write the five legal prose bodies per locale (≤ 400 words each, "Last reviewed" date); accessibility statement names WCAG 2.2 AA and the contact route (R-A11Y-19).
- [ ] Commit `docs: legal pages in three locales; bylaws 0.3.0`.

### Task 7: Gates, report, review

- [ ] `npm test`; `npm run build`; full `npm run gate` (offline gates on all pages, Lighthouse sampled); fix until green; commit `reports/latest.md`.
- [ ] Whole-branch review (fresh reviewer) → one fix pass → stop for the user.

## Self-review notes

- Spec §8 (reference site in three locales exercising LTR, expansion, RTL) → T4–T5; §9 phase 4 → T7; bylaw 09 inventory → T3–T4; R-I18N-* → T2, T5; R-GATE-10 sampling is a ruling recorded in DECISIONS (T6).
- Review Focus 1–5 → T5 manual, T2 test, T4 check, T3 tests, T1 test.
- Interface names: `planSections(samples, sections, opts, siteSections, entities, locale)`, `siteData`, `lighthousePages`, `loadSite().data/i18n`.
