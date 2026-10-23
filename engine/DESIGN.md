# Design intent

What the bylaws enforce, written as the taste behind them. Read this before the catalog when a site has to look and move a level above "correct". The bylaws say what is allowed; this file says what to reach for.

## 1. Principles

- **Quiet surfaces, two hues with meanings.** Pages are built from two neutral surfaces that alternate section by section. Colour appears only where it means something, and each hue means one thing:

  | Colour | Means | Appears on |
  |---|---|---|
  | brand | identity and action: "this is us; this is what you can do" | the logo mark, primary buttons, links, the current nav indicator, icon tiles, the hero glow, the stats band, timeline and step markers |
  | accent | evidence: "this is a proof point" | the eyebrow marker rule, the metric marker on case-study cards, the far end of the stats numeral gradient, the far end of the CTA panel (proof turning into action), the footer hairline and the reading-progress hairline (brand → accent: the whole journey) |
  | neutrals | content and hierarchy | everything else |
  | success, warning, danger | feedback about a state, never decoration, always with words or an icon | form feedback, alerts, badges, toasts, the pricing "included" check |
  | focus | where the keyboard is | every control |

  An icon tile is brand, never accent or a state colour; a trend badge takes its tone from the data.
- **Motion explains, never performs.** Every movement answers "where did this come from", "what is this", "which layer is this" or "what did I just do": a card arrives from the side its column faces, a framed object settles into place, a marker draws itself, a figure counts to its value, a picture sits a little deeper than the words beside it, a dialog grows from where you looked. Nothing loops, nothing moves on its own, nothing hides content from anyone who has motion or JavaScript off, and motion is loud enough to be seen: an entrance under 32 px competes with the page's own scrolling and goes unnoticed.
- **Entrances keep their own time; depth keeps the scroll's.** An entrance starts once its element is visibly on screen and then plays at its own pace, so a fast flick and a slow read see the same thing. Only what is meant to track the scroll (depth, the progress hairline, the header shadow) is tied to it.
- **Depth is set dressing.** A layer that moves slower than the content is scenery; the content is what you read. Two layers at different speeds read as a space; three read as a fairground. Depth never touches text and never exists on phones, where scrolling is the motion.
- **Depth from light, not lines.** Elevation is a soft shadow and a hairline ring, never a heavy border. A card lifts one pixel and its border warms toward the brand hue on hover. Only the hero media carries the long shadow; everything else sits flat with a ring.
- **Space is the layout.** One rhythm scale (below) decides every vertical distance. Headings sit on the start edge; only symmetric content (a logo cloud, a single quote, a form) is centred.
- **Same in every language and direction.** German is a third longer, Arabic reads from the right; a design that only works in English is not finished. Every slide mirrors.
- **The dial is the brief's.** `calm`, `standard` and `expressive` (R-TOK-12) decide how far things move and which devices a site gets. The reference site runs `expressive` because it is the showcase; a new brief defaults to `standard`.
- **Signature devices.** The cut-corner mark, the accent marker rule that draws itself, the proof strip, the counting figures, the column vocabulary and the four quiet sounds are what make one site built on this engine recognisable; they are the same on every site, and the brief's two hues, radius and motion level make each site its own.

## 2. Rhythm scale

| Distance | Utilities | Where |
|---|---|---|
| Section padding | `py-16 md:py-24` (comfortable), `py-12 md:py-16` (compact) | every section; heroes `py-16 md:py-28` / `py-12 md:py-20` (the inset backdrop `pt-4 md:pt-6` on top); page headers `py-12 md:py-16`, the banner header `py-16 md:py-24`; strips (article meta, filter bar, pagination, feedback) `py-6` |
| Heading group to body | `mt-12 md:mt-16` | every section with a title |
| Page header to content | header `pt-12 md:pt-16` with no bottom padding, then the section at `pt-12 md:pt-16` and its usual bottom padding | the opening group: a page header followed by a plain section on the page surface, so the h1 group reads as the heading of the content below (D57); after a strip, a band or another surface the header keeps `py-12 md:py-16` |
| Eyebrow to title, title to lede | `mt-2`, `mt-4` | section and page headers |
| Body items | `gap-6 md:gap-8` (grids), `gap-4 md:gap-8` (tile grids, two across from 320 px), `gap-8` (stats), `gap-12` (media rows) | grids and two-column layouts |
| Card internals | `mt-2` text, `mt-4` meta, `mt-auto pt-4` footer | cards |
| CTA after body | `mt-12` | sections with a button |
| Hero proof strip | `mt-12` after the buttons | heroes |
| Sticky editorial row | picture `lg:sticky lg:top-24 lg:self-start`, text blocks `space-y-16`, each `lg:min-h-96` | `feature-rows` variant `sticky` (expressive) |

The `consistency/rhythm` check fails any section, heading group or grid outside this table.

## 3. Motion table

Every entrance is a fade plus a move, time-based and once (R-MOT-05): it waits faded and offset until its top crosses 88 % of the window, then plays over 500 / 700 / 800 ms on `--ease-reveal` (an exponential ease-out: quick to leave, long to settle) for calm / standard / expressive. Distances: sections 16 / 32 / 40 px, items 24 / 40 / 56 px (16 / 24 / 32 px below `md`). Columns of a row cascade 90 ms apart, list items 70 ms. Without JavaScript, with reduced motion and in print there is no waiting state at all.

**Which treatment a section gets** is decided by what its content is:

| Section kind | Treatment | Why this one |
|---|---|---|
| hero, page header, first section | none at load; the hero media and glows carry depth from `expressive` | first paint is still (R-MOT-11) |
| heading group of any revealing section | rises first; its eyebrow rule, 24 px wide, draws from the start edge 200 ms later | the marker writes the label |
| grids of features, services, products, industries, benefits, values, help categories; cards for cases, articles, jobs, offices, downloads, events | the column vocabulary below, cascading 90 ms per column; article pictures settle from 115 % | each block arrives its own way and the row reads as one gesture |
| tiles (team, integrations, awards) | rise; icon, avatar or badge pops (expressive) | small things announce themselves with a pop, not a journey |
| steps | all slide in from the start, number badges pop | a sequence reads along the writing direction |
| alternating media rows | the row slides in from its inline edge, mirrored in RTL; the picture settles from 115 % inside its frame, then sits deeper as the page scrolls (`parallax-md`, standard) | a story told from two sides, with a window in each |
| sticky editorial row (expressive) | the picture pins while the text blocks pass | one picture, several points |
| logo cloud | wordmarks slide from the inline start, staggered; the list drifts with the scroll (expressive) | a line of names reads in |
| stats band, case-study metric | the band rises; each figure counts from 0, 80 ms apart, and settles (expressive); the band's backdrop sits deeper (expressive) | measurement |
| testimonials grid | cards settle from 96 %, staggered; a single quote settles as one | a framed object |
| CTA panel | settles from 96 %; its highlight drifts across (expressive) | a framed object with light on it |
| timeline | the rule draws down; entries rise, staggered | time passes down the rule |
| pricing | the column vocabulary; the recommended tier always takes the framed settle | the one to look at lands last |
| feature bento | the column vocabulary; the lead tile always takes the framed settle and its picture settles from 115 % | one main idea, two supporting |
| feature index, spotlight points | rows rise in sequence, 70 ms apart; the spotlight picture slides in from the start and settles | a numbered list reads down |
| feature disclosures | the list rises as one; panels open on request with the disclosure transition | detail on demand |
| FAQ, forms, contact, footer | no entrance; interaction feedback only | reading and doing |

**The column vocabulary** (R-MOT-16): three columns are slide-in / rise / framed settle; four columns add slide-from-end; two columns are slide-in / slide-from-end. Slides mirror in RTL. From `standard`; `calm` rises everything.

| Treatment | From-state (`pending:`) | Easing and delay |
|---|---|---|
| slide-in | `opacity-0 -translate-x-(--reveal-distance)` | `ease-reveal`, column × 90 ms |
| rise | `opacity-0 translate-y-(--reveal-distance)` | `ease-reveal`, column × 90 ms |
| framed settle | `opacity-0 translate-y-(--reveal-distance) scale-94` | `ease-reveal`, column × 90 ms |
| slide-from-end | `opacity-0 translate-x-(--reveal-distance)` | `ease-reveal`, column × 90 ms |
| pop (on the icon, not the tile) | `opacity-0 scale-70` | `ease-spring` (a slight overshoot), the item's delay + 180 ms |
| picture settle | `scale-115` inside the clipped frame | `ease-reveal` over 1 200 ms |

**Depth** (R-MOT-15), `md` and up, identity at rest, artwork overscanned, two layers at most in any viewport:

| Layer | Travel | Timeline | Level |
|---|---|---|---|
| hero media interior (split picture) | 32 px (`parallax-md`, at identity at rest) | `scroll(root)` over the first 80 vh | expressive |
| hero glows | 16 px (`parallax-sm`, at identity at rest) | same | expressive |
| media-row pictures | 32 px (`parallax-md`) | the row's `view()`, full passage | standard |
| stats band backdrop | 16 px (`parallax-sm`) | the band's `view()` | expressive |
| CTA highlight | 24 px inline (`drift`) | the panel's `view()` | expressive |
| logo cloud | 24 px inline (`drift`) | its `view()` | expressive |

Conveniences and feedback:

| What | Movement | Duration and easing | Trigger |
|---|---|---|---|
| Reading-progress hairline | a one-pixel brand-to-accent line under the header grows from the start edge to full width | linear | scroll-driven (`scroll(root)`), from `standard` |
| Floating back to top | fades and rises in after the first 60 vh of scroll; visibility follows | `--ease-smooth` | scroll-driven (`scroll()`) |
| Header shadow | a shadow fades in over the first 12 rem of scroll | | scroll-driven |
| Popover, menu, drawer | fade and slide 8 px (menus) or from the end edge (drawer) | 200 ms ease-out | `@starting-style` on open |
| Dialog | fade and scale from 95 %, backdrop blurs in | 300 ms ease-out | `@starting-style` on open |
| Button hover | lift 1 px, shadow deepens, arrow nudges 2 px forward (mirrored in RTL) | 150 ms | hover |
| Button press | settles back, scales to 98 % | 150 ms | active |
| Card hover (on the inner element) | lift 2 px, shadow deepens, border warms, icon tile scales 105 % | 150 ms | hover |
| Link hover | underline grows from the start edge | 150 ms | hover |
| Disclosure | chevron rotates 180° | 150 ms | open |
| Count-up | a figure counts from 0 to its value, ease-out cubic, 80 ms after the previous figure, then shows the build-time text; the width is reserved so nothing shifts | 1.5 s | 30 % visible (script) |
| Entrance | fade and move into place (the vocabulary above) | 500 / 700 / 800 ms, `ease-reveal` | top crosses 88 % of the window (script), once |
| Count-up settle (expressive) | the figure scales 1.015 → 1 once it lands | 160 ms | `data-counted` |
| Page navigation | cross-document view transition, header stable | browser default | navigation |

Rules that hold everything above together: compositor properties only (transform, translate, scale, opacity, colour; transition lists name `translate` and `scale`, since Tailwind's utilities set those, never `transform`), every utility under `motion-safe:`, entrances never over 64 px, depth never over 48 px and never below `md`, nothing animates above the fold at load (whatever is in view when the script starts is shown, not entered), the entrance lives on the wrapper and the hover on the inner element, an entrance's transition exists only once it is revealed (so nothing ever fades out), and reduced motion shows final states (and no count, no hairline). Browsers without scroll-driven animation (Firefox before 161) get every entrance and no depth.

## 4. Visual vocabulary

- **Mark**: a rounded tile in brand-600 carrying the site's initial in inverse ink, its bottom-end corner cut on the diagonal. The same path is every favicon. In the header and footer it sits 28 px tall beside the wordmark set in ink; the mark carries the colour.
- **Hero**: an asymmetric split on twelve columns (text seven at `lg`, six at `xl`; German headings one size smaller at `xl` so compounds never break); the h1 at `xl:text-6xl`; a proof strip of up to three figures under the buttons, separated by hairlines; the media in a `rounded-2xl` frame with a hairline ring and the long soft shadow, with an optional highlight card (icon tile, figure, label) overlapping its top-end corner on desktop; behind it a brand glow behind the text and an accent glow behind the media, faded to the surface, no texture. In `expressive` the picture inside its frame and the glows sink slowly as the page scrolls; the words and the card stay.
- **Image-led openings** (art library, §5): the `backdrop` hero is one strong picture with one statement over its calm side: the eased scrim darkens only the side the words sit on (measured on Siemens and Porsche: one-sided, .45–.8 at the peak, several stops so no band edge shows), at least 36 rem tall on a laptop and never a 100 vh billboard on a tall monitor, no floating highlight card. Its `inset` form frames the picture inside the container, text at the bottom-start, the more editorial of the two. `panel` keeps the text on a solid raised panel over the art, for briefs that want imagery without text on it. `editorial` is the annual-report spread: a large `font-medium` headline (premium openings sit at weights 300–500, not bold), lede and actions on one row, a 21:9 panorama. Interior pages pick `banner` (art behind the title, the quiet version of the backdrop), `band` (a wide art strip under the lede, as Ramp opens) or `split` (a 4:3 frame beside the title).
- **Eyebrow**: small caps in the brand colour with a 24 px accent rule before it; on a revealing section the rule draws itself from the start edge.
- **Reading-progress hairline**: one pixel, brand to accent, under the header, growing with the page.
- **Stats band**: brand-700 surface, numerals at `text-3xl sm:text-4xl md:text-5xl lg:text-6xl` in a light gradient from inverse ink to accent-200 that count up one after another and settle, labels at 80 % inverse ink; in `expressive` a deeper tone sits behind the band and moves slower than it.
- **Case-study metric**: the figure in brand text, counting up; its label carries the accent marker.
- **Testimonial**: a large quote mark in brand-200 above the first line; the author line with avatar.
- **CTA**: an inset `rounded-2xl` panel on the gradient (brand-700 → brand-600 → accent-600) with a radial highlight in the top start corner that drifts across the panel as it passes (expressive); buttons inverse.
- **Logo cloud**: monochrome wordmarks in muted ink that take the brand colour on hover.
- **Cards**: raised surface, hairline border, `rounded-lg`, hover lift on the inner element; tiles (team, integrations) sit two across on phones with `p-4 md:p-6`.
- **Media rows**: the picture in a `rounded-2xl` frame with a hairline ring, overscanned so it can sit deeper than the words; the `sticky` variant pins one picture beside several points.
- **Footer**: a one-pixel brand-to-accent hairline above the columns.
- **Pictures**: every placeholder in a `rounded-xl` frame with a hairline ring; only the hero media gets the long shadow.
- **Sound**: four synthesised UI sounds behind a labelled toggle in the footer (also the header at `xl`, the drawer below `lg`; off by default, kept for the tab): a tick when switched on, a muted tone when an overlay opens, a soft tap on a primary button, two rising notes on a form submission. Never on hover, scroll, navigation, a count or an error; motion stays silent.

What "pizzazz" is allowed to be: glow, hairlines, gradients on large numerals and panels, the motion table, two layers of depth, the four sounds. What it is not: parallax on words or everywhere, auto-playing media, text that fades in word by word, hover-only content, more than one accent, texture, blur, clip-path reveals, magnetic cursors, card flips, digit slot machines, scroll hijacking, marquees. One device is deferred rather than refused: a picture "curtain" (a surface-coloured panel sliding off a picture as it enters); it is evaluated after the devices above are in, because it hides imagery until scrolled.

## 5. Art and sample media

Every picture is a crop of the art library (`engine/art/`, R-ASSET-05): sixteen pieces of one graphic system, **Offset Planes**: flat geometry only (rectangles, parallelograms, quarter-discs, broad bands; horizontal, vertical and 45° edges), five flat greys on a dark ground, a 12 × 8 grid with half-module offsets, depth only by overlap, and beside each large plane one or two narrow parallel channels, precise lines of light, at three scales of offset. No gradients, texture, outlines, letters, arrows, charts or icons. Recoloured to the brief's two hues it reads as a duotone or tritone graphic: in the dark tone a deep brand field with the lightest planes in the accent, the hue of evidence; in the light tone a near-white field with brand planes. `quiet` pieces keep their start 40 % one empty dark field so a headline can sit there; `field` pieces carry structure edge to edge for frames and cards; `calm` pieces are almost empty, for text-heavy cards, and are used only when declared. A site narrows the library with `brand.art` to give itself a signature (the reference site uses every piece but the two calm ones). Abstract art may mirror in right-to-left layouts; a photograph never would.


The reference site ships a generated eight-second clip (brand shapes in motion, 1280×720, MP4 and WebM, about a megabyte each) behind a native `<video>` with a generated poster, `preload="none"` and controls. It proves the video pattern without a third-party player and without a request before play.

## 6. If you start over

1. Set the rhythm scale, the colour meanings, the motion table and the flair dial before drawing anything; write them into bylaws 02, 03, 05 and 06 and the gates.
2. Build the shell (header with the mark and the hairline, footer, section skeleton) with the hover, reveal and depth vocabulary in place, then the primitives, then the sections. Do not add motion afterwards.
3. Keep a style-guide page green from the first component so every state is visible at once.
4. Put the three locales in from the first page, with a right-to-left one; the header, the heading lengths and the slides are where the design breaks.
5. Gate everything that can be measured (rhythm, reflow, budgets, contrast, the motion vocabulary) so taste decisions stay about taste.
