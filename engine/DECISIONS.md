# Engine decisions

Decisions that are not derivable from the code. Each site records its own overrides in `sites/<name>/DECISIONS.md` citing the bylaw ID it overrides (see `bylaws/00-precedence.md`).

| ID | Decision | Date | Source |
|---|---|---|---|
| D1 | Tailwind CSS **4.3.3** via `@tailwindcss/cli`, CSS-first config in `engine/theme/app.css`, compiled against the built HTML and minified. Never the Play CDN. | 2026-10-17 | https://tailwindcss.com/docs/theme, https://tailwindcss.com/docs/installation/play-cdn |
| D2 | Page assembly with **Eleventy 3.1.7** + Nunjucks (build-time only, ships no JS). Catalog lives in `engine/catalog`, sites in `sites/<name>/content/<locale>/`. | 2026-10-17 | https://www.11ty.dev/docs/i18n/ |
| D3 | Browser baseline: Tailwind 4 floor (Chrome 111, Safari 16.4, Firefox 128) for content and navigation; Baseline "Newly available" features only with a no-JS fallback. Min viewport 320 px; reflow at 400 % zoom. | 2026-10-17 | https://tailwindcss.com/docs/compatibility, https://web.dev/baseline |
| D4 | Fonts: one self-hosted variable font per script from `@fontsource-variable/*` (OFL), subset per locale, Latin file preloaded, `font-display: swap`, metric-matched fallback. Approved list in bylaw 04. | 2026-10-17 | https://fontsource.org |
| D5 | Icons: `lucide-static` 1.59.0 (ISC) compiled into one inline SVG sprite per site; `<use href="#i-name">`. No icon fonts. | 2026-10-17 | https://lucide.dev |
| D6 | Images: locally generated AVIF + WebP via `sharp`, `<picture>` with width/height, lazy except the LCP image (`fetchpriority="high"`). Aspect ratios 16:9, 4:3, 3:2, 1:1, 21:9. No stock photos, no real people. | 2026-10-17 | spec §4.8 |
| D7 | Dark mode follows `prefers-color-scheme` only, with no toggle. Colour roles are tokens whose values use `light-dark()` so no `dark:` classes are needed; `<html>` sets `scheme-light-dark`. **Overrides spec §4.4 and §6** (which planned `dark:` remapping and kept `light-dark()` out): one token definition instead of a `dark:` class on every coloured element. Fallback on pre-mid-2024 browsers is the browser's default colours (readable, unbranded). | 2026-10-17 | https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark |
| D8 | Motion: CSS first (`starting:` + `transition-discrete` for overlays, scroll-driven `animation-timeline: view()` for reveals, cross-document `@view-transition`), one `enhance.js` ≤ 2 KB as fallback. Budget: ≤ 3 simultaneous entrances, ≤ 24 px travel, 150–500 ms. | 2026-10-17 | https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style |
| D9 | Forms: `method="get"` to a per-form thank-you page, native validation, autocomplete tokens, error-summary pattern, honeypot placeholder. No backend. | 2026-10-17 | bylaw 16 |
| D10 | Cookie consent: mockups set no cookies and load no trackers, so no banner is shown; banner and preferences exist in the catalog only. | 2026-10-17 | bylaw 18 |
| D11 | Analytics: none; a commented placeholder marks the spot. | 2026-10-17 | bylaw 15 |
| D12 | URLs: lower-case, hyphenated, trailing slash, locale prefix (`/en/`), `x-default` = default locale. | 2026-10-17 | bylaw 11 |
| D13 | Placeholder content is fictional, realistic, deterministic (seeded by slug) and obviously fictitious in its claims. No lorem ipsum. | 2026-10-17 | bylaw 10 |
| D14 | Vocabulary: Token → Primitive → Component → Section → Page template. "Widget" means Component or Section. | 2026-10-17 | bylaw 07 |
| D15 | Every catalog component root carries `data-component="<name>"`; the consistency gate checks the name exists in the catalog. | 2026-10-17 | bylaw 01 |
| D16 | Structured data: JSON-LD only, one `<script type="application/ld+json">` per page with one `@graph`, shared `#organization` and `#website` nodes. | 2026-10-17 | bylaw 13 |
| D17 | Rule precedence: legal and accessibility → performance → validation → consistency → site brief look-and-feel. | 2026-10-17 | bylaw 00 |
| D18 | Scope tiers: every page type and component is core, optional or module; a silent brief gets core. | 2026-10-17 | bylaw 09 |
| D19 | Lighthouse benchmark: standalone Lighthouse 13.5.0 via Node API (Lighthouse CI 0.15.1 still bundles 12.6.1), local Chrome stable `--headless=new`, mobile = default simulated throttling, desktop = bundled desktop config, median of 5 runs per page and profile, served from `engine/tools/serve.js` on localhost. | 2026-10-17 | https://developer.chrome.com/blog/lighthouse-13-0 |
| D20 | HTML validation: Nu checker standalone build with embedded Java runtime, downloaded by `npm run setup` into `engine/tools/vnu/` (gitignored). Zero errors and zero warnings. | 2026-10-17 | https://validator.github.io/validator/ |
| D21 | Accessibility automation: pa11y 10 with the axe runner, WCAG 2.2 AA (pa11y's WCAG2AA tag set plus the `target-size` rule by id). Every axe violation fails the gate regardless of impact; only axe "incomplete" results are listed for human review. | 2026-10-17 | https://github.com/pa11y/pa11y |
| D22 | CSS exception list (the only non-utility CSS allowed): `@font-face` blocks for self-hosted fonts and the 5-line `@view-transition` block wrapped in a reduced-motion media query. | 2026-10-17 | bylaw 00 |
| D23 | No runtime JS library. The only candidate under 5 KB (Motion mini) adds convenience, not capability. | 2026-10-17 | spec §2 Q4 |
| D24 | Favicon set: `favicon.ico` (16/32/48), `icon.svg`, `apple-touch-icon.png` (180), `icon-192.png`. No web manifest (no PWA category in Lighthouse 12+; nothing installable). | 2026-10-17 | spec §2 Q5 |
| D26 | Lighthouse coverage on multi-locale sites: every page in the default locale and every root page; in every other locale the first page of each page type. Every other gate still runs on every page. | 2026-10-17 | R-GATE-10 |
| D27 | HTML budget 60 KB (was 50): the three-locale chrome (header, drawer, footer, switcher, per-element focus classes) is 27 KB, and the home page with only its required sections is 53 KB. A base-layer focus style would give back about 7 KB per page but conflicts with R-COL-05 and R-PREC-07; left for a later version. | 2026-10-17 | R-PERF-01 |
| D28 | Script fonts are subset at build time (subset-font/HarfBuzz): core blocks, weights 400–700. Stock Noto Sans Arabic is 166 KB; subset 53 KB. Presentation-form code points fall back to the system font. | 2026-10-17 | R-TYPO-01 |
| D29 | The style guide is built in the default locale only; its sample data is English and Nu flags English content under another locale's `lang`. | 2026-10-17 | R-PAGE-09 |
| D30 | Sites are data: entities and page recipes per locale in `sites/<name>/data/<locale>/`, detail pages generated by the engine from recipes, UI strings from the engine files with a per-site overlay in `sites/<name>/i18n/`. | 2026-10-17 | phase-4 plan |
| D31 | Motion language 0.4.0: reveals rise 12/24/32 px by preset, transform-only, scroll-driven; a fixed hover vocabulary (lift, nudge, press, underline grow, chevron); overlays enter with @starting-style; smooth scrolling and a scroll-driven floating back-to-top. The design intent is written in `engine/DESIGN.md`. | 2026-10-18 | bylaws 06, 02 |
| D32 | Rhythm scale written once (DESIGN.md §2, R-LAY-02) and enforced by `consistency/rhythm`; reflow at 320 and 375 px enforced by `a11y/reflow` with puppeteer (already present through pa11y). | 2026-10-18 | bylaws 03, 19 |
| D33 | Sample video: generated at build time from brand shapes and encoded with `ffmpeg-static` (MP4 + WebM, 1280×720, 8 s), played by a native `<video preload="none">` with a generated poster; no third-party player. | 2026-10-18 | bylaw 17 |
| D34 | Visual vocabulary (DESIGN.md §4): hero glow and dot grid, eyebrow accent rule, gradient numerals on the stats band, testimonial quote mark, inset CTA panel, logo cloud hover colour, footer hairline. Gradients and accent use are enumerated in R-COL-02 and R-COL-09. | 2026-10-18 | bylaw 05 |
| D35 | HTML budget for non-Latin scripts: 66 KB via a per-locale `overrides` entry in `budgets.json` (Arabic UTF-8 text is two bytes per character; the same page is about 6 % heavier than its English twin). | 2026-10-18 | R-PERF-01 |
| D25 | Feature policy for Baseline "Newly available" items: `@starting-style`, `transition-behavior`, Popover API, `<details name>`, `:has()`, container queries, `text-wrap: balance`, `light-dark()` are in; scroll-driven animations only behind `@supports`; anchor positioning, `closedby`, `text-wrap: pretty`, `field-sizing` are out for v1. | 2026-10-17 | spec §6 |

## Fictional facts in the reference site

The reference site describes "Northwind Dynamics", a fictional industrial-automation company. Every figure, person, office and customer is invented; see `sites/reference/DECISIONS.md` once the site exists.
