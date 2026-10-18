# 06 Motion

Purpose: rich, smooth motion that costs nothing in Lighthouse and respects users who turn it off. Sources: https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style, https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations, https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition, https://web.dev/articles/animations-guide (compositor-only properties), https://tailwindcss.com/docs/animation.

### R-MOT-01 Compositor properties only
MUST. Animations and transitions change only `opacity` and `transform` (plus `color`, `background-color`, `border-color`, `text-decoration-color` for hover states, and `visibility` paired with opacity in `rise-in`). Nothing animates `height`, `width`, `margin`, `padding`, `top`, `left` or `box-shadow`; a shadow that must appear does so by fading a pseudo-element that carries it.
Why: Layout-affecting animation causes jank and layout shift.
Gate: manual: checklists/new-component.md

### R-MOT-02 Everything under motion-safe
MUST. Every `animate-*`, `transition-*` and `starting:` utility is prefixed `motion-safe:`. With `prefers-reduced-motion: reduce` the page shows final states instantly, including no fades.
Why: WCAG 2.3.3 and vestibular safety; "reduce" means reduce, not "fade instead".
Gate: consistency/motion-safe

### R-MOT-03 Budget
MUST. At most three elements animate in at once (staggered children count as one group of at most eight items, 60–90 ms apart per the motion preset). Travel ≤ 32 px. Durations from R-TOK-11 only. Nothing loops except `animate-pulse` on skeletons and `animate-spin` on a pending button.
Why: Motion beyond this reads as a slideshow and hides content.
Gate: manual: checklists/new-component.md

### R-MOT-04 Content is visible without motion
MUST. No element is hidden by default and revealed by animation. Reveal classes are applied only inside `@supports (animation-timeline: view())` (the `sda:` variant) or when `enhance.js` has set `data-js` (the `js:` variant); otherwise the element is simply visible.
Why: Lighthouse, crawlers and browsers without support must see the full page.
Gate: manual: checklists/pre-delivery.md

### R-MOT-05 The reveal pattern
MUST. A section or card that reveals on scroll uses exactly: `motion-safe:sda:animate-reveal motion-safe:sda:[animation-timeline:view()] motion-safe:sda:[animation-range:entry_0%_cover_30%]` (alternating media rows use `animate-reveal-start` / `animate-reveal-end` instead of `animate-reveal`) and, for the script fallback, `motion-safe:js:not-data-revealed:translate-y-4 motion-safe:js:data-revealed:translate-y-0 motion-safe:js:transition-transform motion-safe:js:duration-(--reveal-duration) motion-safe:js:ease-smooth` plus the `data-reveal` attribute the script observes. Grid items stagger with `motion-safe:sda:[animation-delay:calc(var(--reveal-stagger)*n)]` for n = 1…7. Both reveal paths move the element only; neither touches opacity.
Why: One exact string keeps reveals identical and keeps the hero out of the animation.
Gate: manual: checklists/new-component.md

### R-MOT-06 Overlay entrances
MUST. Popovers use `motion-safe:transition-discrete motion-safe:transition-[opacity,transform,display,overlay] motion-safe:duration-200 motion-safe:ease-out opacity-0 open:opacity-100 motion-safe:-translate-y-2 motion-safe:open:translate-y-0 motion-safe:starting:open:opacity-0 motion-safe:starting:open:-translate-y-2`; the drawer slides from the inline end (`translate-x-full` / `open:translate-x-0` / `starting:open:translate-x-full`). Dialogs use the same with `scale-95`/`open:scale-100`/`starting:open:scale-95` and `duration-300`, and their backdrop fades and blurs in (`backdrop:bg-ink/60 backdrop:backdrop-blur-sm backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0` with the same discrete transition).
Why: Native overlays animate in and out with no script.
Gate: manual: checklists/new-component.md

### R-MOT-07 Hover and focus
MUST. The hover vocabulary is fixed: buttons lift (`motion-safe:hover:-translate-y-px hover:shadow-md`), their trailing arrow nudges (`group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5`) and they settle on press (`active:translate-y-0 active:scale-[0.98]`); cards lift 2 px and warm their border (`hover:-translate-y-0.5 hover:border-brand-300`); link-style buttons and nav items grow an underline from the start edge (`after:` pseudo, `scale-x-0` → `hover:scale-x-100`, `origin-left rtl:origin-right`); disclosure chevrons rotate (`group-open:rotate-180`). Every transition is `motion-safe:transition-[color,background-color,border-color,transform] motion-safe:duration-150` or narrower. Hover never reveals content that is not reachable by keyboard or touch.
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
- [ ] R-MOT-10 enhance.js does two things only
- [ ] R-MOT-11 nothing animates above the fold on load
- [ ] R-MOT-12 no autoplay carousels
- [ ] R-MOT-13 smooth scroll on html; floating back-to-top scroll-driven
- [ ] R-MOT-14 scroll-driven appearance under sda only
