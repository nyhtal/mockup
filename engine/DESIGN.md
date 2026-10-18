# Design intent

What the bylaws enforce, written as the taste behind them. Read this before the catalog when a site has to look and move a level above "correct". The bylaws say what is allowed; this file says what to reach for.

## 1. Principles

- **Quiet surfaces, two hues with meanings.** Pages are built from two neutral surfaces that alternate section by section. Colour appears only where it means something, and each hue means one thing:

  | Colour | Means | Appears on |
  |---|---|---|
  | brand | identity and action: "this is us; this is what you can do" | the logo mark, primary buttons, links, the current nav indicator, icon tiles, the hero glow, the stats band, timeline and step markers |
  | accent | evidence: "this is a proof point" | the eyebrow marker rule, the metric marker on case-study cards, the far end of the stats numeral gradient, the far end of the CTA panel (proof turning into action), the footer hairline (brand → accent: the whole journey) |
  | neutrals | content and hierarchy | everything else |
  | success, warning, danger | feedback about a state, never decoration, always with words or an icon | form feedback, alerts, badges, toasts, the pricing "included" check |
  | focus | where the keyboard is | every control |

  An icon tile is brand, never accent or a state colour; a trend badge takes its tone from the data.
- **Motion explains, never performs.** Every movement answers "where did this come from", "what is this" or "what did I just do": a card rises as you reach it, a framed object settles into place, a marker draws itself, a figure counts to its value, a dialog grows from where you looked. Nothing loops, nothing moves on its own, nothing hides content until it animates.
- **Depth from light, not lines.** Elevation is a soft shadow and a hairline ring, never a heavy border. A card lifts one pixel and its border warms toward the brand hue on hover. Only the hero media carries the long shadow; everything else sits flat with a ring.
- **Space is the layout.** One rhythm scale (below) decides every vertical distance. Headings sit on the start edge; only symmetric content (a logo cloud, a single quote, a form) is centred.
- **Same in every language and direction.** German is a third longer, Arabic reads from the right; a design that only works in English is not finished.
- **Signature devices.** The cut-corner mark, the accent marker rule that draws itself, the proof strip, the counting figures and the four quiet sounds are what make one site built on this engine recognisable; they are the same on every site, and the brief's two hues, radius and motion level make each site its own.

## 2. Rhythm scale

| Distance | Utilities | Where |
|---|---|---|
| Section padding | `py-16 md:py-24` (comfortable), `py-12 md:py-16` (compact) | every section; heroes `py-16 md:py-28` / `py-12 md:py-20`; page headers `py-12 md:py-16`; strips (article meta, filter bar, pagination, feedback) `py-6` |
| Heading group to body | `mt-12 md:mt-16` | every section with a title |
| Eyebrow to title, title to lede | `mt-2`, `mt-4` | section and page headers |
| Body items | `gap-6 md:gap-8` (grids), `gap-4 md:gap-8` (tile grids, two across from 320 px), `gap-8` (stats), `gap-12` (media rows) | grids and two-column layouts |
| Card internals | `mt-2` text, `mt-4` meta, `mt-auto pt-4` footer | cards |
| CTA after body | `mt-12` | sections with a button |
| Hero proof strip | `mt-12` after the buttons | heroes |

The `consistency/rhythm` check fails any section, heading group or grid outside this table.

## 3. Motion table

Every treatment is transform-only and scroll-driven (`view()`, entry 0 % to cover 30 %, `--reveal-duration`, `--ease-smooth`); the script fallback only slides. Which treatment a section gets is decided by what its content is:

| Section kind | Treatment | Why this one |
|---|---|---|
| hero, page header, first section | none | first paint is still (R-MOT-11) |
| heading group of any revealing section | rises; its eyebrow rule draws from the start edge | the marker writes the label |
| feature, service, benefit, value grids; article, case, job, office cards; help categories | rise, items staggered 5 % apart | things arrive |
| alternating media rows | slide from the inline edge, mirrored in RTL | a story told from two sides |
| team, integration, award tiles | rise, staggered | arrive |
| logo cloud | wordmarks slide from the inline start, staggered | a line of names reads in |
| stats band, case-study metric | the band rises; each figure counts from 0 once it is in view | measurement |
| testimonials grid | cards settle from 96 %, staggered; a single quote settles as one | a framed object |
| CTA panel | settles from 96 % | a framed object |
| timeline | the rule draws down; entries rise, staggered | time passes down the rule |
| steps, pricing | items rise, staggered | sequence |
| FAQ, forms, contact, footer | no entrance; interaction feedback only | reading and doing |

Conveniences and feedback:

| What | Movement | Duration and easing | Trigger |
|---|---|---|---|
| Floating back to top | fades and rises in after the first 60 vh of scroll; visibility follows | `--ease-smooth` | scroll-driven (`scroll()`) |
| Header shadow | a shadow fades in over the first 12 rem of scroll | | scroll-driven |
| Popover, menu, drawer | fade and slide 8 px (menus) or from the end edge (drawer) | 200 ms ease-out | `@starting-style` on open |
| Dialog | fade and scale from 95 %, backdrop blurs in | 300 ms ease-out | `@starting-style` on open |
| Button hover | lift 1 px, shadow deepens, arrow nudges 2 px forward (mirrored in RTL) | 150 ms | hover |
| Button press | settles back, scales to 98 % | 150 ms | active |
| Card hover | lift 2 px, shadow deepens, border warms, icon tile scales 105 % | 150 ms | hover |
| Link hover | underline grows from the start edge | 150 ms | hover |
| Disclosure | chevron rotates 180° | 150 ms | open |
| Count-up | a figure counts from 0 to its value, ease-out, then shows the build-time text | 1.2 s | first intersection (script) |
| Page navigation | cross-document view transition, header stable | browser default | navigation |

Rules that hold everything above together: compositor properties only (transform, translate, scale, opacity, colour; transition lists name `translate` and `scale`, since Tailwind's utilities set those, never `transform`), every utility under `motion-safe:`, travel never over 32 px, nothing animates above the fold at load, reduced motion shows final states (and no count), and the script fallback applies only where scroll-driven animation is unsupported.

## 4. Visual vocabulary

- **Mark**: a rounded tile in brand-600 carrying the site's initial in inverse ink, its bottom-end corner cut on the diagonal. The same path is every favicon. In the header and footer it sits 28 px tall beside the wordmark set in ink; the mark carries the colour.
- **Hero**: an asymmetric split on twelve columns (text five, media seven); the h1 at `lg:text-6xl`; a proof strip of up to three figures under the buttons, separated by hairlines; the media in a `rounded-2xl` frame with a hairline ring and the long soft shadow, with an optional highlight card (icon tile, figure, label) overlapping its top-end corner on desktop; behind it a brand glow behind the text and an accent glow behind the media, faded to the surface, no texture.
- **Eyebrow**: small caps in the brand colour with a 12 px accent rule before it; on a revealing section the rule draws itself from the start edge.
- **Stats band**: brand-700 surface, numerals at `text-4xl md:text-5xl lg:text-6xl` in a light gradient from inverse ink to accent-200 that count up, labels at 80 % inverse ink.
- **Case-study metric**: the figure in brand text, counting up; its label carries the accent marker.
- **Testimonial**: a large quote mark in brand-200 above the first line; the author line with avatar.
- **CTA**: an inset `rounded-2xl` panel on the gradient (brand-700 → brand-600 → accent-600) with a radial highlight in the top start corner; buttons inverse.
- **Logo cloud**: monochrome wordmarks in muted ink that take the brand colour on hover.
- **Cards**: raised surface, hairline border, `rounded-lg`, hover lift; tiles (team, integrations) sit two across on phones with `p-4 md:p-6`.
- **Footer**: a one-pixel brand-to-accent hairline above the columns.
- **Pictures**: every placeholder in a `rounded-xl` frame with a hairline ring; only the hero media gets the long shadow.
- **Sound**: four synthesised UI sounds behind a labelled toggle in the footer (also the header at `xl`, the drawer below `lg`; off by default, kept for the tab): a tick when switched on, a muted tone when an overlay opens, a soft tap on a primary button, two rising notes on a form submission. Never on hover, scroll, navigation or an error.

What "pizzazz" is allowed to be: glow, hairlines, gradients on large numerals and panels, the motion table, the four sounds. What it is not: parallax, auto-playing media, text that fades in, hover-only content, more than one accent, texture.

## 5. Sample media

The reference site ships a generated eight-second clip (brand shapes in motion, 1280×720, MP4 and WebM, about a megabyte each) behind a native `<video>` with a generated poster, `preload="none"` and controls. It proves the video pattern without a third-party player and without a request before play.

## 6. If you start over

1. Set the rhythm scale, the colour meanings and the motion table before drawing anything; write them into bylaws 03, 05 and 06 and the gates.
2. Build the shell (header with the mark, footer, section skeleton) with the hover and reveal vocabulary in place, then the primitives, then the sections. Do not add motion afterwards.
3. Keep a style-guide page green from the first component so every state is visible at once.
4. Put the three locales in from the first page, with a right-to-left one; the header and the heading lengths are where the design breaks.
5. Gate everything that can be measured (rhythm, reflow, budgets, contrast) so taste decisions stay about taste.
