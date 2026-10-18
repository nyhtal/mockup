# Design level-up (bylaws 0.5.0): first impression, motion by purpose, colour meaning, logo mark, count-up, two-across tiles, sound

Date: 2026-10-18. Status: built under the owner's brief ("take the design up a notch or two … nothing gimmicky, professional quality, clean elegance, congruent but unique"); the owner was offline while this was written, so every choice below is made under the stated intent and is reversible per item. Codex (gpt-6-astra, read-only) was consulted on the same brief; its points are folded in and marked (C).

## 1. Intent

What the owner asked, and what done looks like:

| Ask | Done means |
|---|---|
| Level up the first impression | The home hero reads as editorial, not template: asymmetric 5/7 split, display heading, a proof strip, a floating highlight card over the media, a quieter backdrop. |
| Sections slide or do different effects, showcasing treatments | Every section kind has a named treatment chosen by what the content is (rise, slide, scale, draw, stagger, count), written in one table and enforced by the catalog. |
| Big numbers count up | The stats band and case-study metrics count from 0 to their value once, when scrolled into view, with locale formatting intact, skipped under reduced motion, text complete without JS. |
| A logo in the header | A generated mark (brief-derived) paired with the wordmark, in header, footer and favicons. |
| Colours have meaning | A colour-meaning table in DESIGN.md; every use that contradicts it is fixed. |
| Some mobile tiles two across | Short tiles (team, integrations, awards, logos, stats) sit two across from 320 px; descriptive cards stay single-column. |
| Sound effects | Four synthesised sounds behind an explicit toggle, off by default, session-scoped. |
| Consult Codex | Done; see (C) marks. |
| Congruent but unique | Everything above derives from the same two hues, one rhythm scale and one motion table; the mark, the eyebrow rule, the proof strip and the count are the site's signature devices. |

Not in scope: new page types, new sections, a dark-mode toggle, a motion library, a Lighthouse re-benchmark of all 288 pages (the home page and one interior page are re-run).

## 2. Colour meaning (DESIGN.md §1, R-COL-02, R-COL-09)

| Colour | Means | Appears on |
|---|---|---|
| brand | identity and action: "this is us; this is what you can do" | logo mark, primary buttons, links, nav current indicator, icon tiles, hero glow, stats band surface, timeline and step markers |
| accent | evidence: "this is a proof point" | the eyebrow marker rule, the metric marker on case-study cards, the far end of the stats numeral gradient, the CTA panel's end colour (proof turning into action), the footer hairline (brand → accent: the whole journey) |
| neutrals (surface, surface-alt, surface-raised, ink, ink-muted, line) | content and hierarchy; two surfaces alternate by section | everything else |
| success / warning / danger | feedback about state, never decoration, always with words or an icon | form feedback, alerts, badges, toasts, the pricing "included" check |
| focus | where the keyboard is | every control |

Fixes (C): values-grid and awards icon tiles use accent (decoration, not evidence) → brand; the badges section uses success colours on certification icons (state as decoration) → brand; stat trend badges are always success → the tone comes from data (`trendTone`, default success); R-COL-02 says accent never appears in the hero while R-COL-09 allows the hero accent glow → R-COL-02 lists the hero glow; the R-COL-09 checklist line says "hero and CTA band" → lists all four gradients.

## 3. Logo mark (new primitive `logo`; R-ASSET-09; favicons)

A monogram tile: a rounded square in brand-600 carrying the site's initial in inverse ink, with its bottom-end corner cut on the diagonal. The cut corner is the silhouette (C: one colour, no gradient, one distinctive corner); the initial is the brief-derived part; the same shape is drawn by `monogramSvg` for every favicon so tab, home screen and header match. The mark is 28 px in the header (`size-7`, `xl:size-8`), paired with the wordmark now set in `ink` (the mark carries the colour). Not mirrored in RTL. The `logo` primitive = mark + wordmark inside the existing link.

## 4. Hero (R-SEC-07, R-TYPO-04, DESIGN §4)

- Split and video variants use `lg:grid-cols-12`: text seven columns at `lg` and five at `xl`, media the rest (C). At `lg` a five-column text block wrapped the English heading to five lines and a six-column one broke the German compound "Steuerungssoftware" mid-word (no hyphenation dictionary can be assumed), so the measure wins at `lg` and the editorial split arrives at `xl`.
- h1 `text-4xl md:text-5xl xl:text-6xl` in heroes only (R-TYPO-04 gains the hero line); page headers unchanged.
- Proof strip: optional `s.proof` (≤ 3 `{ value, label }`) under the buttons, values `font-semibold tabular-nums`, items separated by hairlines (logical `divide-x divide-line`). Static: nothing above the fold animates (R-MOT-11).
- Highlight card: optional `s.highlight` `{ icon, value, label }`, a `surface-raised` card with `shadow-lg`, overlapping the media's bottom-start corner at `lg`, inline under the media below `lg`. It never counts (it is in view at load on desktop).
- Caption under the media stays for video.
- Backdrop: dot grid removed; the two glows kept, brand glow behind the text, accent glow behind the media (C: identity from type and image, not texture).
- Secondary action stays a secondary button (the bylaw pairs one primary with one secondary; a text link reads as a third weight).

## 5. Motion by purpose (DESIGN §3, R-MOT-05, R-TOK-13)

New keyframes (transform-only, in `@theme`): `reveal-scale` (scale .96 → 1) and `draw` (scaleX 0 → 1, origin inline start; `draw-y` for vertical rules). All ride `view()` like `reveal`; the script fallback stays a translate.

| Section kind | Treatment | Why this one |
|---|---|---|
| hero, page header, first section | none | first paint is still |
| heading group of any revealing section | rises; its eyebrow rule draws from the start edge | the marker "writes" the label |
| feature/service/benefit/value grids, article, case, job, office cards, help categories | rise, items stagger by range (existing) | things arrive |
| alternating media rows | slide from the inline edge, mirrored in RTL (existing) | a story told from two sides |
| team, integration, award tiles | rise, stagger | arrive |
| logo cloud | wordmarks slide from the inline start, staggered | a line of names reads in |
| stats band | band rises; numerals count once in view | measurement |
| case-study metric | counts once in view | measurement |
| testimonials grid | cards scale .96 → 1, staggered | a framed object |
| CTA panel | scales .96 → 1 | a framed object (C) |
| timeline | the rule draws down; entries rise | time passes down the rule |
| steps (horizontal) | steps rise, staggered | sequence |
| pricing | tiers rise, staggered | the one to look at is already marked |
| FAQ, forms, contact, footer | no entrance; interaction feedback only (C) | reading and doing |

Rules unchanged: compositor-only, `motion-safe:`, ≤ 32 px travel, three groups at once, eight staggered items, reduced motion shows final states, nothing hidden before reveal.

## 6. Count-up (R-MOT-10, R-TYPO-09, stat component)

`enhance.js` gains behaviour (3): for every `[data-count]`, an `IntersectionObserver` starts a one-shot 1.2 s ease-out count from 0 to the element's number, rendering intermediate frames with `Intl.NumberFormat(html.lang)` at the value's decimal count and the original prefix/suffix (`+`, `%`, `×`), then restores the build-time text exactly (so locale formatting is still decided at build, R-TYPO-09). Skipped under `prefers-reduced-motion: reduce` and when the text has no digits. The element keeps `tabular-nums`; it is a block in a grid cell, so the growing text shifts nothing (CLS 0). Only below-the-fold elements carry `data-count` (stats band, case-study metric). (C: one-shot, below the fold, final text intact, no odometer.)

## 7. Two across (R-LAY-02, R-LAY-03, DESIGN §2)

Tile grids get `grid-cols-2` from 320 px with the new tile gap `gap-4 md:gap-8` (added to the rhythm scale and the `consistency/rhythm` gate): team-grid, integration-grid; awards keep `flex-wrap` with `w-36` tiles (two fit at 320); stats already two across; the logo cloud wraps. Tile cards use `p-4 md:p-6`. Descriptive grids (services, products, industries, cases, articles, jobs, offices, downloads, events, help, values, benefits, pricing, testimonials, forms) stay single-column below `md` (C: two padded cards at 320 px leave too little reading width). Checked in de and ar at 320 and 375 by `a11y/reflow` plus eyes.

## 8. Sound (R-MOT-10, R-PREC-08, header, drawer, DECISIONS)

Synthesised with the Web Audio API, no files, created on the first user gesture. Off by default. A toggle button (`aria-pressed`, label "Sound effects", icons `volume-x` / `volume-2`) sits in the footer of every page, in the header actions from `xl` (the `lg` bar cannot take a fifth action in German) and in the drawer below `lg`. The choice is kept in `sessionStorage` (the tab's lifetime, no cookie, nothing persistent; the build test that forbids `localStorage` and cookies stays). Four events (C: scarce, never hover, scroll, navigation or error):

| Event | Sound |
|---|---|
| sound switched on | a 60 ms tick (confirms it works) |
| a popover, drawer or dialog opens | an 80 ms muted tone |
| a primary button is pressed | a 40 ms soft tap |
| a form is submitted | two quiet ascending sine notes under 180 ms |

Gains ≤ 0.08, exponential decay, nothing on load, nothing while the toggle is off.

## 9. Template signals removed (C)

The default `zap` icon becomes a neutral `layers`; the "Read more" decoration stays on service and download cards only (integration cards lose it); media-row pictures lose the heavy shadow and keep the hairline ring; section headings are start-aligned by default and centred only where the content is symmetric (logo cloud, awards, single testimonial, newsletter, confirmation, error state, search box, feedback strip, media-kit CTA, CTA band).

## 10. Bylaws, decisions, gates, budgets

- Bylaws 0.5.0: R-TOK-13 (keyframe list), R-LAY-02/03 (tile gap and two-across list), R-TYPO-04 (hero h1 line; stat value `text-5xl md:text-6xl` on the band), R-TYPO-09 (count-up clause), R-COL-02/09 (table above), R-MOT-05 (scale and draw kinds, stagger kinds), R-MOT-10 (four behaviours), R-SEC-07 (proof strip, highlight), R-ASSET-09 (mark in favicons), R-PREC-08 (sessionStorage clause). `npm run checklists` regenerates the manual lists.
- DECISIONS D39–D44: colour meaning, mark, motion-by-purpose, count-up, two-across, sound.
- Budgets: JS 3072 B (the four behaviours minify to 2.15 KB; D42); HTML budgets measured and raised to 66 KB default, 72 KB Latin home and Arabic pages, 76 KB Arabic home, 120 KB style guide (D45), after the gate reported 16 pages over the 0.4.0 numbers.
- Gates: `consistency/rhythm` learns the tile gap; a build test covers the mark, the toggle markup, `data-count` placement and the script's size and allow-list.

## 11. Testing

`npm test`; `npm run build`; `npm run gate -- --skip lighthouse`; Lighthouse on `/en/` and `/en/about/team/` mobile and desktop; browser pass in en, de, ar at 375 and 1280 px: hero composition, count-up once, reveals per table, two-across tiles, sound toggle on and off across a navigation, drawer at 320 px, header fit in German at 1024 px.
