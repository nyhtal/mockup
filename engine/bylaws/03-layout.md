# 03 Layout

Purpose: how sections, grids and spacing are arranged so every page reads as the same site and survives 320 px screens, 400 % zoom, long German words and right-to-left Arabic. Sources: WCAG 2.2 SC 1.4.10 Reflow, 1.4.4 Resize Text; https://tailwindcss.com/docs/hover-focus-and-other-states (logical properties, `rtl:`).

### R-LAY-01 One container
MUST. Every section's content sits in the container from R-TOK-10. Full-bleed backgrounds wrap the container; content never touches the viewport edge.
Why: Alignment across sections is what makes a page look designed.
Gate: manual: checklists/new-component.md

### R-LAY-02 Section rhythm
MUST. One rhythm scale (`engine/DESIGN.md` §2) sets every vertical distance: a section is `py-16 md:py-24` (`py-12 md:py-16` compact; heroes `py-16 md:py-28` / `py-12 md:py-20`; page headers `py-12 md:py-16`; strips such as article meta, filter bar, pagination and feedback `py-6`), its heading group then `mt-12 md:mt-16` before the body, grids `gap-6 md:gap-8` (stats `gap-8`, media rows `gap-12`), card internals `mt-2`/`mt-4`/`mt-auto pt-4`, a CTA after the body `mt-12`. Adjacent sections alternate `bg-surface` and `bg-surface-alt` unless a section has its own media background.
Why: Equal vertical rhythm is the cheapest consistency win on a long page, and only a written scale can be checked.
Gate: consistency/rhythm

### R-LAY-03 Grids
MUST. Multi-column layouts use `grid` with `gap-6 md:gap-8` and only these column sets: `md:grid-cols-2`, `md:grid-cols-3`, `md:grid-cols-2 lg:grid-cols-4`, or the 12-column `lg:grid-cols-12` with `col-span-*` for asymmetric splits. Items stack to one column below `md`.
Why: Four grid shapes cover every corporate section; more makes pages uneven.
Gate: manual: checklists/new-component.md

### R-LAY-04 Logical properties only
MUST. Direction-dependent utilities are logical: `ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`, `text-start`, `text-end`, `rounded-s-*`, `rounded-e-*`, `border-s`, `border-e`. Physical `pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-`, `text-left`, `text-right` are not used. Directional icons flip with `rtl:-scale-x-100`.
Why: One markup serves LTR and RTL without a second stylesheet.
Gate: consistency/logical-props

### R-LAY-05 Minimum viewport and reflow
MUST. Every page works at 320 px wide and at 400 % browser zoom with no horizontal scrolling and no clipped content; the `a11y/reflow` check loads every page at 320 px and 375 px and fails when the document is wider than the viewport at the top or the bottom of the page.
Why: WCAG 1.4.10; also the reality of small phones.
Gate: a11y/reflow

### R-LAY-06 Measure
MUST. Running text is limited to `max-w-prose` (65ch); ledes to `max-w-2xl`; headings to `max-w-3xl`. Centred intro blocks use `mx-auto` with those limits.
Why: Lines over 75 characters are hard to read.
Gate: manual: checklists/new-component.md

### R-LAY-07 Sticky header
MUST. The header is `sticky top-0 z-10` with a fixed height of `h-16`, and `<html>` carries `scroll-pt-20` so everything scrolled into view (anchor targets and keyboard focus alike) clears the header (WCAG 2.4.11). No per-target `scroll-mt-*` is needed.
Why: Sticky chrome that hides targets breaks keyboard navigation and anchors.
Gate: manual: checklists/pre-delivery.md

### R-LAY-08 Long content and overflow
MUST. Text containers use `break-words`; German pages set `hyphens-auto` on prose; tables wrap in `overflow-x-auto` with a visible scrollbar; cards clamp titles to `line-clamp-2` and bodies to `line-clamp-3`.
Why: Translations grow by a third and compound nouns do not wrap.
Gate: manual: checklists/new-locale.md

### R-LAY-09 Text expansion allowance
MUST. Any component with fixed-width text (buttons, tabs, nav items, badges) is designed to hold 135 % of the English length without truncation; nav collapses to the drawer at `lg` rather than `md` when a locale exceeds it.
Why: German and Finnish are about a third longer than English.
Gate: manual: checklists/new-locale.md

### R-LAY-10 Media aspect ratios
MUST. Images and video facades sit in a box with one of `aspect-video`, `aspect-[4/3]`, `aspect-[3/2]`, `aspect-square`, `aspect-[21/9]` and `object-cover`.
Why: Reserved space means zero layout shift.
Gate: lighthouse/mobile/performance

### R-LAY-11 Print
MUST. Header navigation, footer navigation, popovers, dialogs, decorative media and motion are `print:hidden`; prose prints with `print:text-black`; links in prose show their URL via content utilities only where the bylaw for prose allows.
Why: Legal pages and articles get printed.
Gate: manual: checklists/pre-delivery.md

### R-LAY-12 Stacking order of overlays
MUST. Only one overlay is open at a time: opening a dialog closes popovers; the mobile drawer is a popover and closes on navigation.
Why: Nested overlays trap keyboard users.
Gate: manual: checklists/pre-delivery.md

## Checklist

- [ ] R-LAY-01 container in every section
- [ ] R-LAY-02 section padding and alternation
- [ ] R-LAY-03 grids from the four shapes
- [ ] R-LAY-04 no physical direction utilities
- [ ] R-LAY-05 320 px and 400 % zoom checked
- [ ] R-LAY-06 measure limits applied
- [ ] R-LAY-07 sticky header with scroll-mt targets
- [ ] R-LAY-08 overflow and clamp rules
- [ ] R-LAY-09 135 % text allowance
- [ ] R-LAY-10 media in aspect boxes
- [ ] R-LAY-11 print variants applied
- [ ] R-LAY-12 single overlay at a time
