# Mockup Engine: Design Spec

Date: 2026-10-17
Status: draft for review
Brief: [docs/MASTER-PROMPT.md](../../MASTER-PROMPT.md) (the approved master prompt; this spec does not repeat its inventories or constraints, it decides how to realise them)

## 1. What we are building

A reusable engine that turns a one-page Site Brief into a static, multi-locale corporate website mockup that scores 100 on all four Lighthouse categories, validates with zero Nu errors or warnings, and passes WCAG 2.2 AA checks. The engine is three things:

1. **Bylaws**: numbered, testable rules in markdown (`bylaws/00`–`19`).
2. **Catalog**: Tailwind-only HTML for every primitive, component, section and page template.
3. **Reference site**: a fictional company in `en`, `de`, `ar` that exercises every rule and is the regression suite.

Success means: give the engine a Site Brief, run `npm run build && npm run gate`, and get a green report with no design decisions left except look-and-feel.

## 2. Answers to the open questions (master prompt section 13)

**Q1. Eleventy or a custom script?** Eleventy 3.1.7 with Nunjucks. A custom script would need layouts, includes, escaping, a data cascade, locale loops and a dev server, which is a worse Eleventy. Eleventy ships zero browser JS, bundles an i18n plugin that produces locale alternates for hreflang, and has a dev server for the gates. Codex independently reached the same conclusion.

**Q2. Can `@view-transition` live inside the Tailwind constraints?** No. It is a document-level descriptor at-rule, not a style rule, so neither `@custom-variant` nor an arbitrary variant can express it. It goes on the documented CSS exception list as exactly three lines. Firefox does not support it, so it is progressive enhancement only, and the reduced-motion case is covered by wrapping it in `@media (prefers-reduced-motion: no-preference)`. Exception list total: 5 lines.

**Q3. Which Baseline "Newly available" features are safe with a fallback?** See the feature policy table in section 7. In short: `@starting-style`, `transition-behavior: allow-discrete`, Popover API, `<details name>`, `:has()`, container queries and `text-wrap: balance` are in. Scroll-driven animations are in but gated behind `@supports` (Safari 26 and Firefox 161 only). Anchor positioning, `closedby`, `text-wrap: pretty` and `light-dark()` are out for v1.

**Q4. Any JS library worth admitting?** No. The only candidate under the size bar is Motion's mini bundle at about 3.2 KB, and it adds convenience, not capability. Everything we need is native HTML plus one script under 2 KB.

**Q5. Smallest favicon set?** Four files, no manifest: `favicon.ico` (16, 32, 48), `icon.svg` (dark-mode aware via an internal media query), `apple-touch-icon.png` (180), `icon-192.png`. Lighthouse 12+ has no PWA category, so a manifest and maskable icons buy nothing for a non-installable site and add a request.

**Q6. Lighthouse benchmark conditions?** Standalone Lighthouse 13.5.0 via its Node API, not Lighthouse CI (0.15.1 still bundles Lighthouse 12.6.1, and 13 is what DevTools and PageSpeed use today). Chrome stable, `--headless=new`. Mobile: default simulated throttling (150 ms RTT, 1.6 Mbps, 4× CPU), 412×823 at DPR 1.75. Desktop: `desktop` preset (40 ms, 10 Mbps, 1×), 1350×940. Five cold runs per URL per profile, median of each category score, served by the Eleventy dev server over localhost. The gate writes versions, commit, OS and the per-page medians to `reports/lighthouse.md`.

## 3. Approaches considered

| | A. Hand-written HTML per page and locale | B. Eleventy + Nunjucks (recommended) | C. Custom Node generator |
|---|---|---|---|
| Consistency | Drifts immediately across 50+ pages × 3 locales | Components are includes, so one source | Same as B once it works |
| Zero runtime JS | Yes | Yes | Yes |
| i18n | Manual | Bundled plugin for locale alternates, JSON for strings | Must be written |
| Gates | Same | Same | Same |
| Risk | Unmaintainable | Learning Nunjucks; a build dependency | Becomes a bad SSG |

Choose **B**. The Tailwind-only and no-runtime-JS constraints are about what ships to the browser; Eleventy never reaches it.

## 4. Architecture

### 4.1 Repository layout

```
mockup/
├── docs/                          master prompt, this spec, implementation plans
├── engine/
│   ├── README.md  INDEX.md  DECISIONS.md  CHANGELOG.md
│   ├── bylaws/00-precedence.md … 19-quality-gates.md
│   ├── checklists/                new-site, new-page, new-component, new-locale, pre-delivery
│   ├── site-brief/TEMPLATE.md
│   ├── theme/app.css              the single Tailwind input
│   ├── scripts/enhance.js         the single runtime script (≤ 2 KB minified)
│   ├── catalog/
│   │   ├── primitives/*.njk       macros: button, input, badge, icon …
│   │   ├── components/*.njk       macros or includes with every variant and state
│   │   ├── sections/*.njk         includes that take a data object
│   │   └── templates/*.njk        page layouts composed only from sections
│   ├── i18n/en.json de.json ar.json _template.json
│   └── tools/                     build and gate scripts (Node, ESM)
├── sites/
│   └── reference/                 the kitchen-sink site (content, data, generated images)
├── .eleventy.js                   Eleventy config shared by every site
├── package.json
└── reports/                       gate outputs (gitignored except the latest summary)
```

A future site is `sites/<name>/` with its own `brief.md`, `site.json` (brand tokens, locales, pages), content per locale, and `DECISIONS.md`. It reuses `engine/` unchanged.

### 4.2 Build pipeline

```
brief.md ──(human/Claude)──▶ sites/<name>/site.json + content/<locale>/*.md|.json
                                        │
engine/theme/app.css ──▶ Tailwind CLI ──▶ dist/<name>/assets/app.css  (purged, minified)
engine/catalog + site content ──▶ Eleventy ──▶ dist/<name>/<locale>/**/index.html
fonts (npm @fontsource-variable/*) ──▶ copy subset woff2 ──▶ dist/assets/fonts/
lucide-static ──▶ tools/build-icons.js ──▶ one inline SVG sprite include per site
site.json image specs ──▶ tools/build-images.js (sharp) ──▶ AVIF + WebP + width/height
Eleventy data ──▶ sitemap.xml (with hreflang), robots.txt, feed.xml, security.txt
```

One command: `npm run build -- --site reference`. Output is `dist/reference/`, deployable as-is.

### 4.3 Data flow for a page

1. `site.json` declares locales, default locale, brand tokens, enabled pages (core/optional/module) and navigation.
2. Each page is a content file under `sites/<name>/content/<locale>/<slug>.md` with front matter: `template`, `title`, `description`, `sections[]` (ordered section names with their data), `schema` overrides, `image`.
3. The template renders the shared shell (head, header, footer) and loops `sections[]`, including each section with its data. Sections only include components; components only include primitives.
4. A computed-data function builds the page's JSON-LD `@graph` from the page type's schema contract plus `site.json` (`#organization`, `#website`) and content front matter. It is serialised with `<` escaped as `<`.
5. The i18n filter `t("key")` reads `engine/i18n/<locale>.json`; a missing key **fails the build** (strict mode). Content copy lives in the content files, UI strings live in i18n JSON.
6. The i18n plugin's `locale_links` filter supplies alternates for `<link rel="alternate" hreflang>` and the locale switcher; the sitemap uses the same data.

### 4.4 Styling and tokens

- `engine/theme/app.css` is the only CSS source. It contains: `@import "tailwindcss"`, `@source` pointers to the catalog and site content, one `@theme` block (full custom theme via `--*: initial` is **not** used; we override namespaces selectively so Tailwind's spacing math and preflight remain), `@keyframes` inside `@theme` tied to `--animate-*` tokens, `@custom-variant` lines for `sda` (scroll-driven animation support) and `js` (JS present), and the 5-line exception block.
- Brand injection: a site's `site.json` brand values are written into the `@theme` block by the build (`--color-brand-*`, `--font-sans`, `--radius-*`), so a site never edits CSS. Colour tokens are **roles** (`brand`, `accent`, `surface`, `ink`, `muted`, `line`, `success`, `warning`, `danger`) mapped to OKLCH scales; each role token carries both schemes via `light-dark()` (decided during implementation, DECISIONS D7), so pages use no `dark:` classes.
- No `@apply`, no `@layer components`, no selectors, no inline styles. A gate greps the built HTML and CSS for violations.

### 4.5 Motion system

| Need | Mechanism | Fallback |
|---|---|---|
| Entry of popovers, menus, dialogs | `starting:` variant + `transition-discrete` + `open:` | Appears instantly |
| Reveal on scroll | `sda:animate-reveal sda:[animation-timeline:view()] sda:[animation-range:entry_0%_cover_30%]` under `motion-safe:` | Visible, static |
| Reveal on scroll where `sda` unsupported | `enhance.js` adds `data-revealed` via IntersectionObserver; classes use `js:` and `data-revealed:` variants so content is visible without JS | Visible, static |
| Header compacts on scroll | scroll-driven `scroll()` timeline on the header, `sda:` gated | Static header |
| Page transitions | `@view-transition { navigation: auto }` (exception list) | Normal navigation |
| Hover and focus | `transition` on `transform`/`opacity`/`color` only, 150–200 ms | n/a |
| Stagger | `nth-*` variants with `[animation-delay:…]` arbitrary values, max 3 items | n/a |

Motion presets (`calm`, `standard`, `expressive`) are three sets of token values (durations, distances, stagger) in `02-tokens.md`; a site picks one in its brief and the build writes those tokens.

### 4.6 Interactive primitives (no runtime JS)

| Pattern | Element | Notes |
|---|---|---|
| Dropdown, mega menu, mobile drawer, tooltip, locale switcher | `popover` + `popovertarget` | Light dismiss and Escape are native; `open:` variant styles it |
| Accordion, FAQ | `<details name>` | Exclusive groups degrade to independent panels |
| Modal (video facade, gated form) | `<dialog>` + `command="show-modal"` | `enhance.js` wires `commandfor` where unsupported; close via `<form method="dialog">` |
| Tabs | Links to in-page sections with `:target`-free design: tabs are `<details name>` groups styled horizontally on wide screens | Avoids ARIA tab roles entirely |
| Carousel | scroll-snap `<ul>` with visible scrollbar on hover | No controls that need JS |
| Forms | native validation, `autocomplete`, `method="get"` to a thank-you page | Error summary is a static example state in the catalog |

### 4.7 The single runtime script

`engine/scripts/enhance.js`, ES module, ≤ 2 KB minified, no dependencies, loaded with `type="module"` (deferred by default). Responsibilities, each guarded by feature detection: (1) IntersectionObserver reveal when `CSS.supports("animation-timeline: view()")` is false; (2) `command`/`commandfor` fallback for `<dialog>`. Nothing else. It sets `<html data-js>` so the `js:` custom variant can apply.

### 4.8 Assets

- **Fonts**: `@fontsource-variable/inter` (Latin, OFL) and `@fontsource-variable/noto-sans-arabic` (Arabic, OFL) copied at build; only the subsets a site's locales need. Preload the Latin file on every page, the Arabic file only on `ar` pages. Self-hosting needs `@font-face` blocks (with `size-adjust` descriptors for the metric-matched fallback). These are not style rules and cannot be expressed as Tailwind utilities, so the exception list has two permitted categories: the 5-line `@view-transition` block and `@font-face` blocks for the site's fonts. Nothing else. Approved font list in `04-typography.md`: Inter, Figtree, IBM Plex Sans, Source Sans 3, Noto Sans, plus Noto Sans Arabic for `ar`.
- **Icons**: `lucide-static` (ISC) SVGs compiled by `tools/build-icons.js` into one sprite included once per page; `<svg aria-hidden="true"><use href="#i-arrow-right"/></svg>` with an allow-list of about 60 icons.
- **Images**: `tools/build-images.js` generates deterministic abstract placeholders (seeded gradients and shapes, brand hues) as SVG, then `sharp` renders AVIF and WebP at the sizes the `sizes` rule needs. Every `<picture>` has width and height. The LCP hero image is `fetchpriority="high"`, not lazy.

### 4.9 Head and metadata

Fixed order in the shell: charset, viewport, title, description, canonical, hreflang set, robots (only when non-default), theme-color (light and dark), favicon links, preload font, stylesheet, OG and Twitter meta, JSON-LD. The module script is the last child of `body`. Title pattern `{Page} · {Company}`, home `{Company} · {Tagline}`. OG image per page is a generated 1200×630 placeholder with the page title.

## 5. Toolchain (pinned at implementation)

| Tool | Version | Role |
|---|---|---|
| Node | 24.19.0 | runtime for build and gates |
| tailwindcss, @tailwindcss/cli | 4.3.3 | CSS build |
| @11ty/eleventy | 3.1.7 | page assembly, dev server, i18n plugin |
| lighthouse | 13.5.0 | performance/a11y/BP/SEO gate |
| Nu checker | `latest` standalone Windows zip (embedded Java runtime, no install) downloaded to `tools/vnu/` by `npm run setup`, gitignored | HTML validation gate |
| pa11y-ci | 5.0.0 with axe runner, WCAG 2.2 tags | accessibility gate |
| linkinator | 8.1.0 | link check |
| sharp | 0.35.5 | image generation |
| lucide-static | 1.59.0 | icons |
| @fontsource-variable/* | 5.3.x | fonts |

Custom gate scripts in `engine/tools/` (ESM, no framework): `gate-lighthouse.js`, `gate-html.js` (Nu JSON, fail on any `error` or `info/warning`), `gate-consistency.js` (data-component allow-list, class allow-list from the built CSS, inline style, single h1, heading order, id uniqueness, i18n completeness, hreflang reciprocity), `gate-schema.js` (parse every JSON-LD block, check contract per page type, absolute URLs, `@id` references resolve), `gate-budget.js` (sizes per page). `npm run gate` runs all and writes `reports/`.

## 6. Browser support policy and feature table

Baseline core set: Chrome, Edge, Firefox, Safari (desktop and mobile). Tailwind 4 itself needs Chrome 111, Safari 16.4, Firefox 128. Content and navigation must work there; motion and polish may require newer.

| Feature | Status (2026-10-17) | Use | Fallback |
|---|---|---|---|
| `@starting-style` | Newly available, Aug 2024 | Yes | Instant appearance |
| `transition-behavior: allow-discrete` | Newly available | Yes | Instant |
| Popover API | Newly available, Jan 2025 | Yes | Content visible, trigger inert |
| `<details name>` | Newly available (Chrome 120, Safari 17.2, Firefox 130) | Yes | Independent panels |
| `<dialog>` | Widely available | Yes | n/a |
| `command`/`commandfor` | Newly available 2026 | Yes with script fallback | `enhance.js` |
| `:has()`, container queries | Widely available | Yes | n/a |
| `text-wrap: balance` | Newly available; widely on 2026-11-13 | Yes, headings only | Normal wrap |
| Scroll-driven animations | Chrome 115, Safari 26, Firefox 161 | Yes, `@supports`-gated | IO script, else static |
| `@view-transition` | Limited (no Firefox) | Yes, exception list | Normal navigation |
| Anchor positioning | Newly available but partial in Safari 26 | **No** in v1 | n/a |
| `light-dark()` | Newly available (Chrome 123, Safari 17.5, Firefox 120); widely from 2026-11-13 | Yes, in colour role tokens (changed during implementation, see DECISIONS D7) | Browser default colours |
| `dialog closedby`, `text-wrap: pretty`, `field-sizing` | Limited or no gain | **No** in v1 | n/a |

## 7. Error handling

- Build fails on: missing i18n key, missing `alt` on a content image, a section name not in the catalog, a page without a schema contract, a locale without a content file for a core page (Eleventy i18n `errorMode: "strict"`), unknown brand token.
- Gates fail loudly with file and line; `npm run gate` exits non-zero on the first failing gate but runs all gates and prints a summary table.
- Image generation is deterministic (seeded by page slug), so a re-run never changes a committed image.

## 8. Testing strategy

The gates are the tests. In addition, the custom tools get small Node test files (`node --test`) written before the tool, per TDD: fixture HTML in, expected findings out. The reference site is the integration test; any bylaw change must keep it green.

## 9. Delivery phases

1. **Scaffold**: package.json, Eleventy config, Tailwind input, `npm run setup` (downloads Nu), gate skeletons with tests. Build an empty page to green.
2. **Bylaws 00–19** written from the research, each rule with ID, MUST/SHOULD, why, and gate reference. **Stop for review** (the master prompt's gate).
3. **Catalog**: primitives, components, sections, templates, each added to a growing kitchen-sink page kept green.
4. **Reference site** in en/de/ar, all core and optional pages, all gates green, numbers recorded.
5. **Checklists, Site Brief template, INDEX.md, README**, written from what the build actually needed.

Each phase ends in a commit on branch `mockup-engine`.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Nu warns on `<section>` without heading, redundant `role`, `type` on script | Bylaw 01 forbids those patterns; gate catches regressions |
| Font swap causes CLS and costs LCP | Preload one file, `size-adjust` fallback, hero text uses system metrics; verify in gate |
| Reveal animations hide content for Lighthouse's LCP | Reveal starts at opacity 1 on the LCP element; only below-the-fold sections animate; `both` fill with 0 s duration where unsupported |
| Lighthouse flakes | Median of 5, localhost, no external requests, CPU-idle check before runs |
| Arabic text expansion and RTL break layouts | Logical utilities only (`ps-`, `me-`, `start-`), `rtl:` variant for icons; `ar` locale in the reference site |
| Class strings become unreadable | Component macros own the classes; pages only pass data |
| Tailwind purges classes built dynamically | Macros emit complete literal class strings; a gate checks every class in HTML exists in the built CSS |

## 11. Out of scope

As in the master prompt section 12, plus: Lighthouse CI server, visual regression screenshots (may be added later with Playwright), and automated translation (locale files are authored).
