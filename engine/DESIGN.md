# Design intent

What the bylaws enforce, written as the taste behind them. Read this before the catalog when a site has to look and move a level above "correct". The bylaws say what is allowed; this file says what to reach for.

## 1. Principles

- **Quiet surfaces, one accent.** Pages are built from two neutral surfaces that alternate section by section. Colour appears as the brand hue on a few elements that mean something (links, the primary button, eyebrows, numerals) and the accent hue on fewer still (the eyebrow rule, the CTA panel, the footer hairline). Nothing else is coloured.
- **Motion explains, never performs.** Every movement answers "where did this come from" or "what did I just do": a section rises as you reach it, an arrow nudges where the link goes, a dialog grows from where you looked. Nothing loops, nothing moves on its own, nothing hides content until it animates.
- **Depth from light, not lines.** Elevation is a soft shadow and a hairline ring, never a heavy border. A card lifts one pixel and its border warms toward the brand hue on hover.
- **Space is the layout.** One rhythm scale (below) decides every vertical distance. If two pages feel different, the rhythm was broken, not the content.
- **Same in every language and direction.** German is a third longer, Arabic reads from the right; a design that only works in English is not finished.

## 2. Rhythm scale

| Distance | Utilities | Where |
|---|---|---|
| Section padding | `py-16 md:py-24` (comfortable), `py-12 md:py-16` (compact) | every section; heroes `py-16 md:py-28` / `py-12 md:py-20`; page headers `py-12 md:py-16`; strips (article meta, filter bar, pagination, feedback) `py-6` |
| Heading group to body | `mt-12 md:mt-16` | every section with a title |
| Eyebrow to title, title to lede | `mt-2`, `mt-4` | section and page headers |
| Body items | `gap-6 md:gap-8` (grids), `gap-8` (stats), `gap-12` (media rows) | grids and two-column layouts |
| Card internals | `mt-2` text, `mt-4` meta, `mt-auto pt-4` footer | cards |
| CTA after body | `mt-12` | sections with a button |

The `consistency/rhythm` check fails any section, heading group or grid outside this table.

## 3. Motion table

| What | Movement | Duration and easing | Trigger |
|---|---|---|---|
| Section reveal | rise `--reveal-distance` (12 / 24 / 32 px by preset), no fade | `--reveal-duration`, `--ease-smooth` | scroll-driven (`view()`), entry 0 % to cover 30 %; script fallback slides only |
| Grid items | same rise, each item's range shifted 5 % after the previous, up to eight items, fill both ways | as above | same |
| Alternating media rows | slide from the inline start or end edge (mirrored in RTL; the section clips horizontal overflow) | as above | same |
| Floating back to top | fades and rises in after the first 60 vh of scroll; visibility follows | `--ease-smooth` | scroll-driven (`scroll()`) |
| Header shadow | a shadow fades in over the first 12 rem of scroll | | scroll-driven |
| Popover, menu, drawer | fade and slide 8 px (menus) or from the end edge (drawer) | 200 ms ease-out | `@starting-style` on open |
| Dialog | fade and scale from 95 %, backdrop blurs in | 300 ms ease-out | `@starting-style` on open |
| Button hover | lift 1 px, shadow deepens, arrow nudges 2 px forward (mirrored in RTL) | 150 ms | hover |
| Button press | settles back, scales to 98 % | 150 ms | active |
| Card hover | lift 2 px, shadow deepens, border warms, icon tile scales 105 % | 150 ms | hover |
| Link hover | underline grows from the start edge | 150 ms | hover |
| Disclosure | chevron rotates 180° | 150 ms | open |
| Page navigation | cross-document view transition, header stable | browser default | navigation |

Rules that hold everything above together: compositor properties only (transform, translate, scale, opacity, colour; transition lists name `translate` and `scale`, since Tailwind's utilities set those, never `transform`), every utility under `motion-safe:`, travel never over 32 px, nothing animates above the fold at load, reduced motion shows final states, and the script fallback applies only where scroll-driven animation is unsupported.

## 4. Visual vocabulary

- **Hero**: a radial brand glow and a second accent glow behind the content at low alpha, a faint dot grid that fades to the surface at the edges, the media in a `rounded-2xl` frame with a hairline ring and a long soft shadow.
- **Eyebrow**: small caps in the brand colour with a 12 px accent rule before it.
- **Stats band**: brand-700 surface, numerals in a light gradient from inverse ink to brand-100, labels at 80 % inverse ink.
- **Testimonial**: a large quote mark in brand-200 above the first line; the author line with avatar.
- **CTA**: an inset `rounded-2xl` panel on the gradient (brand-700 → brand-600 → accent-600) with a radial highlight in the top start corner; buttons inverse.
- **Logo cloud**: monochrome wordmarks in muted ink that take the brand colour on hover.
- **Cards**: raised surface, hairline border, `rounded-lg`, hover lift.
- **Footer**: a one-pixel brand-to-accent hairline above the columns.
- **Pictures**: every placeholder in a `rounded-xl` frame; media rows get the long shadow.

What "pizzazz" is allowed to be: glow, hairlines, gradients on large numerals and panels, motion from the table. What it is not: parallax, auto-playing media, text that fades in, hover-only content, more than one accent.

## 5. Sample media

The reference site ships a generated eight-second clip (brand shapes in motion, 1280×720, MP4 and WebM, about a megabyte each) behind a native `<video>` with a generated poster, `preload="none"` and controls. It proves the video pattern without a third-party player and without a request before play.

## 6. If you start over

1. Set the rhythm scale and the motion table before drawing anything; write them into bylaws 03 and 06 and the gates.
2. Build the shell (header, footer, section skeleton) with the hover and reveal vocabulary in place, then the primitives, then the sections. Do not add motion afterwards.
3. Keep a style-guide page green from the first component so every state is visible at once.
4. Put the three locales in from the first page, with a right-to-left one; the header and the heading lengths are where the design breaks.
5. Gate everything that can be measured (rhythm, reflow, budgets, contrast) so taste decisions stay about taste.
