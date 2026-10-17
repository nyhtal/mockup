# Master Prompt: Corporate Website Mockup Engine

> Give this whole file to Claude Code to build the mockup engine. It is a one-time prompt. Once the engine exists, you will use the much shorter **Site Brief** (section 11) to say "build a site about X".

---

## 1. Role and mission

You are building a **mockup engine**: a complete, opinionated rulebook plus a reference implementation for producing static corporate website mockups. The engine's job is to remove every decision that is not look-and-feel. When it is finished, a one-page Site Brief must be enough for you to produce a full multi-page, multi-locale corporate site mockup where every page, widget, interaction, meta tag and structured-data block is already decided by the rules.

The engine is a **set of files, not a framework**. Rules live in markdown. Reusable HTML lives in a catalog. Tokens live in one Tailwind theme file. Quality is proven by a reference "kitchen sink" site that scores 100 on every Lighthouse category and validates clean.

Treat the rules as **bylaws**: when a future site brief conflicts with a bylaw, the bylaw wins unless the brief explicitly says "override bylaw R-XXX-NN". Record every override in the site's `DECISIONS.md`.

The deliverable is a **visual prototype that is also deployable as a static site**. Everything that would need a server is simulated, and the list of simulated things is written down (section 12).

## 2. Non-negotiable constraints

1. **Tailwind CSS only.** All styling via Tailwind utility classes in the HTML. The single CSS input file may contain only: `@import "tailwindcss"`, `@theme` token definitions, `@keyframes` referenced by `--animate-*` tokens, and `@custom-variant` declarations. No `@apply`, no `@layer components`, no hand-written selectors, no inline `style=""` attributes. Arbitrary values and arbitrary properties (for example `[animation-timeline:view()]`) count as Tailwind and are allowed only where a bylaw explicitly names them. If a feature truly cannot be expressed this way (candidate: `@view-transition`), it goes on a documented exception list of at most five lines of CSS, each with a justification.
2. **No third-party runtime code.** No jQuery, no UI kits, no analytics, no tag managers, no CDN scripts, no external fonts or image hosts, no iframes until a user clicks a facade. A JS library may be admitted only if you document why native HTML, CSS and a few lines of vanilla JS cannot do the job, and the library is under 5 KB gzipped, dependency-free, accessible and actively maintained. I expect the answer to be "none needed". Build-time tooling (Tailwind CLI, a static site generator, validators) is not runtime code and is allowed.
3. **Motion is rich but cheap.** Containers slide, fade, scale and stagger; menus drop; sections reveal on scroll. All motion uses `transform` and `opacity` only, respects `prefers-reduced-motion` via Tailwind `motion-safe:` and `motion-reduce:` variants, never blocks interaction, never causes layout shift, and **content is always visible when neither CSS animation nor JS runs**. Prefer CSS (`@starting-style`, scroll-driven animations, cross-document View Transitions) over JS; a single small IntersectionObserver script is the only permitted JS for reveal effects, as progressive enhancement. Same-document View Transitions need JS and are therefore out.
4. **Perfection targets, measured not assumed.** Lighthouse 100 in Performance, Accessibility, Best Practices and SEO on mobile and desktop for every page, under test conditions you define and record (Lighthouse version, throttling preset, device, number of runs, median). Zero errors and zero warnings from the W3C Nu HTML Checker. Zero axe-core violations. WCAG 2.2 AA, including the manual checks automated tools cannot do.
5. **Semantic, minimal HTML.** Native elements before ARIA. `<details>`, `<dialog>`, `popover`, `<nav>`, `<article>`, `<time>`, `<address>`, native form validation. ARIA only where native HTML has no equivalent, and each such use must be listed in the bylaws with its justification.
6. **Consistency is enforced, not encouraged.** One spacing scale, one type scale, one radius scale, one shadow scale, one motion scale, one tone of voice, one capitalization rule, one date format per locale, one terminology glossary. Components are copied from the catalog verbatim and never improvised.
7. **Multi-culture from day one.** Every site is built for N locales even when the brief lists one. Correct `lang`, `dir`, hreflang, translated slugs, logical properties for RTL, locale-aware formatting, and glyph coverage.
8. **Schema.org everywhere it belongs.** JSON-LD, one graph per page, validated, stable entity IDs, absolute URLs, and nothing in the graph that is not visible on the page.
9. **Static output.** Plain HTML, one CSS file, at most one tiny JS file, self-hosted assets. Deployable to any static host with no server logic.

## 3. Decisions I am making now (override by editing this table)

| # | Decision | Default | Why |
|---|---|---|---|
| D1 | Tailwind version | **v4**, CSS-first config via `@theme`, built with Tailwind CLI to one purged file. Never the Play CDN | Smallest output, native cascade layers, no JS config; the CDN is development-only |
| D2 | Page assembly | **Eleventy** (build-time only, ships zero JS) with Nunjucks includes; one source page per locale generates one HTML file | Dozens of pages × locales cannot be hand-duplicated without drift. If you can prove a simpler build works, propose it |
| D3 | Browser baseline | **Baseline "Widely available"** features unconditionally; **Baseline "Newly available"** features (for example `@starting-style`, scroll-driven animations, `popover`, anchor positioning) allowed only with a no-JS graceful fallback. Minimum viewport 320 px; layout must survive 400 % zoom (WCAG reflow) | Modern evergreen browsers, but mockups must not break on a two-year-old phone |
| D4 | Fonts | **One self-hosted variable font** (subset woff2 per script, preloaded, `font-display: swap`, metric-matched fallback via `size-adjust`) plus system fallback stack. Site brief may choose system-only | Brand feel without a Lighthouse hit |
| D5 | Icons | **One inline SVG sprite** per site built from a single open-source icon set (Lucide, ISC licence recorded), referenced with `<use>`; no icon fonts | One visual language, cacheable, no requests |
| D6 | Images | Local **AVIF + WebP** via `<picture>`, explicit `width`/`height`, `loading="lazy"` except the LCP image which gets `fetchpriority="high"`; fixed aspect-ratio set (16:9, 4:3, 3:2, 1:1, 21:9); placeholder images generated locally, no stock photos, no real people | Zero CLS, zero external requests, no image-rights problems |
| D7 | Dark mode | **Supported via tokens and `prefers-color-scheme` only**, no toggle | A toggle needs JS and storage; system preference is enough for a mockup |
| D8 | Motion engine | CSS first: `@starting-style` entries, scroll-driven `animation-timeline: view()` reveals, `@view-transition { navigation: auto }` for page changes; **one ≤ 1.5 KB IntersectionObserver script** as the reveal fallback. Motion budget: max 3 simultaneous entrance animations, max 24 px travel, 150–500 ms durations, no auto-play loops | Smooth, GPU-only, zero library |
| D9 | Forms in mockups | `method="get"` to a per-form `/…/thank-you/` page; native validation plus an error-summary pattern; `autocomplete` tokens; honeypot field as the documented spam-control placeholder; no backend | Clickable flow with no server |
| D10 | Cookie consent | Mockups set **no cookies and load no trackers**, so no banner is shown. The banner and preferences components still exist in the catalog, documented as "enable when a tracker is added"; video and map facades document the embedded-media consent rule | Honest to Lighthouse and to users |
| D11 | Analytics | None. A commented placeholder marks where a site owner would add it | Performance |
| D12 | URL policy | Lower-case, hyphenated, trailing slash, locale prefix (`/en/`, `/de/`), `x-default` points to the default locale; redirects and status codes documented for the host | Clean, hreflang-friendly |
| D13 | Placeholder content | **Fictional but realistic and deterministic** (seeded) company, people, numbers, locations; no lorem ipsum; obviously fictitious claims and figures; no real brands or people | Mockups must read like a real site and never mislead |
| D14 | Naming taxonomy | **Token → Primitive → Component → Section → Page template.** "Widget" in conversation means Component or Section | One vocabulary across all files |
| D15 | Component identity in HTML | `data-component="hero-split"` on the root of every catalog component (valid HTML, zero styling role) | Lets validators and future tooling find components; no custom classes needed |
| D16 | Structured data | JSON-LD only, one `<script type="application/ld+json">` per page holding a single `@graph`; shared `#organization` and `#website` nodes | One block to validate |
| D17 | Rule precedence | Legal/accessibility → performance → validation → consistency bylaws → site brief look-and-feel | Resolves conflicts without discussion |
| D18 | Scope tiers | Every page type and component is tagged **core**, **optional** or **module** (industry add-on). A brief that says nothing gets core | Keeps "every corporate site" bounded |

## 4. Research phase (do this before writing any rule)

Research each area below and write down the result as a rule, not as notes. Where sources conflict, pick one and say why. Cite the source URL in the rule file. Use today's documentation, not memory, for anything with a version number (Tailwind v4 features, Baseline status, Lighthouse audit list, Google-supported schema types, WCAG 2.2 success criteria).

1. Tailwind v4: `@theme` syntax, `--animate-*`, `--ease-*`, `--spacing`, container queries, `motion-safe`, `print:`, `rtl:`/`ltr:`, `starting:` variant, logical property utilities (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`), browser requirements.
2. Every current Lighthouse audit in all four categories and what each requires of static HTML, plus how the scores are computed and what a repeatable run looks like.
3. The full Nu HTML Checker ruleset and its common warnings (section without heading, obsolete attributes, redundant `role`, `type` on script/style).
4. WCAG 2.2 AA success criteria, with special attention to 2.4.11 Focus Not Obscured, 2.5.8 Target Size (24×24), 3.2.6 Consistent Help, 3.3.7 Redundant Entry, 1.4.10 Reflow.
5. Google's currently supported structured-data features and policies, and schema.org types relevant to corporate sites: `Organization`/`Corporation`, `WebSite` with `SearchAction`, `WebPage` subtypes (`AboutPage`, `ContactPage`, `CollectionPage`, `ProfilePage`), `BreadcrumbList`, `Article`/`BlogPosting`/`NewsArticle`, `Person`, `JobPosting`, `FAQPage` (Google's 2023 restriction), `Event`, `Product`/`Service`/`Offer` (do not label every service a product), `ContactPoint`, `LocalBusiness`, `VideoObject`, `ImageObject`, `Review`/`AggregateRating` (self-serving restriction, never fabricated), `HowTo` (dropped from rich results).
6. Internationalisation: hreflang rules and reciprocity, `x-default`, BCP 47 tags, CLDR date/number/currency formats, time zones, RTL layout rules, mixed-direction text, pluralisation, name and address formats, text expansion allowances (German +35 %, Finnish +30 %), CJK line breaking, font subsetting per script, language-switcher accessibility (never flags for languages, native language names), fallback locale behaviour, culturally appropriate imagery.
7. Modern motion: `@starting-style`, `transition-behavior: allow-discrete`, scroll-driven animations (`view()`, `scroll()`), cross-document View Transitions, `prefers-reduced-motion`, what triggers layout vs paint vs composite, animation cancellation and interruption.
8. Native interactive HTML: `<details name>` exclusive accordions, `<dialog>` with `closedby`, Popover API with `popovertarget`, invoker commands, scroll-snap carousels, CSS anchor positioning, `:has()`, `field-sizing`, `inert`.
9. Font loading strategy: subsetting, `size-adjust`/`ascent-override` fallbacks, preload, `font-display` trade-offs for a Lighthouse 100.
10. Image strategy: AVIF/WebP encoding targets, `sizes` attribute rules, art direction, LCP optimisation, decorative vs informative alt text, charts as images with text alternatives.
11. Security and deployment hygiene for static sites: CSP compatible with inline JSON-LD, `_headers`-style config, `security.txt`, `robots.txt`, `sitemap.xml` with hreflang, `manifest.webmanifest`, favicons (SVG + PNG fallbacks + apple-touch-icon), `theme-color`, RSS/Atom feed for articles, staging no-index, caching and compression expectations.
12. Corporate web content standards: title/meta-description length, heading rules, link text, CTA wording, reading level, legal pages required per region (GDPR privacy, cookie policy, Impressum for DE/AT, accessibility statement under the European Accessibility Act, terms, modern slavery statement for UK where applicable), "last reviewed" dates on legal pages.

## 5. Deliverables (the engine)

Produce these files. Each rule file starts with a one-paragraph purpose, then numbered rules (`R-TYPO-01` style IDs so a later site can cite them), then a checklist. No prose essays.

```
mockup-engine/
├── README.md                      how to use the engine, build, validate, and run the Site Brief
├── INDEX.md                       dependency index: for each task (new site, new page, new component,
│                                  new locale, review) the ordered list of files to load
├── DECISIONS.md                   the table in section 3, expanded, with dates and sources
├── CHANGELOG.md                   bylaw bundle version (semver) and what changed
├── bylaws/
│   ├── 00-precedence.md           rule precedence, override procedure, exception list for CSS
│   ├── 01-html.md                 document skeleton, head order, landmarks, heading rules, allowed ARIA list, validation rules
│   ├── 02-tokens.md               color (roles not hues), spacing, type scale, radius, shadow, z-index, breakpoints, container widths, durations, easings
│   ├── 03-layout.md               container, grid, section rhythm, vertical spacing, max line length, sticky rules, overflow and long-content rules
│   ├── 04-typography.md           scale usage per element, weights, line heights, measure, fluid sizes, multilingual fallbacks
│   ├── 05-color.md                semantic color roles, contrast minimums, dark mode mapping, state colors, brand color injection
│   ├── 06-motion.md               motion scale and budget, allowed properties, entry/exit/reveal/hover patterns, reduced-motion behaviour, the one JS script
│   ├── 07-components.md           anatomy, states (default/hover/focus/active/disabled/loading/error/empty/success/partial), variants, spacing, keyboard behaviour, when to use which
│   ├── 08-sections.md             section catalog with content limits (max items, max words), ordering rules per page type
│   ├── 09-pages.md                page inventory with core/optional/module tier, required sections, meta contract, schema contract, URL pattern
│   ├── 10-content.md              tone presets, capitalization, punctuation, numerals, CTA verbs, microcopy table, terminology glossary, forbidden words, length limits, fictitious-claims rule
│   ├── 11-i18n.md                 locale structure, hreflang, RTL, formatting, text expansion, switcher, translation keys, fallback locale
│   ├── 12-seo-meta.md             title/description patterns, canonical, OG/Twitter, robots, sitemap, feed, social image spec
│   ├── 13-schema.md               per-page-type JSON-LD contracts, shared nodes, ID conventions, visible-content rule
│   ├── 14-accessibility.md        WCAG 2.2 AA mapping, focus order, skip links, focus management for dialog/popover, forms, media captions and transcripts, manual check list
│   ├── 15-performance.md          budgets (HTML ≤ 50 KB, CSS ≤ 30 KB, JS ≤ 2 KB, total ≤ 300 KB per page, LCP ≤ 1.2 s lab), font and image rules, preload rules, test conditions
│   ├── 16-forms.md                field anatomy, labels, help text, error text and summary, validation timing, preserved input, autocomplete tokens, upload limits, duplicate-submit guard, success flow
│   ├── 17-assets.md               icon sprite and licence, favicon set, manifest, placeholder image generation, naming, folder layout
│   ├── 18-security-deploy.md      CSP, headers file, security.txt, robots, redirects, status codes, 404/500 behaviour on static hosts, staging no-index
│   └── 19-quality-gates.md        the exact commands, conditions and thresholds that must pass before a site is "done"
├── catalog/
│   ├── primitives/                button, icon button, link, input, select, textarea, checkbox, radio, switch, date input, file input, badge, tag, avatar, icon, divider, kbd
│   ├── components/                one .html per component with every variant and state, each wrapped in the documented markup only
│   ├── sections/                  one .html per section
│   └── templates/                 one .njk per page type, composed only from sections
├── theme/
│   └── app.css                    the single Tailwind input: @import, @theme, @keyframes, @custom-variant, documented exceptions
├── scripts/
│   └── reveal.js                  the one permitted script, commented, ≤ 1.5 KB minified
├── i18n/
│   ├── en.json                    all UI strings and microcopy keys
│   └── _template.json             empty keyset for a new locale
├── reference-site/                the kitchen-sink site proving every rule (see section 8)
├── checklists/
│   ├── new-site.md                step list from Site Brief to delivered mockup
│   ├── new-page.md
│   ├── new-component.md
│   ├── new-locale.md
│   └── pre-delivery.md            the gate list with pass/fail boxes
└── site-brief/
    └── TEMPLATE.md                section 11 of this document
```

## 6. Page inventory (every one gets a tier, a template, a meta contract and a schema contract)

**Marketing core:** Home · About (overview) · Leadership/Team · Person biography · History/Timeline · Mission & Values · Locations/Offices · Office detail · Services index · Service detail · Products index · Product detail · Solutions by Industry index · Industry detail · Pricing · Comparison · Partners/Integrations · Customers/Case studies index · Case study detail · Testimonials.

**Resources:** Resource hub · Blog index · Blog post · Category/Tag archive · Author page · Whitepapers/Downloads index · Download detail with gated-form variant · Webinars/Events index · Event detail · Event registration · Event replay · FAQ · Glossary · Help/Support index · Documentation article · Video library.

**Company:** News/Press index · Press release · Media kit · Careers index · Job detail · Job application · Culture/Benefits · Investors (optional: overview, reports, governance) · Sustainability/ESG · Trust/Security/Compliance centre · Contact · Demo/Quote request · Newsletter signup · Newsletter preferences · Unsubscribe.

**Conversion and utility:** Landing page (campaign) · Thank-you/Confirmation (one per form) · Search results · Search no-results · Site map (HTML) · Style guide/Component gallery (the engine's own page, shipped with every site) · Legal: Privacy, Cookies, Terms, Imprint/Legal notice, Accessibility statement.

**Error and state pages:** 404 · 500 · Maintenance · Coming soon · Offline (only if a service worker is ever added; default no).

For every page define: tier (core/optional/module), URL pattern, `<title>` pattern, description pattern, breadcrumb, required sections in order, optional sections, JSON-LD graph, OG image rule, and which locale-specific variants exist (for example Imprint only for DE/AT).

## 7. Component and section inventory (every one gets anatomy, variants, all states, spacing, motion, keyboard behaviour, responsive rules, a11y notes, i18n notes, content limits)

**Shell and navigation:** header (default, transparent-over-hero, compact-on-scroll), primary nav with mega menu, mobile drawer, locale switcher, search trigger and search box with suggestions, header CTA, announcement bar, breadcrumbs, footer (multi-column, legal row, social, locale), sidebar nav, in-page/sticky sub-nav, table of contents, pagination, back-to-top, skip link.

**Hero and intro:** hero (centered, split, video-facade, with form, with stats), page header/intro, eyebrow + heading + lede pattern.

**Marketing blocks:** feature grid, alternating feature rows, stats/metrics band, logo cloud, testimonial (single, grid, carousel), case-study card, team card, office card, pricing table, comparison table, steps/process, timeline, CTA band, trust bar, award/certification badges, integration card, related items.

**Content blocks:** prose/article body, blockquote, callout/notice, code block, data table, image with caption, image gallery, chart image with text alternative, video facade (click-to-load, no iframe until click), audio with transcript, map facade, download card, event card, job card, author box, share links, tag list, "was this helpful".

**Controls and overlays:** FAQ accordion, tabs, dialog/modal, drawer, dropdown/popover, tooltip, carousel, filter and sort bar, search results list.

**Forms:** contact form, newsletter form, multi-step form with stepper, file upload field, validation summary, success/pending/failure messages.

**Feedback and states:** empty state, error state, loading/skeleton state, partial-data state, toast, progress indicator, cookie consent banner and preferences panel (catalog only, see D10).

**Carousel rule:** CSS scroll-snap only, keyboard reachable, visible scrollbar on hover, no auto-play.

## 8. Reference site (proof, not decoration)

Build `reference-site/` as a fictional corporate company in **three locales (en, de, ar)** so LTR, text expansion and RTL are all exercised. It must include every core and optional page type and every component in at least one variant. It must pass every quality gate in section 9 on every page. It doubles as the regression suite: any bylaw change is verified against it.

## 9. Quality gates (bylaw 19 and `checklists/pre-delivery.md`)

A site is not done until all of these pass with the exact commands and conditions recorded in the README:

- Lighthouse CI: 100/100/100/100 mobile and desktop, every page, recorded throttling preset, median of 3 runs.
- Nu HTML Checker: 0 errors, 0 warnings, every page.
- axe-core (or pa11y-ci): 0 violations, every page; plus the manual WCAG checklist signed off.
- Schema validation: every page's JSON-LD parses, matches its contract, has stable IDs and absolute URLs, and shows no Google rich-result errors.
- Performance budgets from bylaw 15 met; report per-page sizes.
- Link check: no broken internal links; no external links at all in mockups except documented placeholders.
- i18n completeness: every key present in every locale, no untranslated strings, every page has reciprocal hreflang to every sibling plus `x-default`.
- Consistency lint: every `data-component` value exists in the catalog; no class outside Tailwind; no inline style; no `id` collisions; heading order valid; exactly one `h1`; terminology glossary respected.
- Motion check: page fully usable with `prefers-reduced-motion: reduce`; nothing animates a layout property; content visible with JS disabled.
- Keyboard walkthrough: every interactive element reachable and operable, focus visible and never obscured, dialogs trap and restore focus, Escape closes.
- Reflow: usable at 320 px and at 400 % zoom with no horizontal scroll.
- Print: every page prints readably using `print:` variants only.
- Zero console errors or warnings.

## 10. Working method

1. Answer the questions in section 13 in your first reply, then do the research in section 4. Write findings straight into the rule files.
2. Write `DECISIONS.md`, `INDEX.md` and `00-precedence.md` first, then tokens, then HTML and layout, then the rest. Stop after the bylaws are drafted and ask me to review before building the catalog.
3. Build primitives, then components, then sections, then templates, validating each layer against the gates before moving on.
4. Build the reference site. Run every gate. Fix until green. Record the numbers.
5. Write the checklists and the Site Brief template last, from what you actually needed.
6. Keep every file short enough to read in one sitting. Split before a file passes about 400 lines.
7. Do not add features the inventory does not list. Do not add rules you cannot verify with a gate or a manual checklist item. Prefer deleting a rule over leaving an unverifiable one.
8. Every rule has an ID, a one-line MUST/SHOULD statement, a short "why", and the gate or checklist item that checks it.
9. Commit at the end of each numbered step with a message naming the step.

## 11. Site Brief template (what I will give you later)

```
SITE BRIEF
Company name:            (fictional)
Industry / what they do: (one sentence)
Audience:                (who buys, who researches)
Primary conversion:      (demo request | contact | download | apply | buy)
Secondary conversion:
Locales:                 (default first; e.g. en, de, fr)
Pages:                   (core | core+optional | list) — defaults to core from bylaw 09
Modules:                 (industry add-ons from bylaw 09, if any)
Tone:                    (pick one voice preset from bylaw 10)
Brand:                   primary hue, accent hue, neutral temperature, radius (sharp | soft | round), density (compact | comfortable)
Font choice:             (variable font from the approved list | system)
Motion level:            (calm | standard | expressive) — maps to bylaw 06 presets
Imagery style:           (photo-like | illustration | abstract | none)
Dark mode:               (system | off)
Overrides:               (bylaw IDs to override, with reason)
Must-have sections:
Must-not-have:
```

Everything not in the brief is decided by the bylaws. The output is a built site, its `DECISIONS.md`, and a passed `pre-delivery.md`.

## 12. Explicitly out of scope and explicitly simulated

**Out of scope:** backend, CMS, authentication, e-commerce checkout, email templates, PDF generation, service workers, A/B testing, real analytics, real cookie handling, same-document View Transitions.

**Simulated (and documented as such in the README):** form submission (GET to thank-you page), search (static results and no-results pages), maps (facade), video (facade), downloads (link to a placeholder file), job application, newsletter preferences, gated content.

## 13. Questions to answer in your first reply, before research

Do not ask me; answer them yourself with a recommendation and proceed unless the answer changes the file structure above.

1. Is Eleventy the lightest build that still gives includes and locale loops, or is a short Node script enough?
2. Can `@view-transition` cross-document navigation be expressed inside the Tailwind input file constraints, or does it go on the exception list?
3. Which Baseline "Newly available" features are safe enough to use with a fallback as of today's date?
4. Is there any JS library that clears the bar in constraint 2? (Expected: no.)
5. What is the smallest favicon set that satisfies every current Lighthouse and platform check?
6. What exact Lighthouse conditions (version, preset, runs) will you record as the benchmark?
