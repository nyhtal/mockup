# 07 Components

Purpose: what every primitive and component must document and do, so adding a card to the careers page is a copy, not a decision. Inventory lives in `catalog/`; this file sets the rules each entry follows. Sources: WCAG 2.2 SC 2.5.8 Target Size, https://developer.mozilla.org/en-US/docs/Web/API/Popover_API, https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog, https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details.

### R-COMP-01 Anatomy template
MUST. Every catalog file begins with a comment block giving: name, purpose, anatomy (named parts), variants, states, spacing, motion, keyboard behaviour, a11y notes, i18n notes, content limits. A component without the block is not in the catalog.
Why: The block is the documentation an AI or a person reads before using the component.
Gate: manual: checklists/new-component.md

### R-COMP-02 States
MUST. Interactive components implement default, hover, focus-visible, active, disabled and (where data can be absent) loading, empty, error and success states, each shown on the style-guide page.
Why: A state that was never drawn gets invented inconsistently later.
Gate: manual: checklists/new-component.md

### R-COMP-03 Root identity
MUST. The component root carries `data-component="<file-name>"` and nothing else identifies it (no wrapper classes, no ids unless referenced).
Why: R-HTML-10; the gate finds components by this attribute.
Gate: consistency/component-known

### R-COMP-04 Sizes
MUST. Where a component has sizes they are `sm`, `md`, `lg` only; `md` is the default and the only size used in sections unless the anatomy block says otherwise.
Why: Three sizes are enough; defaults keep pages uniform.
Gate: manual: checklists/new-component.md

### R-COMP-05 Buttons
MUST. Variants: `primary`, `secondary`, `ghost`, `link`, `inverse`, `inverse-outline`. Classes include `group inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-md font-medium` plus the variant's colours, the focus ring and the hover vocabulary of R-MOT-07 (lift, press, arrow nudge). The primary and inverse variants end with the `arrow-right` icon unless `noArrow` is set; the icon mirrors in RTL. Labels are verb-first (bylaw 10) and never "Click here". Icon-only buttons have an `sr-only` label and `size-11`.
Why: 44 px minimum height clears WCAG 2.5.8 with margin; verb-first labels and one hover vocabulary read as actions.
Gate: manual: checklists/new-component.md

### R-COMP-06 Links in components
MUST. Card titles are the card's link (`<a>` wrapping the heading text, with `after:absolute after:inset-0` on a `relative` card to make the whole card clickable). Link text is unique per page and describes the destination; "Read more" is allowed only as `<span aria-hidden="true">` decoration after a descriptive link.
Why: Screen-reader link lists must make sense; whole-card click without nesting interactive elements.
Gate: manual: checklists/new-component.md

### R-COMP-07 Heading level is a parameter
MUST. Components that render a heading take its level as a parameter (default `h3` inside sections, `h2` for section titles) and never hard-code `h2`.
Why: The same card appears at different depths of the outline.
Gate: consistency/heading-order

### R-COMP-08 Lists for repeated items
MUST. Repeated items (cards, logos, team members, nav links, tags) are `ul`/`li`; a single card is not wrapped in a list.
Why: Screen readers announce list length; crawlers understand groups.
Gate: manual: checklists/new-component.md

### R-COMP-09 Overlays
MUST. Dropdowns, mega menus, the mobile drawer, tooltips and the locale switcher are `popover` elements opened by `button[popovertarget]` (light-dismiss and Escape are native). Modal content (video facade, gated download) is a `<dialog>` opened by `button[command="show-modal"][commandfor]` and closed by `<form method="dialog">`. Overlays never stack (R-LAY-12).
Why: Native overlays bring focus management and dismissal for free and ship no script.
Gate: manual: checklists/new-component.md

### R-COMP-10 Disclosure
MUST. Accordions and FAQs are `<details name="<group>">` with a `summary` containing the heading text; an exclusive group shares one `name`. Tabs are the same element styled horizontally at `md` and above.
Why: No ARIA tab roles to maintain; exclusive groups are native.
Gate: manual: checklists/new-component.md

### R-COMP-11 Carousel
MUST. A carousel is `<ul class="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-ps-4 ...">` with `snap-start` items, a visible scrollbar on hover, keyboard scrolling via the focusable items, no controls and no autoplay.
Why: Scroll-snap is the only carousel that needs no script.
Gate: manual: checklists/new-component.md

### R-COMP-12 Facades
MUST. Third-party video and map embeds are facades: a poster image, a play or "Open map" button, and the iframe markup inside a `<dialog>` or `<template>` so no third-party request happens until the user acts; the facade states the provider and that it loads external content. Self-hosted video uses the `video` component: a native `<video controls playsinline preload="none">` with a generated poster in an `aspect-video` frame, MP4 and WebM sources from `/assets/video/`, and a visible title and duration beside it.
Why: Embeds destroy Lighthouse and need consent; facades defer both, and a native player needs neither.
Gate: manual: checklists/new-component.md

### R-COMP-13 Icons
MUST. Icons come from the sprite allow-list in bylaw 17, sized `size-4` (inline), `size-5` (buttons, nav) or `size-6` (feature grids), always `aria-hidden="true"`.
Why: One set, three sizes.
Gate: manual: checklists/new-component.md

### R-COMP-14 Touch targets
MUST. Every control is at least 24×24 CSS px with 24 px spacing to the next target; buttons and nav links are ≥ 44 px tall.
Why: WCAG 2.5.8 minimum; 44 px matches platform guidance.
Gate: manual: checklists/pre-delivery.md

### R-COMP-15 Forms are built from primitives
MUST. Form components compose only the field primitives (input, select, textarea, checkbox, radio, switch, file) with the field wrapper that renders label, help text and error text per bylaw 16.
Why: One field anatomy across every form.
Gate: manual: checklists/new-component.md

### R-COMP-16 Style-guide page
MUST. Every site ships `/<default locale>/sys/style-guide/` (noindex) showing every primitive, component variant and state in use on that site, built from the same catalog.
Why: It is the regression page for designers and the proof that nothing was improvised.
Gate: manual: checklists/pre-delivery.md

## Checklist

- [ ] R-COMP-01 anatomy block present
- [ ] R-COMP-02 all states drawn
- [ ] R-COMP-03 data-component on root only
- [ ] R-COMP-04 sm/md/lg only
- [ ] R-COMP-05 button classes and labels
- [ ] R-COMP-06 card link pattern, unique link text
- [ ] R-COMP-07 heading level parameter
- [ ] R-COMP-08 lists for repeats
- [ ] R-COMP-09 popover/dialog patterns
- [ ] R-COMP-10 details-based disclosure and tabs
- [ ] R-COMP-11 scroll-snap carousel, no autoplay
- [ ] R-COMP-12 facades for embeds
- [ ] R-COMP-13 sprite icons, three sizes
- [ ] R-COMP-14 target sizes
- [ ] R-COMP-15 forms from field primitives
- [ ] R-COMP-16 style-guide page present
