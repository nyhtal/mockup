# Bylaw changelog

Semver per R-PREC-05: major = a previously green site now fails a gate; minor = new rule with a new gate; patch = wording.

## 0.3.0 — 2026-10-17

Reference-site phase. Sites are data (D30): entities and page recipes per locale, engine-generated detail pages, thank-you pages, HTML site map and Atom feed, per-site string overlay, per-page font preload (R-I18N-11). Lighthouse page-type sampling per locale (R-GATE-10, D26). HTML budget 60 KB (R-PERF-01, D27). Script fonts subset at build time (R-TYPO-01, D28). Style guide in the default locale only (R-PAGE-09, R-COMP-16, D29). Language names in the system font (R-I18N-11). Non-home pages open with a page-header built from their title (R-SEC-08); breadcrumbs skip segments without a page (R-SEO-11). New string keys `ui.readingTime`, `ui.tags`, `ui.allPages`.

## 0.2.0 — 2026-10-17

Catalog phase. Seven consistency checks replace manual items: `logical-props` (R-LAY-04), `motion-safe` (R-MOT-02), `no-arbitrary-lengths` (R-TOK-01, R-TOK-03), `no-hash-links` (R-HTML-09), `img-attrs` (R-HTML-12), `head-order` (R-HTML-02, R-SEO-01), `meta-length` (R-HTML-03, R-CONT-08). CSS budget 80 KB raw with gzip sizes reported; style-guide pages get an HTML budget override (R-PERF-01). Portrait ratio 3:4 added (R-LAY-10). Button variants `inverse` and `inverse-outline` for brand backgrounds. Digits default to Latin in every locale (R-I18N-07). Social images use a system font (R-SEO-06). Reveal pattern names the `data-reveal` attribute (R-MOT-05).

## 0.1.1 — 2026-10-17

Review fixes before the catalog phase. Gate lines now name a check the gate actually exports (45 rules moved to manual checklist items or a correct check; planned checks listed in R-GATE-13). Noindex pages skip the Lighthouse SEO category (R-GATE-10, R-PAGE-12). Dark mode via `light-dark()` recorded as a spec override with its fallback (R-TOK-05, D7). Page-weight counting rule written into R-PERF-01. `scroll-pt-20` on `html` replaces per-target `scroll-mt` (R-LAY-07). Overlay exits animate (R-MOT-06). Contradictions fixed in R-HTML-02, R-HTML-06, R-HTML-17, R-TOK-02, R-TOK-09, R-TOK-11, R-MOT-05, R-SCH-04, R-SCH-11, R-PERF-11, R-A11Y-03, R-A11Y-08.

## 0.1.0 — 2026-10-17

Initial draft of bylaws 00–19, engine decisions D1–D25, schema contracts for every page type, and the nine quality gates (bylaws, html, consistency, schema, budget, i18n, links, a11y, lighthouse). Catalog, reference site and checklists follow in the next phase.
