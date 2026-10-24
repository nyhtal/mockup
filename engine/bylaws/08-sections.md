# 08 Sections

Purpose: the building blocks of a page, their anatomy and their content limits, so a page is a list of section names with data and nothing else. Source: corporate-site conventions distilled in the master prompt; limits chosen to keep pages scannable.

### R-SEC-01 Section anatomy
MUST. A section is `<section class="py-16 md:py-24 bg-surface|bg-surface-alt" data-component="<name>">` containing the container, then an optional eyebrow, an `h2`, an optional lede, the body, and an optional single CTA. Order never changes.
Why: Same skeleton, same rhythm, every section.
Gate: manual: checklists/new-component.md

### R-SEC-02 One h2 per section
MUST. Each section has exactly one `h2`; items inside use `h3`. Sections without a visible title (logo cloud, CTA band) carry `aria-label` instead of an empty heading.
Why: The outline stays flat and predictable.
Gate: manual: checklists/new-page.md

### R-SEC-03 Content limits
MUST. Feature grid 3–6 items; alternating feature rows 2–4; feature bento 3–6 (the first is the lead); feature index 3–6; feature spotlight 2–4 beside one picture; feature disclosures 2–5; stats 3–4; logo cloud 5–8; testimonials 1–3 (carousel up to 6); FAQ 4–10; steps 3–5; timeline 4–8; team 4–12; pricing 2–4 tiers; case-study cards 3 or 6; related items 3; office cards 2–6; job list 1–20 with pagination beyond.
Why: Fewer than the minimum looks unfinished; more than the maximum stops being scanned.
Gate: manual: checklists/new-page.md

### R-SEC-04 Word limits
MUST. Lede ≤ 35 words; card body ≤ 40 words; testimonial quote ≤ 50 words; stat label ≤ 4 words; feature title ≤ 6 words (index, spotlight and disclosure titles ≤ 8); feature-index text ≤ 45 words, spotlight point ≤ 30, disclosure text ≤ 50, the bento lead ≤ 50; step description ≤ 25 words; CTA band copy ≤ 20 words.
Why: Corporate pages are skimmed; limits force the point.
Gate: manual: checklists/new-page.md

### R-SEC-05 Calls to action
MUST. A page has one primary CTA (the header button) plus at most one CTA band; sections otherwise end in a secondary or link-style CTA. Two primary buttons never sit next to each other.
Why: One obvious next step converts; three compete.
Gate: manual: checklists/new-page.md

### R-SEC-06 Alternating surfaces
MUST. Sections alternate `bg-surface` and `bg-surface-alt` starting with `bg-surface` after the hero; a media-background section (hero, CTA band) resets the alternation.
Why: Alternation separates sections without lines or extra spacing.
Gate: manual: checklists/new-page.md

### R-SEC-07 Hero
MUST. Variants: `centered`, `split` (text + media), `video` (facade), `form` (text + short form), `stats` (text + 3 stats), and three on the art library (R-ASSET-05): `backdrop` (a dark-tone piece fills the section, or with `inset` a `rounded-3xl` frame inside the container, or with `light` a light-tone piece behind the page's ink and the light scrim, in the light colour scheme whatever the theme; the text sits in inverse ink over the piece's quiet start side behind the art scrim of R-COL-09, mirrored in RTL; at least `lg:min-h-144`, inset `lg:min-h-160`; no highlight card), `panel` (a dark-tone piece fills the section and the text sits on an opaque `bg-surface-raised` panel across seven columns, so it never touches the picture) `cinema` (the sample clip of R-ASSET-13 fills the section behind the art scrim, showing its poster, with the text in inverse ink and a round play button; pressing it plays the clip in place with the native controls while the text and scrim step aside, and they return when it ends; nothing plays on its own, D52; without the script the native player shows its controls) and `editorial` (eyebrow, an h1 at `text-5xl md:text-6xl xl:text-7xl` in `font-medium` across ten columns, the lede and the actions on one row under it, then a 21:9 panorama in a `rounded-2xl` frame). The hero contains the page's `h1`, a lede, one primary and one secondary button, and the LCP image (`fetchpriority="high"`; a backdrop hero whose image declares `animate` draws the flowing twin of D62 and has no picture, so its LCP is the `h1`); split, video and form variants sit on twelve columns: text seven and media five at `lg`, six and six at `xl` (a German compound at the display size needs the measure). It may add a proof strip (≤ 3 figures with labels under the buttons) and, with media, a highlight card (icon, figure, label) over the media's top-end corner. It never animates on load (R-MOT-11), except that the same flowing twin loops from first paint behind the words, which stay still.
Why: The hero is the LCP and the first impression; it is the most constrained section.
Gate: manual: checklists/new-page.md

### R-SEC-08 Page header
MUST. Non-home pages that are not landing pages start with the `page-header` section (breadcrumbs, eyebrow, `h1`, lede) instead of a hero, chosen in the page's front matter as `pageHeader: { variant, image }`: `plain` (the default), `brand` (a solid band in the brand blue, R-SEC-13, no image), `banner` (a dark-tone art piece behind the whole header with the art scrim, breadcrumbs and text in inverse ink, `py-16 md:py-24`), `band` (the plain header, then a `rounded-2xl` 21:9 art band `mt-12` under the lede) or `split` (text in seven columns, a 4:3 art frame in five, stacked below `lg`); a variant without an image is `plain`. A page whose first section is `search-box` (the search and help pages) opens on that section's header form instead: breadcrumbs, the page's eyebrow, h1 and lede, the search field showing the query of the page's results and the popular searches, on the alternate surface, so the title and lede appear once. Followed by a plain section on the page surface, a plain or split header joins that section as the opening group of R-LAY-02; a banner or band header keeps its padding.
Why: Interior pages need orientation, not a billboard.
Gate: manual: checklists/new-page.md

### R-SEC-09 Section order per page type
MUST. Required and optional sections and their order for each page type are listed in bylaw 09's inventory table; a page uses that order and may omit optional sections but never reorders required ones.
Why: Users learn the site's rhythm once.
Gate: manual: checklists/new-page.md

### R-SEC-10 Reveal eligibility
MUST. Reveal classes (R-MOT-05) go on sections below the fold and on grid items (staggered); never on the hero, page header, breadcrumbs or anything containing the `h1`.
Why: Keeps LCP and first paint static.
Gate: manual: checklists/new-component.md

### R-SEC-11 Empty and error sections
MUST. List sections (jobs, search results, filtered resources) render the `empty-state` component when they have no items, with a next action; they never render an empty grid.
Why: Blank space reads as broken.
Gate: manual: checklists/new-page.md

### R-SEC-12 Section data contract
MUST. Each section's include takes one object whose keys are documented in its anatomy block (`title`, `eyebrow`, `lede`, `items[]`, `cta`); pages pass data, never markup.
Why: Pages remain data; the catalog owns all HTML.
Gate: manual: checklists/new-page.md

### R-SEC-13 Brand version
MUST. Every section can take its brand version, the contrast that stands in for text over a dark picture: `tone: "brand"` paints it in the stats band's blue (`brand-700`) as a full-width bar, and with `frame: "contained"` as a `rounded-3xl` panel inside the container on the page surface. The `tone-brand` utility re-points the role colours inside it (ink and muted ink to the inverse, lines to translucent inverse, raised cards a step lighter, brand text to `accent-200`, focus to the inverse), so components need no variant of their own; shell sections get it from the shell, the classic heroes from `s.tone`, the page header as its `brand` variant. A brand bar never joins a page header and restarts the surface alternation after it; primary buttons stay off it (its CTA is the secondary button).
Why: A mockup must show how the brand reads as a solid field, not only as accents, and one switch per section keeps that from becoming forty variants.
Gate: manual: checklists/new-page.md

## Checklist

- [ ] R-SEC-01 anatomy order
- [ ] R-SEC-02 one h2, aria-label where untitled
- [ ] R-SEC-03 item counts within limits
- [ ] R-SEC-04 word limits held
- [ ] R-SEC-05 one primary CTA plus at most one band
- [ ] R-SEC-06 surfaces alternate
- [ ] R-SEC-07 hero variant from the nine, 5/7 split, LCP image prioritised, proof ≤ 3, text over art only behind the scrim
- [ ] R-SEC-08 page-header on interior pages, variant from the four, a banner or band never joined
- [ ] R-SEC-09 section order per page type
- [ ] R-SEC-10 reveals below the fold only
- [ ] R-SEC-11 empty states rendered
- [ ] R-SEC-12 sections take data objects
- [ ] R-SEC-13 brand version through tone-brand, bar or contained, never joined to a page header
