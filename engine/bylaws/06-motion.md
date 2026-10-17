# 06 Motion

Purpose: rich, smooth motion that costs nothing in Lighthouse and respects users who turn it off. Sources: https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style, https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations, https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition, https://web.dev/articles/animations-guide (compositor-only properties), https://tailwindcss.com/docs/animation.

### R-MOT-01 Compositor properties only
MUST. Animations and transitions change only `opacity` and `transform` (plus `color`, `background-color`, `border-color`, `text-decoration-color` for hover states). Nothing animates `height`, `width`, `margin`, `padding`, `top`, `left` or `box-shadow`.
Why: Layout-affecting animation causes jank and layout shift.
Gate: manual: checklists/new-component.md

### R-MOT-02 Everything under motion-safe
MUST. Every `animate-*`, `transition-*` and `starting:` utility is prefixed `motion-safe:`. With `prefers-reduced-motion: reduce` the page shows final states instantly, including no fades.
Why: WCAG 2.3.3 and vestibular safety; "reduce" means reduce, not "fade instead".
Gate: consistency/motion-safe

### R-MOT-03 Budget
MUST. At most three elements animate in at once (staggered children count as one group of at most six items, 60–90 ms apart per the motion preset). Travel ≤ 24 px. Durations from R-TOK-11 only. Nothing loops except `animate-pulse` on skeletons.
Why: Motion beyond this reads as a slideshow and hides content.
Gate: manual: checklists/new-component.md

### R-MOT-04 Content is visible without motion
MUST. No element is hidden by default and revealed by animation. Reveal classes are applied only inside `@supports (animation-timeline: view())` (the `sda:` variant) or when `enhance.js` has set `data-js` (the `js:` variant); otherwise the element is simply visible.
Why: Lighthouse, crawlers and browsers without support must see the full page.
Gate: manual: checklists/pre-delivery.md

### R-MOT-05 The reveal pattern
MUST. A section or card that reveals on scroll uses exactly: `motion-safe:sda:animate-reveal motion-safe:sda:[animation-timeline:view()] motion-safe:sda:[animation-range:entry_0%_cover_30%]` and, for the script fallback, `motion-safe:js:not-data-revealed:opacity-0 motion-safe:js:transition motion-safe:js:duration-(--reveal-duration) motion-safe:js:ease-smooth motion-safe:js:data-revealed:opacity-100` plus the `data-reveal` attribute the script observes. The LCP element and anything above the fold never carries reveal classes.
Why: One exact string keeps reveals identical and keeps the hero out of the animation.
Gate: manual: checklists/new-component.md

### R-MOT-06 Overlay entrances
MUST. Popovers use `motion-safe:transition-discrete motion-safe:transition-[opacity,transform,display,overlay] motion-safe:duration-200 motion-safe:ease-out opacity-0 open:opacity-100 motion-safe:-translate-y-2 motion-safe:open:translate-y-0 motion-safe:starting:open:opacity-0 motion-safe:starting:open:-translate-y-2`. Dialogs use the same with `scale-95`/`open:scale-100` and `duration-300`, and the backdrop fades via `backdrop:` utilities.
Why: Native overlays animate in and out with no script.
Gate: manual: checklists/new-component.md

### R-MOT-07 Hover and focus
MUST. Interactive elements use `motion-safe:transition-colors motion-safe:duration-150`; cards that lift use `motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform`. Hover never reveals content that is not reachable by keyboard or touch.
Why: Fast, cheap feedback; no hover-only information.
Gate: manual: checklists/new-component.md

### R-MOT-08 Header compaction
MUST. If the header shrinks on scroll it does so with a scroll-driven animation (`sda:[animation-timeline:scroll()]` on `transform`), never with a scroll listener.
Why: Scroll listeners are the classic main-thread cost.
Gate: manual: checklists/new-component.md

### R-MOT-09 Page transitions
MUST. Cross-document view transitions are enabled by the exception-list block `@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }`. No element gets a `view-transition-name` except the header (`[view-transition-name:header]`), so only content cross-fades.
Why: Slick navigation for free in supporting browsers; plain navigation elsewhere.
Gate: manual: checklists/pre-delivery.md

### R-MOT-10 The script
MUST. `enhance.js` does only: (1) if `CSS.supports("animation-timeline: view()")` is false, observe `[data-reveal]` elements with `IntersectionObserver` and set `data-revealed` once; (2) if `"command" in HTMLButtonElement.prototype` is false, wire `button[commandfor]` to `showModal()`/`close()`. It sets `document.documentElement.dataset.js = ""` first. No other behaviour.
Why: Two fallbacks, both feature-detected, both under 2 KB.
Gate: budget/js

### R-MOT-11 No motion on load above the fold
MUST. Nothing above the fold animates on first paint: the hero, header and first section render in their final state.
Why: Load animation delays LCP and reads as slowness.
Gate: manual: checklists/new-page.md

### R-MOT-12 Carousels do not move by themselves
MUST. Scroll-snap carousels have no autoplay and no JS; scrolling is the only motion.
Why: Auto-advancing content fails WCAG 2.2.2 and distracts.
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
- [ ] R-MOT-10 enhance.js does two things only
- [ ] R-MOT-11 nothing animates above the fold on load
- [ ] R-MOT-12 no autoplay carousels
