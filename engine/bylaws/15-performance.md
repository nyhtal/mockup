# 15 Performance

Purpose: Lighthouse 100 on performance by construction: budgets, one stylesheet, one tiny script, self-hosted fonts and images, nothing external, no layout shift, and a recorded benchmark. Sources: https://developer.chrome.com/docs/lighthouse/performance/performance-scoring, https://developer.chrome.com/blog/lighthouse-13-0, https://web.dev/articles/optimize-lcp, https://web.dev/articles/cls, https://web.dev/articles/font-best-practices.

### R-PERF-01 Budgets
MUST. Per page, uncompressed: HTML ≤ 75 KB (the header with its lockup and sound toggle, drawer, footer and locale switcher of a three-locale site with a four-group mega menu cost 30 KB of it, the `data-motion` flag on `<html>` of 0.22.0 put the German pricing page 13 B past 74 KB, each revealing section carries about 0.4 KB of heading-rise and marker-draw classes, and each grid item about 0.3 KB of its entrance preset; pages of a non-Latin-script locale get 76 KB through an `overrides` entry for that locale's path, because their text is two bytes per character in UTF-8 (78 KB for Arabic and Japanese, Japanese being three bytes a character, D58); culture pages, whose gallery carries a thumbnail and a lightbox picture per image, get 84 KB through `/careers/culture/`; the home page of a Latin-script locale gets 80 KB through an entry for `/<locale>/index.html`, and a non-Latin one 86 KB, because it is the one page that carries the hero with its proof strip and highlight, logo cloud, media rows, stats band, testimonials and CTA panel together, D36, D45), CSS ≤ 110 KB (the art clip of 0.25.0 added 1.0 KB past 105 and the gestures of 0.26.0 2.4 KB, D66; the Japanese typesetting classes of D58 added 0.2 KB past 96, the image-led hero and page-header variants of 0.11.0 1.2 KB past 98, the feature sections of 0.12.0 and the search card view of 0.13.0 about 0.5 KB each past 100, the inline office map's theme colours of 0.17.0 0.4 KB past 102, the brand version and the light backdrop of 0.18.0 1.3 KB past 103) (one purged stylesheet for the whole site; about 14 KB over Brotli), JS ≤ 2 KB, total mobile download ≤ 300 KB (`engine/budgets.json`; the noindex style-guide pages, which render about twenty sections each, get HTML ≤ 144 KB and total ≤ 400 KB via `overrides`; Arabic pages, which also load the Arabic face, get a total of 330 KB through `/ar/` and the Arabic home page through its own key, and the culture pages, whose gallery shows twelve art-library pictures, 362 KB (D60); an override's key is matched in file order, so a page's own key goes before its locale's), counted as: the HTML, every stylesheet and script, one candidate per image element (the smallest width that covers a 720 CSS px screen, from the first `<source>`), and every font file whose `unicode-range` matches text on the page. The hero image ≤ 120 KB at its largest source.
Why: Budgets make performance a build failure instead of a review comment.
Gate: budget/page

### R-PERF-02 One stylesheet
MUST. One `app.css`, compiled from the built HTML, minified, loaded with a plain `<link rel="stylesheet">` and nothing else render-blocking.
Why: Tailwind's purge against real output keeps it small; one request keeps it fast.
Gate: budget/css

### R-PERF-03 One module script
MUST. `enhance.js` is the only script file, loaded with `type="module"` (deferred) as the last child of `body`; the only inline scripts are the JSON-LD block, which is data, and the theme script of R-PREC-08 right after the viewport meta (synchronous, under 200 bytes, so a dark choice never flashes light).
Why: Zero main-thread work before first paint.
Gate: budget/js

### R-PERF-04 Fonts
MUST. At most two font files per page (one per script); each is preloaded with `crossorigin`, the page's own script first (R-I18N-11): a Latin file left for the stylesheet to find loads late at the highest priority, holds back first paint and shifts a short page when it swaps; `font-display: swap` plus metric overrides (R-TYPO-02); subsets per locale; the `system` option ships none.
Why: Fonts are the common cause of CLS and a late LCP.
Gate: manual: checklists/pre-delivery.md

### R-PERF-05 Images
MUST. R-HTML-12 and D6: AVIF only, in the `img` element's `srcset` with no second format (owner, 2026-10-23: "i dont want to support multiple images of the same thing"; a browser without AVIF, Safari 15 and older, shows no picture, only the alt text), `width`/`height`, `sizes` that matches the layout (`(min-width: 64rem) 50vw, 100vw` for split heroes, `(min-width: 48rem) 33vw, 100vw` for 3-column cards), lazy except the LCP image, which has `fetchpriority="high"` and is in the first 1 KB of body markup; on a page that opens on a plain page header, whose phone LCP is the first picture of the next section, the build promotes that picture (`promoteLcpImages`).
Why: LCP and CLS are decided by the hero image.
Gate: manual: checklists/new-component.md

### R-PERF-06 No external requests
MUST. No request leaves the origin: fonts, images, icons, scripts, styles and prefetches are local; facades defer embeds until a click.
Why: Third parties are the one thing a site owner cannot make fast.
Gate: links/external

### R-PERF-07 Zero layout shift
MUST. Every image, video facade, iframe slot and ad-free placeholder has reserved space; fonts are metric-matched; nothing inserts above existing content after load (banners, toasts appear in reserved or overlay positions).
Why: CLS must be 0.
Gate: lighthouse/mobile/performance

### R-PERF-08 No motion cost at load
MUST. R-MOT-11: nothing above the fold animates at load; reveal animations below the fold use the compositor only.
Why: Animations during load delay LCP and inflate TBT.
Gate: manual: checklists/new-page.md

### R-PERF-09 Lab targets
MUST. Lighthouse 13 mobile: performance 100, LCP ≤ 1.2 s, CLS 0, TBT 0 ms, Speed Index ≤ 1.5 s; desktop: performance 100. Median of 5 runs.
Why: The score is the sum of the metrics; name them.
Gate: lighthouse/mobile/performance

### R-PERF-10 Benchmark conditions
MUST. The gate records Lighthouse version, Chrome version, Node version, OS, commit, throttling profile and run count in `reports/latest.md`; numbers without conditions are not reported.
Why: A "100" is only meaningful with its conditions.
Gate: manual: checklists/pre-delivery.md

### R-PERF-11 Caching and compression
SHOULD. The deployment serves `/assets/` with `Cache-Control: public, max-age=31536000`, adding `immutable` only when the host gives asset names a content hash, and Brotli or gzip for text; `engine/tools/serve.js` sends the hash-free form so the gate sees it.
Why: Repeat visits and transfer size; not scored by Lighthouse 13 but still what users feel.
Gate: manual: checklists/pre-delivery.md

### R-PERF-12 DOM size
MUST. A page has at most 800 elements and a depth of at most 12; long lists paginate (R-PAGE-11).
Why: DOM size drives style and layout cost on low-end phones.
Gate: manual: checklists/new-page.md

### R-PERF-13 Icons inline, once
MUST. The SVG sprite is inlined once per page before the footer and contains only icons used on that page (built per page by the icon tool).
Why: No icon requests, no unused bytes.
Gate: manual: checklists/new-page.md

### R-PERF-14 Analytics placeholder
MUST. No analytics or tag manager ships. A single HTML comment `<!-- analytics: add after consent; see bylaw 18 -->` marks the place before `</body>`.
Why: Mockups must not pay the cost of scripts they do not need.
Gate: manual: checklists/pre-delivery.md

### R-PERF-15 Print and media queries do not bloat
SHOULD. `print:` and container-query variants are used only where a rule in bylaw 03 or 07 asks; the compiled CSS is checked for unused variant blocks at review.
Why: Tailwind only emits what is used; discipline keeps that true.
Gate: budget/css

### R-PERF-16 Rerun on change
MUST. Any change to the catalog, theme or script reruns the full gate on the reference site before merge.
Why: Performance regressions are cheap to catch and expensive to find later.
Gate: manual: checklists/pre-delivery.md

### R-PERF-17 Video
MUST. A page's video elements use `preload="none"` and a poster, so nothing of the clip loads before play; each clip is ≤ 1.5 MB per format at 1280×720 and ≤ 10 seconds for a sample; the budget gate counts the poster, not the clip. An art clip (D65) has no poster attribute: the picture under it is its poster and the LCP image, and it is 1600×900 like the picture it lies on, ≤ 1.5 MB per format; it loads only when the script plays it, so reduced motion and no script never fetch it.
Why: A video that loads with the page costs more than every other asset together.
Gate: manual: checklists/new-page.md

## Checklist

- [ ] R-PERF-01 budgets green
- [ ] R-PERF-02 one stylesheet
- [ ] R-PERF-03 one module script
- [ ] R-PERF-04 fonts ≤ 2, preload, swap, metrics
- [ ] R-PERF-05 AVIF srcset, sizes, LCP priority
- [ ] R-PERF-06 no external requests
- [ ] R-PERF-07 CLS 0
- [ ] R-PERF-08 no load animation
- [ ] R-PERF-09 lab targets met
- [ ] R-PERF-10 conditions recorded
- [ ] R-PERF-11 cache headers
- [ ] R-PERF-12 DOM size
- [ ] R-PERF-13 per-page sprite
- [ ] R-PERF-14 analytics comment only
- [ ] R-PERF-15 CSS reviewed
- [ ] R-PERF-16 gate rerun on change
- [ ] R-PERF-17 video preload none, poster, size limits
