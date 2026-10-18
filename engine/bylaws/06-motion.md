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
MUST. At most three elements animate in at once (staggered children count as one group of at most eight items, each starting 5 % of the scroll range after the previous). Travel ≤ 32 px, except the drawer, which slides its own width from the inline end. Durations from R-TOK-11 only. Nothing loops except `animate-pulse` on skeletons and `animate-spin` on a pending button.
Why: Motion beyond this reads as a slideshow and hides content.
Gate: manual: checklists/new-component.md

### R-MOT-04 Content is visible without motion
MUST. No element is hidden by default and revealed by animation. Reveal classes are applied only inside `@supports (animation-timeline: view())` (the `sda:` variant) or, where that is unsupported (the `nosda:` variant) and `enhance.js` has set `data-js` (the `js:` variant), by the script; otherwise the element is simply visible. The two paths never apply together.
Why: Lighthouse, crawlers and browsers without support must see the full page.
Gate: manual: checklists/pre-delivery.md

### R-MOT-05 The reveal pattern
MUST. A section or card that reveals on scroll uses exactly: `motion-safe:sda:animate-reveal motion-safe:sda:[animation-timeline:view()] motion-safe:sda:[animation-range:entry_0%_cover_30%]` (the treatment table in DESIGN.md §3 decides the keyframe: alternating media rows and the logo cloud use `animate-reveal-start` / `animate-reveal-end`, mirrored under `rtl:` with `overflow-x-clip` on their section; framed objects (testimonial cards, the CTA panel) use `animate-reveal-scale`; the eyebrow marker uses `before:animate-draw` with `before:origin-left rtl:before:origin-right`; the timeline rule uses `before:animate-draw-y`) and, for the script fallback, `motion-safe:nosda:js:not-data-revealed:translate-y-4 motion-safe:nosda:js:data-revealed:translate-y-0 motion-safe:nosda:js:transition-transform motion-safe:nosda:js:duration-(--reveal-duration) motion-safe:nosda:js:ease-smooth` plus the `data-reveal` attribute the script observes. Grid items stagger by shifting each item's range, `motion-safe:sda:[animation-range:entry_5n%_cover_(30+5n)%] motion-safe:sda:[animation-fill-mode:both]` for n = 0…7 (`stagger(n, kind)` in `_shell.njk`), because time delays do not apply to scroll timelines; the heading group of a section whose items stagger rises on its own. Both reveal paths move the element only; neither touches opacity.
Why: One exact string per treatment keeps reveals identical across sections and keeps the hero out of the animation.
Gate: manual: checklists/new-component.md

### R-MOT-06 Overlay entrances
MUST. Popovers use `motion-safe:transition-discrete motion-safe:transition-[opacity,translate,scale,display,overlay] motion-safe:duration-200 motion-safe:ease-out opacity-0 open:opacity-100 motion-safe:-translate-y-2 motion-safe:open:translate-y-0 motion-safe:starting:open:opacity-0 motion-safe:starting:open:-translate-y-2`; the drawer slides from the inline end (`translate-x-full` / `open:translate-x-0` / `starting:open:translate-x-full`). Dialogs use the same with `scale-95`/`open:scale-100`/`starting:open:scale-95` and `duration-300`, and their backdrop fades and blurs in (`backdrop:bg-ink/60 backdrop:backdrop-blur-sm backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0` with the same discrete transition).
Why: Native overlays animate in and out with no script.
Gate: manual: checklists/new-component.md

### R-MOT-07 Hover and focus
MUST. The hover vocabulary is fixed: buttons lift (`motion-safe:hover:-translate-y-px hover:shadow-md`), their trailing arrow nudges (`group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5`) and they settle on press (`active:translate-y-0 active:scale-[0.98]`); cards lift 2 px and warm their border (`hover:-translate-y-0.5 hover:border-brand-300`); link-style buttons and nav items grow an underline from the start edge (`after:` pseudo, `scale-x-0` → `hover:scale-x-100`, `origin-left rtl:origin-right`); disclosure chevrons rotate (`group-open:rotate-180`). Every transition is `motion-safe:transition-[color,background-color,border-color,translate,scale] motion-safe:duration-150` or narrower; the hover shadow (`hover:shadow-md`) changes without a transition (R-MOT-01). Hover never reveals content that is not reachable by keyboard or touch.
Why: Fast, cheap feedback with one vocabulary; no hover-only information.
Gate: manual: checklists/new-component.md

### R-MOT-08 Header compaction
MUST. The header keeps its height; its shadow appears over the first 12 rem of scroll through a pseudo-element faded by a scroll-driven animation (`motion-safe:sda:after:animate-fade motion-safe:sda:after:[animation-timeline:scroll()] motion-safe:sda:after:[animation-range:0_12rem]`), never with a scroll listener.
Why: Scroll listeners are the classic main-thread cost.
Gate: manual: checklists/new-component.md

### R-MOT-09 Page transitions
MUST. Cross-document view transitions are enabled by the exception-list block `@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }`. No element gets a `view-transition-name` except the header (`[view-transition-name:header]`), so only content cross-fades.
Why: Slick navigation for free in supporting browsers; plain navigation elsewhere.
Gate: manual: checklists/pre-delivery.md

### R-MOT-10 The script
MUST. `enhance.js` does only: (1) if `CSS.supports("animation-timeline: view()")` is false, observe `[data-reveal]` elements with `IntersectionObserver` and set `data-revealed` once; (2) if `"command" in HTMLButtonElement.prototype` is false, wire `button[commandfor]` to `showModal()`/`close()`; (3) unless `prefers-reduced-motion: reduce`, count each `[data-count]` figure from 0 to its value once, over 1.2 s ease-out, when it first intersects (half visible), then restore its build-time text (R-TYPO-09); (4) keep every sound toggle (`[data-sound]`, `aria-pressed`; in the footer on every page, in the header from `xl`, in the drawer below `lg`) in step with `sessionStorage.sound` and, while it is on, play four synthesised Web Audio sounds: a tick when switched on, a muted tone when a popover, drawer, dialog or disclosure opens (`toggle` event), a soft tap when a primary button is pressed, two rising notes when a form is submitted. The audio context is created on the first click, never on load. It sets `document.documentElement.dataset.js = ""` first. No other behaviour. `data-count` goes only on figures below the fold (the stats band, case-study metrics), never in the hero.
Why: Two fallbacks and two enhancements, all feature-detected, all within the 3 KB of R-PREC-08; sound is opt-in because a site that makes noise unasked is not professional.
Gate: budget/js

### R-MOT-11 No motion on load above the fold
MUST. Nothing above the fold animates on first paint: the hero, header and first section render in their final state; the hero's proof strip and highlight card do not count.
Why: Load animation delays LCP and reads as slowness.
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
MUST. Elements that appear as the page scrolls (the floating back-to-top, the header shadow) use `animation-timeline: scroll()` with an explicit `animation-range` and a keyframe from R-TOK-13; they are rendered only under the `sda:` variant and have no script fallback, because they are conveniences, not content.
Why: Scroll-linked effects without JavaScript, and without a second code path to test.
Gate: manual: checklists/new-component.md

## Checklist

- [ ] R-MOT-01 transform/opacity only
- [ ] R-MOT-02 every motion class under motion-safe
- [ ] R-MOT-03 budget respected
- [ ] R-MOT-04 page complete with motion off and JS off
- [ ] R-MOT-05 reveal string exact; not on LCP
- [ ] R-MOT-06 overlay entrance strings exact
- [ ] R-MOT-07 hover transitions cheap, no hover-only content
- [ ] R-MOT-08 header compaction scroll-driven
- [ ] R-MOT-09 view transition block present
- [ ] R-MOT-10 enhance.js does four things only; data-count below the fold; sound off by default
- [ ] R-MOT-11 nothing animates above the fold on load
- [ ] R-MOT-12 no autoplay carousels
- [ ] R-MOT-13 smooth scroll on html; floating back-to-top scroll-driven
- [ ] R-MOT-14 scroll-driven appearance under sda only
