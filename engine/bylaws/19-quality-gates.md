# 19 Quality gates

Purpose: the exact checks, commands and thresholds that decide whether a site is done. The gates are code in `engine/tools/gates/`; this file is their contract. Every other bylaw's `Gate:` line points here.

### R-GATE-01 The command
MUST. A site is gated with `npm run build -- --site <name>` followed by `npm run gate -- --site <name>`; the gate exits non-zero on any failing check and writes `reports/latest.md`.
Why: One command, one report, no interpretation.
Gate: manual: checklists/pre-delivery.md

### R-GATE-02 Bylaws
MUST. `bylaws`: every rule file parses, every rule has MUST/SHOULD, Why and Gate lines, every Gate names an existing gate or a checklist, IDs are unique and contiguous per area.
Why: The rulebook must itself be well-formed.
Gate: bylaws/format

### R-GATE-03 HTML
MUST. `html`: the Nu checker (standalone build, `npm run setup`) reports zero errors and zero warnings on every page.
Why: Validity is the foundation.
Gate: html/error

### R-GATE-04 Consistency
MUST. `consistency`: no inline `style`; exactly one `h1`; no skipped heading levels; unique ids; every class in the HTML exists in the built CSS (escaped variants and arbitrary values included); every `data-component` names a catalog file; no physical-direction utilities; every animation class under `motion-safe:`; no arbitrary lengths; no `href="#"` or `javascript:` links; every `img` has alt, width and height; the head order of R-HTML-02; title and description lengths; the rhythm scale of R-LAY-02 (`rhythm`: section padding pairs, heading-group gap, grid gaps); and the motion vocabulary (`motion-vocabulary`: every `animate-*` names a keyframe of R-TOK-13, every `animation-range` is a preset of R-MOT-05, depth keyframes carry `md:` and never sit on hero content other than its picture or backdrop, R-MOT-15).
Why: Catches improvisation mechanically.
Gate: consistency/class-exists

### R-GATE-05 Schema
MUST. `schema`: one JSON-LD block per page with an `@graph`; required types per page type from `engine/schema-contracts.json`; every `@id` reference resolves; URL-valued properties are absolute.
Why: Structured data that validates by construction.
Gate: schema/contract

### R-GATE-06 Budget
MUST. `budget`: per-page HTML, CSS, JS and total weight within `engine/budgets.json`; every referenced local asset exists.
Why: Performance as a size contract.
Gate: budget/page

### R-GATE-07 i18n
MUST. `i18n`: every locale has exactly the default locale's string keys; `<html lang>` matches the locale folder; every page with alternates has `x-default`; every alternate target exists and links back explicitly.
Why: Multi-locale correctness is not visible in one locale.
Gate: i18n/keys

### R-GATE-08 Links
MUST. `links`: crawl from every page; no broken internal links; no external links except `site.json` `allowedExternal`.
Why: Dead links and stray third parties are both defects.
Gate: links/broken

### R-GATE-09 Accessibility
MUST. `a11y`: axe-core injected into every page through puppeteer with `prefers-reduced-motion: reduce` emulated (so entrances show their final state and every element is checked at full opacity, R-MOT-04), the WCAG 2.2 AA tag set plus axe best practices, zero violations on every page whatever their impact; "incomplete" results are listed under "Needs human review" and resolved by the manual checklist before delivery; and `reflow`: every page loaded at 320 px and 375 px must not be wider than its viewport at any scroll position (the gate steps through the page half a viewport at a time). The gate runs on one shared browser, four pages at a time, with a 90 s ceiling per page; a page whose tooling fails or stalls is an `a11y/chrome` finding, and a page that redirects itself (meta refresh) is skipped and listed as such. During development `npm run gate -- --skip lighthouse --sample` checks one page per page type and locale (about thirty seconds instead of five minutes); the full sweep is the pre-delivery run.
Why: Automated floor plus a human ceiling; horizontal scrolling on a phone is the defect visitors notice first.
Gate: a11y/heading-order

### R-GATE-10 Lighthouse
MUST. `lighthouse`: Lighthouse 13 via Node API, local Chrome stable headless, mobile (default simulated throttling) and desktop (bundled desktop config), median of 5 runs per page and profile, 100 in performance, accessibility, best practices and SEO; on pages in the noindex set (R-PAGE-12) the SEO category is skipped and reported as "n/a (noindex)"; Chrome version, throttling profile and run count are recorded in the report. Pages measured: every page in the default locale and every root page; in every other locale the first page of each page type (`data-page`), so each locale's text expansion and script are exercised on every template once. The report lists, per locale and page type, which URL stood for it. Every other gate runs on every page.
Why: The headline promise, measured the same way every time.
Gate: lighthouse/mobile/performance

### R-GATE-11 Unit tests
MUST. `npm test` (Node's test runner over `engine/tools/test/*.test.js`) passes; browser-driven gate tests run with `SMOKE=1 npm test` against a built site.
Why: The gates are code and must not regress.
Gate: manual: checklists/pre-delivery.md

### R-GATE-12 Manual checklist
MUST. `checklists/pre-delivery.md` is completed and its result recorded in `reports/latest.md`, including the R-A11Y-20 checks, the R-SCH-13 Rich Results check and the R-LAY-05 reflow check.
Why: What automation cannot see still has to be seen.
Gate: manual: checklists/pre-delivery.md

### R-GATE-13 Planned checks
SHOULD. The following checks are referenced by bylaws but implemented in a later phase; until then they are covered by the manual checklist: `budget/contrast` (token-level contrast ratios in both schemes), `consistency/motion-props` (R-MOT-01), `consistency/url-policy` (R-PAGE-02), `consistency/canonical` (R-SEO-02), `consistency/no-hardcoded-strings` (R-CONT-10). Role colours need no check: the theme wipes Tailwind's palette, so a palette class fails `consistency/class-exists`. They are added as the catalog phase makes their inputs stable.
Why: Honesty about which rules are machine-checked today.
Gate: manual: checklists/pre-delivery.md

## Checklist

- [ ] R-GATE-01 build and gate commands run
- [ ] R-GATE-02 bylaws lint green
- [ ] R-GATE-03 Nu 0/0
- [ ] R-GATE-04 consistency green
- [ ] R-GATE-05 schema green
- [ ] R-GATE-06 budgets green
- [ ] R-GATE-07 i18n green
- [ ] R-GATE-08 links green
- [ ] R-GATE-09 axe 0 violations, review list cleared
- [ ] R-GATE-10 Lighthouse 100 × 4 × 2 profiles
- [ ] R-GATE-11 npm test green
- [ ] R-GATE-12 manual checklist recorded
- [ ] R-GATE-13 planned checks tracked
