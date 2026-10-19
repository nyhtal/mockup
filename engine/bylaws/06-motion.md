# 06 Motion

Purpose: rich, smooth motion that costs nothing in Lighthouse and respects users who turn it off. Sources: https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style, https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations, https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition, https://web.dev/articles/animations-guide (compositor-only properties), https://tailwindcss.com/docs/animation.

### R-MOT-01 Compositor properties only
MUST. Animations and transitions change only `opacity`, `transform`, `translate`, `scale` and `rotate` (plus `color`, `background-color`, `border-color`, `text-decoration-color` for hover states, and `visibility` paired with opacity in `rise-in`). Keyframes move with `transform`; Tailwind's `translate-*`, `scale-*` and `rotate-*` utilities set the separate `translate`, `scale` and `rotate` properties, so a transition list names those, never `transform`. Nothing animates `height`, `width`, `margin`, `padding`, `top`, `left` or `box-shadow`; a hover shadow changes without a transition, and a shadow that must fade in does so by fading a pseudo-element that carries it.
Why: Layout-affecting animation causes jank and layout shift.
Gate: manual: checklists/new-component.md

### R-MOT-02 Everything under motion-safe
MUST. Every `animate-*`, `transition-*` and `starting:` utility is prefixed `motion-safe:`. With `prefers-reduced-motion: reduce` the page shows final states instantly, including no fades.
Why: WCAG 2.3.3 and vestibular safety; "reduce" means reduce, not "fade instead".
Gate: consistency/motion-safe

### R-MOT-03 Budget
MUST. At most three groups animate in at once; a heading group, a staggered grid (at most eight items, each column's range shifted 3 % after the previous, reset per row) and a decorative depth layer each count as one. Entrance travel ≤ 48 px (the `expressive` item distance), except the drawer, which slides its own width from the inline end. Depth (R-MOT-15): total travel ≤ 48 px per layer and at most two depth layers moving in any viewport. Durations from R-TOK-11 only. Nothing loops except `animate-pulse` on skeletons and `animate-spin` on a pending button.
Why: Below 32 px an entrance competes with the page's own scrolling and goes unnoticed; above 48 px, or with more than three things moving, the page reads as a slideshow.
Gate: manual: checklists/new-component.md

### R-MOT-04 Content is visible without motion
MUST. No element is hidden by default and revealed by animation. Reveal classes are applied only inside `@supports (animation-timeline: view())` (the `sda:` variant) or, where that is unsupported (the `nosda:` variant) and `enhance.js` has set `data-js` (the `js:` variant), by the script; otherwise the element is simply visible. The two paths never apply together.
Why: Lighthouse, crawlers and browsers without support must see the full page.
Gate: manual: checklists/pre-delivery.md

### R-MOT-05 The reveal pattern
MUST. Every scroll reveal is one of these presets, each `motion-safe:sda:` with `[animation-timeline:view()]`, `[animation-fill-mode:both]` and the range named here; `_shell.njk` is the only place that writes them:

| Preset | Keyframe | Range | Used by |
|---|---|---|---|
| section | `reveal` (`reveal-scale` for a framed object) | `entry 0% → cover 25%` | sections that reveal as one |
| heading | `reveal` | `cover 0% → cover 20%` | the heading group of a section whose items stagger |
| item | the column's treatment (R-MOT-16) | `cover 5% → cover 25%`, both ends shifted +3 % per column (`cover 8% → cover 28%` for the second column, and so on), reset on every row | grid items, tiles, steps, tiers, cards |
| media row | `reveal-start` / `reveal-end`, mirrored under `rtl:`, `overflow-x-clip` on the section | `entry 0% → cover 25%` | alternating media rows, the logo cloud |
| rule | `before:animate-draw` (`before:origin-left rtl:before:origin-right`) or `before:animate-draw-y` (`before:origin-top`) | `cover 5% → cover 20%` | the eyebrow marker, the timeline rule |

"cover n %" is n % of the element's whole passage through the viewport, so the item preset starts once the item is visibly inside the viewport and is finished by a quarter of its passage. The script fallback for browsers without scroll-driven animation is `motion-safe:nosda:js:not-data-revealed:translate-y-4 motion-safe:nosda:js:data-revealed:translate-y-0 motion-safe:nosda:js:transition-transform motion-safe:nosda:js:duration-(--reveal-duration) motion-safe:nosda:js:ease-smooth` on the section plus the `data-reveal` attribute the script observes; it slides the section once and never staggers. Both paths move the element only; neither touches opacity. The entrance goes on the item's wrapper and the hover transforms of R-MOT-07 on its inner element, so the two never compound.
Why: A short list of presets keeps reveals identical across sections, keeps the hero out of the animation, and lets `consistency/motion-vocabulary` (R-GATE-13, planned) list what is allowed instead of matching one string.
Gate: manual: checklists/new-component.md

### R-MOT-06 Overlay entrances
MUST. Popovers use `motion-safe:transition-discrete motion-safe:transition-[opacity,translate,scale,display,overlay] motion-safe:duration-200 motion-safe:ease-out opacity-0 open:opacity-100 motion-safe:-translate-y-2 motion-safe:open:translate-y-0 motion-safe:starting:open:opacity-0 motion-safe:starting:open:-translate-y-2`; the drawer slides from the inline end (`translate-x-full` / `open:translate-x-0` / `starting:open:translate-x-full`). Dialogs use the same with `scale-95`/`open:scale-100`/`starting:open:scale-95` and `duration-300`, and their backdrop fades and blurs in (`backdrop:bg-ink/60 backdrop:backdrop-blur-sm backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0` with the same discrete transition).
Why: Native overlays animate in and out with no script.
Gate: manual: checklists/new-component.md

### R-MOT-07 Hover and focus
MUST. The hover vocabulary is fixed: buttons lift (`motion-safe:hover:-translate-y-px hover:shadow-md`), their trailing arrow nudges (`group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5`) and they settle on press (`active:translate-y-0 active:scale-[0.98]`); cards lift 2 px and warm their border (`hover:-translate-y-0.5 hover:border-brand-300`, on the card's inner element, never on the wrapper that carries the entrance); link-style buttons and nav items grow an underline from the start edge (`after:` pseudo, `scale-x-0` → `hover:scale-x-100`, `origin-left rtl:origin-right`); disclosure chevrons rotate (`group-open:rotate-180`). Every transition is `motion-safe:transition-[color,background-color,border-color,translate,scale] motion-safe:duration-150` or narrower; the hover shadow (`hover:shadow-md`) changes without a transition (R-MOT-01). Hover never reveals content that is not reachable by keyboard or touch.
Why: Fast, cheap feedback with one vocabulary; no hover-only information.
Gate: manual: checklists/new-component.md

### R-MOT-08 Header compaction
MUST. The header keeps its height; its shadow appears over the first 12 rem of scroll through a pseudo-element faded by a scroll-driven animation (`motion-safe:sda:after:animate-fade motion-safe:sda:after:[animation-timeline:scroll()] motion-safe:sda:after:[animation-range:0_12rem]`), never with a scroll listener. From the `standard` level the header also carries the reading-progress hairline: a one-pixel `before:` layer fixed under the bar (`before:fixed before:inset-x-0 before:top-16 before:h-px`), brand-to-accent gradient, `before:origin-left rtl:before:origin-right`, `motion-safe:sda:before:animate-progress motion-safe:sda:before:[animation-timeline:scroll(root)]`, on every page (it is the same information everywhere). It is a `motion-safe:` convenience: under reduced motion it is absent, because a progress bar in its final state would read as "done".
Why: Scroll listeners are the classic main-thread cost; a hairline that grows with the page is the cheapest sign that the page is alive.
Gate: manual: checklists/new-component.md

### R-MOT-09 Page transitions
MUST. Cross-document view transitions are enabled by the exception-list block `@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }`. No element gets a `view-transition-name` except the header (`[view-transition-name:header]`), so only content cross-fades.
Why: Slick navigation for free in supporting browsers; plain navigation elsewhere.
Gate: manual: checklists/pre-delivery.md

### R-MOT-10 The script
MUST. `enhance.js` does only: (1) if `CSS.supports("animation-timeline: view()")` is false, observe `[data-reveal]` elements with `IntersectionObserver` and set `data-revealed` once; (2) if `"command" in HTMLButtonElement.prototype` is false, wire `button[commandfor]` to `showModal()`/`close()`; (3) unless `prefers-reduced-motion: reduce`, count each `[data-count]` figure once, from 0 to the numeric value the build wrote into `data-count` (with `data-decimals` for the authored precision and `data-nu` for the locale's numbering system, R-I18N-07), over 1.5 s ease-out cubic, starting when the figure is 30 % visible and 80 ms after the previous figure of the same section (capped at 240 ms), formatting each frame with one `Intl.NumberFormat` per figure and writing only when the formatted string changes, then restoring the build-time text exactly (R-TYPO-09) and setting `data-counted`, which the `expressive` level turns into the `settle` keyframe; the figure's markup reserves its final width with an `invisible` sizing span and keeps an `sr-only` copy of the final text for assistive technology while the animated span is `aria-hidden` (never a live region); a reduced-motion change mid-count restores the final text at once; (4) keep every sound toggle (`[data-sound]`, `aria-pressed`; in the footer on every page, in the header from `xl`, in the drawer below `lg`) in step with `sessionStorage.sound` and, while it is on, play four synthesised Web Audio sounds: a tick when switched on, a muted tone when a popover, drawer, dialog or disclosure opens (`toggle` event), a soft tap when a primary button is pressed, two rising notes when a form is submitted. The audio context is created on the first click, never on load. It sets `document.documentElement.dataset.js = ""` first. No other behaviour. `data-count` goes only on figures below the fold (the stats band, case-study metrics), never in the hero.
Why: Two fallbacks and two enhancements, all feature-detected, all within the 3 KB of R-PREC-08; sound is opt-in because a site that makes noise unasked is not professional.
Gate: budget/js

### R-MOT-11 No motion on load above the fold
MUST. Nothing above the fold animates on first paint: the hero, header and first section render in their final state; the hero's proof strip and highlight card do not count. Scroll-linked movement that is at identity while `scrollY` is 0 (the depth layers of R-MOT-15 on the hero media and glows) is not an entrance and is allowed; the hero's text column and highlight card never move.
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
| hero media interior (pictures only, never video controls or a form) | `parallax-lg`, 48 px total | `scroll(root)`, `0 → 80vh` | expressive |
| hero glows (the backdrop layer) | `parallax-md`, 32 px | `scroll(root)`, `0 → 80vh` | expressive |
| media-row pictures | `parallax-md`, 32 px | the row's `view()`, `cover 0% → cover 100%` | standard |
| stats band backdrop (`before:` layer) | `parallax-sm`, 16 px | the band's `view()`, `cover 0% → cover 100%` | expressive |
| CTA panel highlight (its own absolute layer) | `drift`, 24 px inline, mirrored in RTL | the panel's `view()`, `cover 0% → cover 100%` | expressive |
| logo cloud list | `drift`, 24 px inline | its `view()`, `cover 0% → cover 100%` | expressive |

At most two depth layers move in any viewport; nothing moves below `md`; text never carries depth; browsers without scroll-driven animation get the layer at rest and no script. Everything else about depth is refused: parallax on headings, backgrounds that move everywhere, blur or filter depth.
Why: Two layers at different speeds read as a space; a third reads as a fairground. Phones have no room for depth and their scrolling is the motion.
Gate: manual: checklists/new-component.md

### R-MOT-16 Entrance vocabulary
MUST. A grid item arrives with the treatment of its column, never a random one and never by index: three columns are slide-in (`reveal-start`, mirrored in RTL) / rise (`reveal`) / framed settle (`reveal-settle`); four columns add slide-from-end (`reveal-end`) as the fourth; two columns are slide-in / slide-from-end; tiles (team, integrations, awards) rise and their icon, avatar or badge pops (`pop`, from the `expressive` level); steps all slide in from the start (a sequence reads along the writing direction) and their number badge pops; pricing tiers follow the column rule except that the recommended tier always takes the framed settle; testimonial cards keep the framed settle in every column (a quote is a framed object, not a feature); article cards take the framed settle only in the third column so a picture never scales twice. The vocabulary applies from the `standard` level; `calm` rises everything.
Why: Different behaviours in one grid show the system; the same behaviour everywhere is wallpaper, and random behaviour is noise.
Gate: manual: checklists/new-component.md

## Checklist

- [ ] R-MOT-01 transform/opacity only
- [ ] R-MOT-02 every motion class under motion-safe
- [ ] R-MOT-03 budget: ≤ 48 px entrances, three groups, two depth layers
- [ ] R-MOT-04 page complete with motion off and JS off
- [ ] R-MOT-05 reveals from the preset table only; entrance on the wrapper; not on LCP
- [ ] R-MOT-06 overlay entrance strings exact
- [ ] R-MOT-07 hover transitions cheap, no hover-only content
- [ ] R-MOT-08 header shadow and progress hairline scroll-driven
- [ ] R-MOT-09 view transition block present
- [ ] R-MOT-10 enhance.js does four things only; count-up from build-time attributes, width reserved; sound off by default
- [ ] R-MOT-11 nothing animates above the fold on load; depth at identity at rest
- [ ] R-MOT-12 no autoplay carousels
- [ ] R-MOT-13 smooth scroll on html; floating back-to-top scroll-driven
- [ ] R-MOT-14 scroll-driven appearance under sda only
- [ ] R-MOT-15 depth only on the listed layers, md+, overscanned, two at most
- [ ] R-MOT-16 item treatment by column, never random
