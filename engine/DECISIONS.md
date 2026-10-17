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
| D25 | Feature policy for Baseline "Newly available" items: `@starting-style`, `transition-behavior`, Popover API, `<details name>`, `:has()`, container queries, `text-wrap: balance`, `light-dark()` are in; scroll-driven animations only behind `@supports`; anchor positioning, `closedby`, `text-wrap: pretty`, `field-sizing` are out for v1. | 2026-10-17 | spec §6 |

## Fictional facts in the reference site

The reference site describes "Northwind Dynamics", a fictional industrial-automation company. Every figure, person, office and customer is invented; see `sites/reference/DECISIONS.md` once the site exists.
