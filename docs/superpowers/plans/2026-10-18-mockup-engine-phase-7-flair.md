# Mockup Engine Phase 7 Plan (flair): legible motion, feature-block vocabulary, parallax, premium accents, count-up v2, a flair dial

> **Status: approved 2026-10-18; Tasks 1–4 and 6 done (bylaws, reveal engine, vocabulary, depth, count-up v2), Tasks 5, 7, 8 open.** The owner asked for research and a plan only ("don't do any of the work"). Every task below is a todo; the bylaw changes are listed per task and are applied in Task 1 when the plan is approved. Codex (gpt-6-astra) was consulted on the same brief; its recommendations are folded in and marked (C). Web research is cited at the end.

**Goal:** Motion that is unmistakable without being a slideshow, feature blocks that each arrive differently yet read as one system, selective parallax depth, three or four premium accents, a count-up that feels engineered, and a brief-level flair dial (calm / standard / expressive) that decides which of these a site gets. Still: compositor-only, scroll-driven CSS first, everything under `motion-safe:`, content complete without motion or JS, the hero still at first paint, no loops, no third-party code, Lighthouse 100 and WCAG 2.2 AA.

**Why the current motion reads as "barely moving" (C, confirmed in the browser):**

1. The standard preset rises 24 px. A 24 px move inside a page that is itself scrolling is below the noticing threshold; 40 px is where motion becomes an event.
2. The range `entry 0% → cover 30%` starts while the element is still off-screen (entry 0 % = its top edge at the viewport bottom), so the first half of the travel is never seen, and "cover 30 %" is 30 % of the element's whole passage through the viewport, not 30 % visibility: long items finish late and feel sluggish.
3. Items stagger by global index (5 % each), so the eighth item in a grid starts 35 % later than the first; later rows feel slow.
4. Every grid item does the same thing (rise), so there is nothing to compare one block against.
5. The eyebrow rule that draws is 12 px wide; the draw is invisible at reading distance.

---

## Global constraints (unchanged)

- R-MOT-01/02/04: transform and opacity only, every motion utility under `motion-safe:`, nothing hidden before reveal (reveals keep opacity 1; opacity is allowed only on decorative layers, never on text or media).
- R-MOT-11: nothing animates on first paint. New clarification: scroll-linked movement that is at identity when `scrollY` is 0 (parallax) is not an entrance and is allowed on hero media and backdrops, never on hero text or the highlight card.
- R-PREC-07: `app.css` gains only `@theme` tokens and keyframes; R-PREC-08: `enhance.js` stays ≤ 3 KB.
- Budgets: HTML ≤ 66/72/76/120 KB per D45; CSS ≤ 80 KB (currently 70 KB: new keyframes and utilities cost about 2 KB).
- Browser reality: `animation-timeline: view()` is in Chrome/Edge 115+, Safari 26+, Samsung 23+, Firefox only from 161 (≈ 88 % of users). Firefox users get the `nosda` JS fallback (a single slide), no parallax, no stagger. Acceptable; the plan does not add a JS parallax.

## Effects researched, and the verdict

| Effect | Mechanism | Verdict |
|---|---|---|
| Larger rise with a visible range | `view()`, `cover 5% → cover 25%`, 40 px | adopt (Task 2) |
| Per-column entrance vocabulary (slide-in, rise, framed settle, slide-from-end, icon pop) | transform keyframes, range shift by column | adopt (Task 3) |
| Parallax layers (hero media interior, hero glows, media-row pictures, stats backdrop, CTA highlight, logo drift) | `translate` on `scroll(root)` or a `view()` timeline, identity at scroll zero, overscanned art | adopt selectively (Task 4), ≤ 2 depth layers at once, off below `md` |
| Heading rule draw, 24 px | `before:` `scaleX` on `view()` | adopt (Task 5) |
| Reading-progress hairline in the header | fixed pseudo-element, `scaleX` on `scroll(root)` | adopt (Task 5), on every page |
| CTA light drift | decorative gradient layer translated 24 px on the panel's `view()` | adopt (Task 5, expressive) |
| Sticky editorial row (picture pinned while text blocks pass) | `lg:sticky lg:top-24`, normal flow below `lg` | adopt as a `feature-rows` variant (Task 5, expressive) |
| Icon tile pop with overshoot | `scale .82 → 1.04 → 1` at 75 % of the range | adopt for short tiles only (Task 3) |
| Count-up with reserved width, stagger, settle | JS, build-time numeric attributes | adopt (Task 6) |
| Image "curtain" reveal (a surface-coloured panel slides off the picture) | `before:` translate on `view()` | deferred: it hides imagery until scrolled (C); revisit after Tasks 2–5 land if the page still wants it |
| Clip-path image reveal, blur-in, filter animations | not compositor-only in every engine | refuse (R-MOT-01) |
| Word-by-word heading fade | opacity on text | refuse (R-MOT-04: text is never hidden) |
| Continuous logo marquee, auto-advancing anything | loops | refuse (R-MOT-03, R-MOT-12) |
| Magnetic cursor, 3D card flips, elastic text, digit slot machines, scroll hijacking | gimmicks (C) | refuse |

---

### Task 1: Bylaws 0.6.0, DESIGN.md, tokens (the contract first)

**Files:** `engine/bylaws/02-tokens.md`, `06-motion.md`, `03-layout.md`, `08-sections.md`, `19-quality-gates.md`, `engine/DESIGN.md`, `engine/DECISIONS.md` (D46–D52), `engine/CHANGELOG.md`, `engine/site-brief/TEMPLATE.md`, checklists (`npm run checklists`).

- [x] **R-TOK-12 motion presets become the flair dial.** Three levels set four tokens and a feature list:

  | Level | `--reveal-distance` (sections) | `--reveal-distance-item` | `--reveal-duration` (JS fallback) | Enables |
  |---|---|---|---|---|
  | calm | 16 px | 24 px | 300 ms | rise only, static figures, no parallax, no pop |
  | standard | 32 px | 40 px (24 px below `md`) | 480 ms | per-column vocabulary, count-up v2, heading rule, one media-depth layer (media rows), progress hairline |
  | expressive | 40 px | 48 px (28 px below `md`) | 560 ms | everything in standard plus icon pop, hero depth (media + glows), stats backdrop, CTA drift, logo drift, sticky editorial row, count-up settle |

  The reference site moves to `expressive` (it is the showcase). The mobile values come from a second token pair under `md:` (`--reveal-distance-item-sm`).
- [x] **R-TOK-13 keyframe list** grows to: `reveal`, `reveal-start`, `reveal-end`, `reveal-scale`, `reveal-settle` (translateY(var(--reveal-distance-item)) scale(.94) → none), `pop` (scale .82 → 1.04 at 75 % → 1), `draw`, `draw-y`, `parallax-sm` / `-md` / `-lg` (translateY −8/−16/−24 px → +8/+16/+24 px, linear), `drift` (translateX −12 → +12 px, mirrored under `rtl:`), `progress` (scaleX 0 → 1), `settle` (scale 1.015 → 1, 160 ms, time-based), plus the existing `drop`, `scale-in`, `fade`, `rise-in`. All transform-only; `fade` and `drop` stay for overlays.
- [x] **R-MOT-03 budget:** entrance travel ≤ 48 px (was 32); parallax total travel ≤ 48 px and at most two depth layers moving at once; the concurrent-motion budget (three groups) counts heading groups and decorative layers (C).
- [x] **R-MOT-05 reveal pattern** stops naming one exact string and names the approved presets instead: section (`entry 0% → cover 25%`), item (`cover 5% → cover 25%`, shifted +3 % per column, reset per row), media row (`cover 0% → cover 100%` for parallax, entry range for the slide), each with its keyframe. The `consistency/motion-vocabulary` check (Task 8) enforces the set.
- [x] **R-MOT-11** gains the identity-at-scroll-zero clause for parallax; the hero text and highlight card stay still.
- [x] **R-MOT-08/14** gain the reading-progress hairline (fixed, `scroll(root)`, one pixel, brand → accent, `scaleX`, origin start).
- [x] **New R-MOT-15 Parallax:** which layers may move, travel per layer, `scroll(root)` for the hero and `view()` elsewhere, overscanned artwork (`scale-[1.08]` static on the inner picture so edges never show), off below `md`, never on video controls or forms, static fallback.
- [x] **New R-MOT-16 Entrance vocabulary:** the five item treatments and the per-column assignment rule (3 columns: slide-in / rise / framed settle; 4 columns: slide-in / rise / framed settle / slide-from-end; 2 columns: slide-in / slide-from-end; tiles: rise with icon pop); never random, never per index.
- [x] **R-MOT-10 count-up clause** rewritten for v2 (Task 6): numeric value and precision come from build-time attributes, formatting through `Intl` in the page's numbering system, reserved width, 80 ms stagger capped at 240 ms, settle in expressive, reduced motion restores final text at once.
- [x] **R-LAY-02 rhythm** adds the sticky row's `lg:top-24` and the stacked text blocks' `space-y-16`.
- [x] **DESIGN.md §3** becomes the vocabulary table (treatment per section kind and per column) plus a depth table; §4 removes "parallax" from the "not" list and adds the depth and accent devices; §1 adds "motion has one more meaning: depth tells you which layer is content and which is set dressing".
- [x] DECISIONS D46 (flair dial), D47 (distances and ranges, with the four reasons above), D48 (vocabulary by column), D49 (parallax rules and the Firefox fallback), D50 (count-up v2 markup), D51 (progress hairline on every page), D52 (what was refused and why). CHANGELOG 0.6.0 (minor: nothing green goes red; the vocabulary check is new).

**Acceptance:** `npm run gate -- --only bylaws` green; `npm run checklists` clean; the brief template documents the three levels.

### Task 2: Reveal engine (shell, tokens, card wrapper)

**Files:** `engine/theme/app.css`, `engine/tools/lib/theme.js` (presets), `engine/catalog/sections/_shell.njk`, `engine/catalog/components/card.njk`, `engine/catalog/sections/_grid.njk`, `engine/tools/test/theme.test.js`.

- [x] Keyframes and tokens from Task 1 in `@theme`; `brandTokens()` emits the four distance/duration tokens per level, with the `md:` pair for items.
- [x] `_shell.njk`: `revealClasses(on, kind)` keeps section ranges; new `item(i, cols, kind)` macro returns the treatment for column `i % cols` with the range shifted +3 % per column and `animation-fill-mode: both`; `kind` can force one treatment (tiles: `rise` + `pop` on the icon). `eyebrowRule` draws a 24 px rule (`before:w-6`).
- [x] Entrance on the wrapper, hover on the child (C): the card macro puts reveal classes on the `li` and moves the hover lift, border warm and shadow to an inner `div`/`article` so the two transforms never fight. R-MOT-07 wording updated to "the card's inner element".
- [x] Heading group of a staggering section rises first (`cover 0% → cover 20%`), items follow.
- [x] JS fallback (`nosda:js:`) uses `--reveal-distance-item` and the level's duration; still translate-only, one shot.

**Acceptance:** a build test asserts the three treatments appear in column order on the home feature grid and that no `li` carries both an entrance keyframe and a hover transform.

### Task 3: Feature-block vocabulary applied

**Files:** `feature-grid.njk`, `_grid.njk` (service, product, industry, case, article, job, office, download, event cards), `benefits-grid.njk`, `values-grid.njk`, `help-categories.njk`, `integration-grid.njk`, `team-grid.njk`, `steps.njk` + component, `pricing-table.njk`, `testimonials.njk`, `awards.njk`.

- [x] Feature grid (3 columns): slide-in / rise / framed settle; icon tiles pop in all three.
- [x] Card grids: same by column count; article cards (with pictures) use framed settle only in the third column so pictures do not scale twice.
- [x] Tiles (team, integrations, awards): rise + icon or avatar pop; two across on phones keeps the +3 % shift per column.
- [x] Steps: slide-in from the start for every step (a sequence reads left to right; RTL mirrors), the number badge pops.
- [x] Pricing: slide-in / rise / framed settle (the recommended tier gets framed settle regardless of column so it lands last).
- [x] Testimonials grid keeps framed settle (scale) for all three: quotes are framed objects, not features.
- [x] Benefits (4 columns, no card): slide-in / rise / framed settle / slide-from-end.

**Acceptance:** style-guide sections pages show every grid with its vocabulary; browser pass at 1280 and 375 in en, de, ar (slides mirror).

### Task 4: Parallax depth layers

**Files:** `hero.njk`, `app.css` (`bg-hero-backdrop` split into two layers or kept as one layer translated 12 px), `feature-rows.njk`, `stats.njk` + `_shell.njk` (decorative backdrop pseudo-element for the band), `cta-band.njk`, `logo-cloud.njk`, `picture.njk` (an `overscan` option: `scale-[1.08]` static inner image inside an `overflow-hidden` frame).

- [x] Hero media interior: `+24 px` on `scroll(root)` over `0 → 80vh` (`parallax-lg`, linear), the frame clips; identity at scroll zero. Video variant: the frame moves, not the `<video>` (controls stay put) — or no hero parallax on the video variant; decide in the browser.
- [x] Hero glows: `+12 px` on the same timeline (`parallax-md`).
- [x] Media rows: pictures `−16 → +16 px` on the row's `view()`, `cover 0% → cover 100%` (`parallax-md`), overscanned; text stays.
- [x] Stats band: a decorative `before:` layer (a second, deeper brand tone or the accent glow) `−8 → +8 px` on the band's `view()` (`parallax-sm`).
- [x] CTA panel highlight: the existing radial highlight becomes its own layer drifting 24 px inline on the panel's `view()` (`drift`, mirrored in RTL).
- [x] Logo cloud: expressive only, the list drifts `−12 → +12 px` inline on its `view()`.
- [x] All parallax utilities are wrapped `md:` and `motion-safe:sda:`; nothing moves on phones or in Firefox < 161.

**Acceptance:** a build test asserts no parallax utility appears on hero text or the highlight card and none without `md:`; browser pass confirms two layers at most move in any viewport; Lighthouse mobile and desktop on `/en/` unchanged.

### Task 5: Premium accents

**Files:** `_shell.njk` (heading rule), `header.njk` (progress hairline), `cta-band.njk` (drift), `feature-rows.njk` (sticky variant), `button.njk` (optional shimmer: a `before:` highlight that translates across on hover, transform-only; decide in the browser whether it earns its place), `DESIGN.md`.

- [ ] Heading rule draws at 24 px over `cover 5% → cover 20%`; the h2's underline is not touched (text stays text).
- [ ] Reading-progress hairline: `after:` on the header, `fixed inset-x-0 top-16 h-px origin-left rtl:origin-right bg-linear-to-r from-brand-600 to-accent-600`, `animate-progress` on `scroll(root)`; present on every page (it is information, so it may stay under reduced motion — decide with R-MOT-02 in mind: the bylaw says reduce means final states; a progress bar at its final state is full width, which is wrong; keep it `motion-safe:` and accept that reduced-motion users do not get it).
- [ ] Sticky editorial row: `feature-rows` variant `sticky` (expressive): picture `lg:sticky lg:top-24 lg:self-start`, text blocks stacked `space-y-16`, ordinary flow below `lg`; no scroll trapping, no oversized spacer (C).
- [ ] Button shimmer: evaluate; keep only if it reads as light, not as a sale banner.

**Acceptance:** style guide shows each accent; the hairline sits under the header without shifting content (it is absolutely positioned).

### Task 6: Count-up v2

**Files:** `engine/scripts/enhance.js`, `stat.njk`, `card.njk` (case-study metric), `engine/tools/lib/site.js` or the section planner (emit `data-count`, `data-decimals`, `data-nu`), `build.test.js`.

- [x] Build-time attributes instead of text parsing (C): `data-count="1284"`, `data-decimals="2"` when the authored value has them, `data-nu="latn|arab"` from the site's numbering system; prefix and suffix stay in the text; the script formats with one `Intl.NumberFormat` per figure in `lang-u-nu-<nu>` and writes only when the formatted string changes.
- [x] Reserved width without inline styles: the stat value becomes an `inline-grid` with an `invisible` sizing span holding the final text (`[grid-area:1/1]`), an `aria-hidden` animated span on top, and an `sr-only` span with the final text for assistive technology; `tabular-nums whitespace-nowrap`; bidi isolation (`unicode-bidi: isolate` via `[unicode-bidi:isolate]`). About 140 bytes per figure; the budgets of D45 hold.
- [x] Timing: 1 500 ms, ease-out cubic (keep) with an 80 ms stagger per figure in document order, capped at 240 ms; start at 30 % visibility; reduced motion and mid-count preference changes restore the final text at once.
- [x] Settle (expressive only): on completion the script sets `data-counted` and the figure's utility `data-counted:motion-safe:animate-settle` scales 1.015 → 1 over 160 ms (R-TOK-13 `settle`); no bounce.
- [x] Case-study metrics and the style-guide figures get the same markup; the hero stays static.
- [x] Size: the parsing code goes, the formatter and stagger come in; target ≤ 2.6 KB total.

**Acceptance:** build test asserts the three-span markup and attributes on the band; browser check in en, de (`1.284`, `99,98 %`) and ar (Latin digits by default, Arabic-Indic when the brief sets `numberingSystem.ar = "arab"`); no layout shift measured on the band while counting (CLS 0 in a Lighthouse run on `/en/`).

### Task 7: Flair dial wiring and the reference site

**Files:** `sites/reference/site.json` (`motion: "expressive"`), `engine/tools/lib/theme.js`, `_shell.njk` and sections (a `ctx.flair` object with booleans: `vocabulary`, `pop`, `parallaxHero`, `parallaxMedia`, `drift`, `sticky`, `settle`, `progress`), `engine/tools/lib/sections.js` (passes the level), `site-brief/TEMPLATE.md`, `sites/reference/DECISIONS.md`.

- [ ] One place derives the booleans from the level; sections read booleans, never the level name.
- [ ] Style guide gets a "Motion" foundations block that shows the three levels' numbers and lists what each enables.
- [ ] Reference site decisions record the move to `expressive`.

**Acceptance:** building the reference site with each level produces a green `consistency` gate; a theme test covers the token output per level.

### Task 8: Gates, tests, measurement, report

**Files:** `engine/tools/gates/consistency.js` (+ `motion-vocabulary`), `engine/tools/test/gate-consistency.test.js`, `build.test.js`, `reports/latest.md`.

- [ ] `consistency/motion-vocabulary`: every `animate-*` class on a page is one of the approved tokens; every `view()` range on an item is one of the approved presets (section, item + 3 % steps, media, parallax); any `animate-parallax-*` or `animate-drift` without `md:` is a finding; any parallax utility inside the hero's text column is a finding.
- [ ] Budget deltas measured per page kind; D45 adjusted only if a page kind grows past its line.
- [ ] Quick loop during the work: `npm run build && npm run gate -- --skip lighthouse --sample`; pre-delivery: full gates, `npm test`, Lighthouse on `/en/`, `/en/about/team/`, `/ar/` mobile and desktop (parallax and count-up must not touch CLS or TBT).
- [ ] Browser pass recorded in the report: en, de, ar at 375, 1024, 1280; reduced motion on; Firefox (fallback path) once.

---

## Order and estimates

1 (contract) → 2 (engine) → 3 (vocabulary) → 6 (count-up) → 4 (parallax) → 5 (accents) → 7 (dial) → 8 (gates). Tasks 3, 4 and 5 are independent once 2 lands and could run in parallel sessions on separate files. Rough effort: Task 1 half a day of writing, Tasks 2–6 a day each with browser passes, 7–8 half a day.

## Open questions for the owner

1. The reference site becomes `expressive`. Is the stated default for new briefs `standard` (my recommendation: yes, the showcase is loud so the engine can prove the range) or `expressive`?
2. The progress hairline on every page, or only on article and long pages?
3. The image curtain reveal is deferred, not refused. Want it evaluated after Task 5?
4. Sound stays as it is (opt-in, four events). Any sound tied to the new motion (none proposed; Codex and I agree motion should stay silent).

## Sources

- Chrome for Developers, scroll-driven animations (range keywords, `view()` inset, progress bar with `scroll(root)`): https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- CSS-Tricks, parallax with scroll-driven animations (layer travel, `view(-100px)` flicker fix): https://css-tricks.com/bringing-back-parallax-with-scroll-driven-css-animations/
- Smashing Magazine, introduction to scroll and view progress timelines: https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/
- Ronalds Vilciņš (2026), scroll-driven animations without JavaScript (card and image reveal ranges, `@supports` wrapping): https://ronaldsvilcins.com/2026/09/03/css-scroll-driven-animations-without-javascript/
- scroll-driven-animations.style, horizontal sticky section demo (sticky plus view timeline): https://scroll-driven-animations.style/demos/horizontal-section/css/
- MDN, timeline range names: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations/Timeline_range_names
- caniuse, `animation-timeline: view()` support (Chrome 115, Safari 26, Firefox 161; 87.8 % global): https://caniuse.com/mdn-css_properties_animation-timeline_view
- CountUp.js README (easing, tabular numerals, formatting): https://unpkg.com/countup.js@2.10.1/README.md
- web.dev, compositor-only properties: https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count
