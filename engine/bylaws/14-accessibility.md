# 14 Accessibility

Purpose: WCAG 2.2 AA on every page, built in by the catalog and verified by axe plus the manual checks axe cannot do. Sources: https://www.w3.org/TR/WCAG22/, https://www.w3.org/WAI/WCAG22/quickref/, https://dequeuniversity.com/rules/axe/4.10, https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog.

### R-A11Y-01 Conformance target
MUST. Every page meets WCAG 2.2 Level AA. Automated checks are a floor; the manual list in R-A11Y-20 is the ceiling.
Why: AA is the legal baseline under the European Accessibility Act and most procurement rules.
Gate: manual: checklists/pre-delivery.md

### R-A11Y-02 Skip link
MUST. The first focusable element is `<a href="#main" class="sr-only focus:not-sr-only …">` with the "Skip to content" string; `main` has `id="main"` and `tabindex="-1"` is not needed because `main` is a landmark target.
Why: WCAG 2.4.1 Bypass Blocks.
Gate: a11y/bypass

### R-A11Y-03 Focus visible, never obscured
MUST. The focus ring in R-COL-04 is present on every control, and no sticky element (header, sub-nav, toast, cookie banner) can cover a focused element: `<html>` carries `scroll-pt-20` (R-LAY-07) so focus scrolling clears the header.
Why: WCAG 2.4.7 and 2.4.11.
Gate: manual: checklists/pre-delivery.md

### R-A11Y-04 Focus order
MUST. Focus order is DOM order; overlays appear in the DOM right after their trigger or at the end of `body` (dialogs), and the Popover API / `showModal()` move focus natively.
Why: WCAG 2.4.3; no JS focus juggling.
Gate: a11y/tabindex

### R-A11Y-05 Dialogs
MUST. Modal dialogs open with `showModal()` (via `command="show-modal"` or the script fallback), put `autofocus` on the first meaningful control, close on Escape (native), close via `<form method="dialog">` button labelled "Close", and return focus to the trigger (native).
Why: The native dialog does the WAI-ARIA modal pattern without ARIA.
Gate: manual: checklists/pre-delivery.md

### R-A11Y-06 Popovers
MUST. Popover triggers are `button[popovertarget]`; the popover's first child is focusable content or a heading; light dismiss and Escape are native; the trigger shows the open state via the `open:` variant on a `has-[:popover-open]` parent or `aria-expanded` where unavoidable (R-HTML-08).
Why: Menus and drawers must announce state and dismiss predictably.
Gate: manual: checklists/pre-delivery.md

### R-A11Y-07 Target size and spacing
MUST. Controls meet R-COMP-14 (≥ 24 px, ≥ 44 px for buttons and nav); inline links in prose are exempt per WCAG 2.5.8.
Why: WCAG 2.5.8.
Gate: manual: checklists/pre-delivery.md

### R-A11Y-08 Contrast
MUST. R-COL-03 contrast ratios hold in both colour schemes and over media (R-COL-08); axe measures `oklch()` colours; the contrast items it still marks incomplete (text over gradients, images or overlays it cannot resolve) are listed in `reports/latest.md` and checked by hand.
Why: WCAG 1.4.3 and 1.4.11; axe cannot read `oklch()` and `light-dark()` yet.
Gate: manual: checklists/pre-delivery.md

### R-A11Y-09 Motion
MUST. R-MOT-02 (all motion under `motion-safe:`), no autoplay (R-MOT-12) except the gestures of R-MOT-17 (each under 1.2 s; the CTA glow's pulses and the logo's rare glints capped at three per page view) and the art clip of D65, which is decorative, silent, plays only under `motion-safe:` and has a pause button since it loops for longer than 5 s (WCAG 2.2.2), no flashing content.
Why: WCAG 2.2.2, 2.3.1, 2.3.3.
Gate: manual: checklists/pre-delivery.md

### R-A11Y-10 Forms
MUST. Every control has a visible `label` (R-FORM-02), help and error text are linked by `aria-describedby`, required fields show "(required)" in the label text, errors are listed in a summary with links to the fields, and submission never relies on colour or a timer.
Why: WCAG 1.3.1, 3.3.1, 3.3.2, 3.3.3.
Gate: a11y/label

### R-A11Y-11 Redundant entry and consistent help
MUST. Multi-step forms carry entered values forward (GET parameters) so nothing is asked twice; the contact link sits in the same footer position on every page.
Why: WCAG 3.3.7 and 3.2.6 (new in 2.2).
Gate: manual: checklists/pre-delivery.md

### R-A11Y-12 Images and media
MUST. Alt text per R-CONT-16; video facades name the video and state its length; when a video is loaded it has captions and a transcript (a link, or the text itself under the player for a clip without speech); audio has a transcript; charts are images with the data in a table or text alternative.
Why: WCAG 1.1.1, 1.2.1–1.2.5.
Gate: a11y/image-alt

### R-A11Y-13 Language of parts
MUST. Any inline text in another language (a product name is not; a quoted sentence is) carries `lang`.
Why: WCAG 3.1.2; screen readers switch voice.
Gate: manual: checklists/new-locale.md

### R-A11Y-14 Headings and landmarks
MUST. R-HTML-04 to R-HTML-06: one `h1`, no skipped levels, labelled landmarks, every section headed.
Why: WCAG 1.3.1 and 2.4.6; the outline is the screen-reader map.
Gate: a11y/heading-order

### R-A11Y-15 Links and buttons have names
MUST. Every link and button has an accessible name from visible text or an `sr-only` span; icon-only controls never rely on `title`.
Why: WCAG 2.4.4, 4.1.2.
Gate: a11y/button-name

### R-A11Y-16 Status messages
MUST. Toasts and form status text live in a region with `aria-live="polite"` that exists in the DOM before the message appears.
Why: WCAG 4.1.3.
Gate: manual: checklists/new-component.md

### R-A11Y-17 Reflow and text spacing
MUST. Pages reflow at 320 px and 400 % zoom (R-LAY-05) and remain readable with user text spacing (line height 1.5, paragraph 2×, letter 0.12em, word 0.16em) because no container clips text.
Why: WCAG 1.4.10 and 1.4.12.
Gate: manual: checklists/pre-delivery.md

### R-A11Y-18 Pointer alternatives
MUST. Nothing requires drag, hover or multi-point gestures; carousels scroll by keyboard and by touch; tooltips are also reachable by focus.
Why: WCAG 2.1.1, 2.5.1, 2.5.7.
Gate: manual: checklists/pre-delivery.md

### R-A11Y-19 Accessibility statement
MUST. Every site ships `/legal/accessibility/` stating the conformance target, known gaps (none expected), the contact route and the review date.
Why: Required under the EAA and public-sector rules; expected by procurement.
Gate: manual: checklists/new-site.md

### R-A11Y-20 Manual checks
MUST. Before delivery, on one page per template: keyboard walk with no mouse; screen-reader read (NVDA on Windows) of header, hero, one section, footer; 400 % zoom; RTL locale visual check; Windows High Contrast; reduced-motion; print preview. Results are recorded in `reports/latest.md`.
Why: Automation covers roughly a third of WCAG; the rest needs a person.
Gate: manual: checklists/pre-delivery.md

## Checklist

- [ ] R-A11Y-01 AA target stated
- [ ] R-A11Y-02 skip link first
- [ ] R-A11Y-03 focus visible, not obscured
- [ ] R-A11Y-04 DOM order focus
- [ ] R-A11Y-05 dialog behaviour native
- [ ] R-A11Y-06 popover behaviour native
- [ ] R-A11Y-07 target sizes
- [ ] R-A11Y-08 contrast both schemes, review list checked
- [ ] R-A11Y-09 motion rules
- [ ] R-A11Y-10 form labels, errors, summary
- [ ] R-A11Y-11 no redundant entry, consistent help
- [ ] R-A11Y-12 alt, captions, transcripts
- [ ] R-A11Y-13 lang on inline foreign text
- [ ] R-A11Y-14 outline valid
- [ ] R-A11Y-15 names on controls
- [ ] R-A11Y-16 live regions pre-exist
- [ ] R-A11Y-17 reflow and text spacing
- [ ] R-A11Y-18 no pointer-only interaction
- [ ] R-A11Y-19 accessibility statement page
- [ ] R-A11Y-20 manual checks recorded
