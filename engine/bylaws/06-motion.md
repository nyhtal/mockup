# 06 Motion

Purpose: rich, smooth motion that costs nothing in Lighthouse and respects users who turn it off. Sources: https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style, https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations, https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition, https://web.dev/articles/animations-guide (compositor-only properties), https://tailwindcss.com/docs/animation.

### R-MOT-01 Compositor properties only
MUST. Animations and transitions change only `opacity`, `transform`, `translate`, `scale` and `rotate` (plus `color`, `background-color`, `border-color`, `text-decoration-color` for hover states, and `visibility` paired with opacity in `rise-in`). Keyframes move with `transform` (or the `translate` property, in `flow`); Tailwind's `translate-*`, `scale-*` and `rotate-*` utilities set the separate `translate`, `scale` and `rotate` properties, so a transition list names those, never `transform`. Nothing animates `height`, `width`, `margin`, `padding`, `top`, `left` or `box-shadow`, with one exception: a `<details>` opened or closed by the visitor grows and shrinks its content box (`::details-content` height to and from `auto`, R-MOT-06), because the shift it causes is the answer to their click (layout shifts within 500 ms of input do not count towards CLS) and a disclosure that snaps reads as broken; a hover shadow changes without a transition, and a shadow that must fade in does so by fading a pseudo-element that carries it.
Why: Layout-affecting animation causes jank and layout shift.
Gate: manual: checklists/new-component.md

### R-MOT-02 Everything under motion-safe
MUST. Every `animate-*`, `transition-*` and `starting:` utility is prefixed `motion-safe:`. The one named exception-list utility that animates, `art-flow`, carries the same condition inside it, `@media screen and (prefers-reduced-motion: no-preference)`. With `prefers-reduced-motion: reduce` the page shows final states instantly, including no fades.
Why: WCAG 2.3.3 and vestibular safety; "reduce" means reduce, not "fade instead".
Gate: consistency/motion-safe

### R-MOT-03 Budget
MUST. At most three groups enter at once; a heading group, a grid row (its columns cascade 90 ms apart, so a four-column row finishes 270 ms after its first item) and a decorative depth layer each count as one, and a list cascades 70 ms per item for at most eight items. Entrance travel ≤ 64 px (the `expressive` item distance is 56 px), except the drawer, which slides its own width from the inline end. Depth (R-MOT-15): total travel ≤ 48 px per layer and at most two depth layers moving in any viewport. Durations from R-TOK-11 only. Nothing loops except `animate-pulse` on skeletons and `animate-spin` on a pending button, and the flowing art of a backdrop hero whose image declares `animate` (D62): 12 s, at most 96 px, moving from the first frame, paused by its switch.
Why: Below 32 px an entrance competes with the page's own scrolling and goes unnoticed; past 64 px, or with more than three things moving, the page reads as a slideshow.
Gate: manual: checklists/new-component.md

### R-MOT-04 Content is visible without motion
MUST. An entrance may hide an element only in its `pending:` state, and `pending:` (`engine/theme/app.css`) matches only on screen, with `prefers-reduced-motion: no-preference`, after `enhance.js` has set `data-entrances`, and until the script marks the element `data-revealed`. Without JavaScript, with reduced motion and in print the page renders final states. Elements already above 88 % of the window when the script starts are marked before `pending:` can apply. Text is never hidden by any other means (no word-by-word fades, no clip reveals).
Why: Crawlers, printers, people who turn motion off and browsers where the script fails must see the full page; an entrance is a courtesy, not a gate on content.
Gate: manual: checklists/pre-delivery.md

### R-MOT-05 The entrance pattern
MUST. An entrance is time-based and plays once: the element carries its from-state under `pending:` (`pending:opacity-0` plus a move), its transition under `motion-safe:data-revealed:` (`transition-[opacity,translate,scale]`, `duration-(--reveal-duration)`, `ease-reveal`, and a delay when it cascades), and `enhance.js` marks it `data-revealed` once its top crosses 88 % of the window (an `IntersectionObserver` with a `-12 %` bottom margin). The transition sits under `data-revealed:` so it exists only for the entrance itself: entering the from-state when the script starts is instant, never a fade-out. `_shell.njk` is the only place that writes entrances:

| Macro | From-state | Delay | Used by |
|---|---|---|---|
| `revealClasses(on, kind)` | the kind's move | none | sections that arrive as one, media rows, the CTA panel |
| `headingClasses(on)` | rise | none | the heading group of a section whose items arrive on their own |
| `item(i, cols, ctx, kind)` | the column's treatment (R-MOT-16) | 90 ms × column, reset each row | grid items, tiles, tiers, cards |
| `stagger(i, kind)` | the kind's move | 70 ms × index, at most 490 ms | logo cloud, timeline entries, steps, awards |
| `pop(ctx, delay)` | `scale-70`, faded, on `ease-spring` | its item's delay + 180 ms | icon tiles, avatars, step badges (expressive) |
| `zoom(ctx)` | `scale-115` inside a clipped frame, 1 200 ms | none | media-row and article pictures (standard) |
| `eyebrowRule` | `before:scale-x-0` from the start edge | 200 ms | the eyebrow marker |

Kinds: rise (`pending:translate-y-(--reveal-distance)`), `start` (`pending:-translate-x-(--reveal-distance)`, mirrored with `rtl:pending:translate-x-…`), `end` (the mirror), `settle` (rise plus `pending:scale-94`), `scale` (`pending:scale-96`). Every section whose items or rows slide clips horizontal overflow (`overflow-x-clip`) so an offset item never widens the page (R-LAY-05). The entrance goes on the item's wrapper and the hover transforms of R-MOT-07 on its inner element, and a hover scale and an arrival pop never share an element. Scroll timelines are kept for what is meant to track the scroll: depth (R-MOT-15), the progress hairline (R-MOT-08), the header shadow and the floating back to top (R-MOT-14).
Why: An entrance scrubbed by the scroll lasts exactly as long as the visitor takes to scroll past it: two wheel notches, about 190 px, in the bottom 30 % of the window, which reads as a twitch before the eye arrives (measured on 0.6.0). A time-based entrance triggered once the element is visibly on screen plays at the same pace for everyone, which is how current product sites do it.
Gate: consistency/motion-vocabulary

### R-MOT-06 Overlay entrances
MUST. Popovers use `motion-safe:transition-discrete motion-safe:transition-[opacity,translate,scale,display,overlay] motion-safe:duration-200 motion-safe:ease-out opacity-0 open:opacity-100 motion-safe:-translate-y-2 motion-safe:open:translate-y-0 motion-safe:starting:open:opacity-0 motion-safe:starting:open:-translate-y-2`; the drawer slides from the inline end (`translate-x-full` / `open:translate-x-0` / `starting:open:translate-x-full`). Dialogs use the same with `scale-95`/`open:scale-100`/`starting:open:scale-95` and `duration-300`, and their backdrop fades and blurs in (`backdrop:bg-ink/60 backdrop:backdrop-blur-sm backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0` with the same discrete transition).
Every `<details>` takes the `disclosure` utility (`disclosure-tabs` for tab sets; `primitives/disclosure.njk` writes it, `app.css` defines it, R-PREC-07): its `::details-content` box goes from height 0, clipped and transparent, to height `auto` and opaque over 300 ms on `--ease-reveal`, with `content-visibility` as a discrete transition so closing plays before the content is hidden, and `<html>` carries `[interpolate-size:allow-keywords]` so `auto` can be animated; tabs animate height only below `md`, where they stack, and only fade in at `md` and up. Browsers without `::details-content` or `interpolate-size` open and close instantly.
Why: Native overlays and disclosures animate in and out with no script.
Gate: manual: checklists/new-component.md

### R-MOT-07 Hover and focus
MUST. The hover vocabulary is fixed: buttons lift (`motion-safe:hover:-translate-y-px hover:shadow-md`), their trailing arrow nudges (`group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5`) and they settle on press (`active:translate-y-0 active:scale-[0.98]`); cards lift 2 px and warm their border (`hover:-translate-y-0.5 hover:border-brand-300`, on the card's inner element, never on the wrapper that carries the entrance); link-style buttons and nav items grow an underline from the start edge (`after:` pseudo, `scale-x-0` → `hover:scale-x-100`, `origin-left rtl:origin-right`); disclosure chevrons rotate (`group-open:rotate-180`). Every transition is `motion-safe:transition-[color,background-color,border-color,translate,scale] motion-safe:duration-150` or narrower; the hover shadow (`hover:shadow-md`) changes without a transition (R-MOT-01). Hover never reveals content that is not reachable by keyboard or touch.
Why: Fast, cheap feedback with one vocabulary; no hover-only information.
Gate: manual: checklists/new-component.md

### R-MOT-08 Header compaction
MUST. The header keeps its height; its shadow appears over the first 12 rem of scroll through a pseudo-element faded by a scroll-driven animation (`motion-safe:sda:after:animate-fade motion-safe:sda:after:[animation-timeline:scroll()] motion-safe:sda:after:[animation-range:0_12rem]`), never with a scroll listener. From the `standard` level the header also carries the reading-progress hairline: a one-pixel `before:` layer on the bar's bottom edge (`before:absolute before:inset-x-0 before:-bottom-px before:h-px`; absolute, because the bar's `backdrop-blur` makes it the containing block of fixed descendants anyway), `before:hidden` until `motion-safe:sda:before:block`, brand-to-accent gradient, `before:origin-left rtl:before:origin-right`, `motion-safe:sda:before:animate-progress motion-safe:sda:before:[animation-timeline:scroll(root)]`, on every page (it is the same information everywhere). It is a `motion-safe:` convenience: under reduced motion it is absent, because a progress bar in its final state would read as "done".
Why: Scroll listeners are the classic main-thread cost; a hairline that grows with the page is the cheapest sign that the page is alive.
Gate: manual: checklists/new-component.md

### R-MOT-09 Page transitions
MUST. Cross-document view transitions are enabled by the exception-list block `@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }`. No element gets a `view-transition-name` except the header (`[view-transition-name:header]`), so only content cross-fades.
Why: Slick navigation for free in supporting browsers; plain navigation elsewhere.
Gate: manual: checklists/pre-delivery.md

### R-MOT-10 The script
MUST. `enhance.js` does only: (1) observe every element carrying `pending:` utilities with one `IntersectionObserver` (bottom margin −12 %); from its first report, which gives positions without forcing a layout during load, mark each whose top is already above 88 % of the window `data-revealed`, then set `data-entrances`; after that, mark each `data-revealed` once when it crosses (R-MOT-05, R-MOT-11). The script never reads layout at startup (no `getBoundingClientRect`): a forced layout there was a 170 ms long task on the home page; (2) if `"command" in HTMLButtonElement.prototype` is false, wire `button[commandfor]` to `showModal()`/`close()`; (3) unless `prefers-reduced-motion: reduce`, count each `[data-count]` figure once, from 0 to the numeric value the build wrote into `data-count` (with `data-decimals` for the authored precision and `data-nu` for the locale's numbering system, R-I18N-07), over 1.5 s ease-out cubic, starting when the figure is 30 % visible and 80 ms after the previous figure of the same section (capped at 240 ms), formatting each frame with one `Intl.NumberFormat` per figure and writing only when the formatted string changes, then restoring the build-time text exactly (R-TYPO-09) and setting `data-counted`, which the `expressive` level turns into the `settle` keyframe; the figure's markup reserves its final width with an `invisible` sizing span and keeps an `sr-only` copy of the final text for assistive technology while the animated span is `aria-hidden` (never a live region); a reduced-motion change mid-count restores the final text at once; (4) keep every sound toggle (`[data-sound]`, `aria-pressed`; in the footer on every page, in the header from `xl`, in the drawer below `lg`) in step with `sessionStorage.sound`, import the sound module (`./sound.js`) when sound is on or a style-guide audition is pressed, creating the audio context synchronously in that click, and ask it for the `in` cue for each entrance it reveals after the first report and the `copy` cue when a copy succeeds; the sounds themselves are bylaw 20. It sets `document.documentElement.dataset.js = ""` first. No other behaviour. `data-count` goes only on figures below the fold (the stats band, case-study metrics), never in the hero.
Why: The entrance trigger, one fallback and two enhancements, all feature-detected, all within the 5120 bytes of R-PREC-08; sound is bylaw 20.
Gate: budget/js

### R-MOT-11 No motion on load above the fold
MUST. Nothing above the fold animates on first paint: the hero, header and first section render in their final state; the hero's proof strip and highlight card do not count. `enhance.js` marks every entrance whose top is already above 88 % of the window as revealed before it sets `data-entrances`, the flag `pending:` waits for, so content visible at load never fades in. Scroll-linked movement that is at identity while `scrollY` is 0 (the depth layers of R-MOT-15 on the hero media and glows) is not an entrance and is allowed; the hero's text column and highlight card never move. One exception: the flowing art of a backdrop hero (D62) loops behind the words from first paint under `motion-safe`, starting from the composition at rest, with a pause switch (WCAG 2.2.2); its text column still never moves.
Why: Load animation delays LCP and reads as slowness; a layer that only moves when the visitor scrolls cannot.
Gate: manual: checklists/new-page.md

### R-MOT-12 Carousels do not move by themselves
MUST. Scroll-snap carousels have no autoplay and no JS; scrolling is the only motion.
Why: Auto-advancing content fails WCAG 2.2.2 and distracts.
Gate: manual: checklists/new-component.md

### R-MOT-13 Smooth scrolling and back to top
MUST. `<html>` carries `motion-safe:scroll-smooth` so anchor links, the skip link and back-to-top scroll smoothly where motion is allowed. The footer's back-to-top link stays; a floating back-to-top button (`fixed bottom-6 end-6`, `size-11`, `#top` target) is rendered only under `sda:` support and appears through `rise-in` on a `scroll()` timeline over the first 60 vh, so it is invisible and unfocusable at the top of the page and present once the visitor has scrolled.
Why: Scrolling that jumps feels broken next to everything else that moves; a floating control must not be a hidden tab stop.
Gate: manual: checklists/new-component.md

### R-MOT-14 Scroll-driven appearance
MUST. Elements that appear or progress as the page scrolls (the floating back-to-top, the header shadow, the reading-progress hairline) use `animation-timeline: scroll()` with an explicit `animation-range` and a keyframe from R-TOK-13; they are rendered only under the `sda:` variant and have no script fallback, because they are conveniences, not content.
Why: Scroll-linked effects without JavaScript, and without a second code path to test.
Gate: manual: checklists/new-component.md

### R-MOT-15 Depth
MUST. Depth is set dressing that moves slower than the content. Only these layers may carry a depth keyframe (`parallax-*`, `drift`), all `md:` and `motion-safe:sda:`, all at identity when the page is at rest, all with the artwork overscanned (`scale-[1.08]` static on the inner picture inside an `overflow-hidden` frame) so no edge ever shows:

| Layer | Keyframe and travel | Timeline and range | Level |
|---|---|---|---|
| hero media interior (the split picture or the art of a `backdrop` or `panel` hero, never video controls, a form or the text) | `parallax-md`, 32 px, with a static `translate-y-4` under `sda:` so the picture is at identity at rest and sinks as the page scrolls; overscanned `scale-115` | `scroll(root)`, `0 → 80vh` | expressive |
| hero glows (the backdrop layer, `-inset-y-8`) | `parallax-sm`, 16 px, with `translate-y-2` likewise | `scroll(root)`, `0 → 80vh` | expressive |
| media-row pictures | `parallax-md`, 32 px | the row's `view()`, `cover 0% → cover 100%` | standard |
| stats band backdrop (`before:` layer: a diagonal tint from brand-800 to a trace of accent, R-COL-09) | `parallax-sm`, 16 px | the band's `view()`, `cover 0% → cover 100%` | expressive |
| CTA panel highlight (its own absolute layer) | `drift`, 24 px inline, mirrored in RTL | the panel's `view()`, `cover 0% → cover 100%` | expressive |
| logo cloud list | `drift`, 24 px inline | its `view()`, `cover 0% → cover 100%` | expressive |

A frame around a layer timed by its own `view()` clips with `overflow-clip`, never `overflow-hidden`: a hidden-overflow box is a scroll container and would become the layer's timeline, which then never progresses. At most two depth layers move in any viewport; nothing moves below `md`; text never carries depth; browsers without scroll-driven animation get the layer at rest and no script. Everything else about depth is refused: parallax on headings, backgrounds that move everywhere, blur or filter depth.
Why: Two layers at different speeds read as a space; a third reads as a fairground. Phones have no room for depth and their scrolling is the motion.
Gate: consistency/motion-vocabulary

### R-MOT-16 Entrance vocabulary
MUST. A grid item arrives with the treatment of its column, never a random one and never by index: three columns are slide-in (`start`, mirrored in RTL) / rise / framed settle (`settle`); four columns add slide-from-end (`end`) as the fourth; two columns are slide-in / slide-from-end; the columns of a row cascade 90 ms apart and the next row starts over. Tiles (team, integrations, awards) rise and their icon, avatar or badge pops (from the `expressive` level); steps all slide in from the start (a sequence reads along the writing direction) and their number badge pops; pricing tiers follow the column rule except that the recommended tier always settles; testimonial cards grow from 96 % (`scale`) in every column (a quote is a framed object, not a feature); article and media-row pictures settle from 115 % inside their frame (`zoom`); the bento follows the three-column rule with its lead always settling and its picture zooming; feature-index rows and spotlight points rise in sequence like a list (70 ms apart) while the spotlight picture slides in from the start and zooms; feature disclosures rise as one section (their panels move only when opened, R-MOT-06). The vocabulary applies from the `standard` level; `calm` rises everything.
Why: Different behaviours in one row, cascading, show the system; the same behaviour everywhere is wallpaper, and random behaviour is noise.
Gate: manual: checklists/new-component.md

## Checklist

- [ ] R-MOT-01 transform/opacity only
- [ ] R-MOT-02 every motion class under motion-safe
- [ ] R-MOT-03 budget: ≤ 64 px entrances, three groups, 90 ms column cascade, two depth layers
- [ ] R-MOT-04 page complete with motion off, JS off and in print
- [ ] R-MOT-05 time-based entrances from the shell macros only; transition under data-revealed:; entrance on the wrapper; not on LCP
- [ ] R-MOT-06 overlay entrance strings exact
- [ ] R-MOT-07 hover transitions cheap, no hover-only content
- [ ] R-MOT-08 header shadow and progress hairline scroll-driven
- [ ] R-MOT-09 view transition block present
- [ ] R-MOT-10 enhance.js does four things only; count-up from build-time attributes, width reserved; sound loaded on demand (bylaw 20)
- [ ] R-MOT-11 nothing animates above the fold on load; depth at identity at rest
- [ ] R-MOT-12 no autoplay carousels
- [ ] R-MOT-13 smooth scroll on html; floating back-to-top scroll-driven
- [ ] R-MOT-14 scroll-driven appearance under sda only
- [ ] R-MOT-15 depth only on the listed layers, md+, overscanned, two at most
- [ ] R-MOT-16 item treatment and delay by column, never random
