# Elegant openings: art library, heroes, page headers, feature sections

Date: 2026-10-22. Owner request: "more designs for features, page headers, heros… modern designs, elegant looking only… hero with a background image… need images for page headers." Owner decisions in the brainstorm: imagery stays generated, not photographs ("Better generated art"); sequence art → heroes + page headers → features; "just do it", no visual check-ins; use Codex (and Grok) to make images where they do it better.

## Understanding

- **Outcome:** sites built on the engine open like a premium corporate site: a hero that can sit on a full-bleed image, interior page headers that carry an image, and feature sections beyond "icon grid" and "alternating rows".
- **Constraints kept:** no photographs, no faces, no text in images (R-ASSET-05's intent: rights-free, honest about being a mockup); every image matches the site's two brand hues; deterministic builds; Tailwind utilities only; RTL and German hold; LCP, contrast and page-weight gates stay green.
- **Assumption (mine):** AI-generated *abstract* art counts as "generated art", provided the build still recolours it to the brief's hues. Codex's image tool produced a clearly better contour field than hand-written SVG (tested 2026-10-22), so it is the source; the code-drawn placeholder stays only for the sample video frames.
- **Success:** a reviewer cannot tell the reference site's openings from a well-art-directed real site's; all nine gates green; no page over its budget.

## What the research found (2026-10-22)

A browser-measured survey of live sites (Siemens, ABB, Porsche, Aesop, SOM, Foster + Partners, Mercury, Rivian, Vestas, Ramp, Apple, Linear, Stripe) and a blind Codex brainstorm. What the designs below take from it:

- **Scrims are one-sided and anchored to the text**: a side band (Siemens: 0 → 40 % → 65 % → transparent from `rgb(0,0,40)`) or a bottom band (Aesop: the lowest 36 %; Porsche: 200 px), peak opacity .45–.8, eased over several stops so no band edge shows. Whole-image flat overlays (ABB's 40 %) are the exception.
- **Heights**: 100 svh minus the header (ABB), about 85 vh (Rivian) or a fixed 600 px (Siemens). Corporate sites favour the bounded versions.
- **Display type is moderate and often light**: 30–56 px at weights 300–600 (Stripe 300, SOM Light, Vestas 200); only ABB goes to 72 px. Tight tracking (-0.02 em).
- **Title above a wide rounded media band** (Ramp: 12 px radius, about 64 px side margins) and **big title above an offset 16:9 image** (ABB about-page) are the elegant non-overlay openings.
- **Elegant bento** is small-radius (Stripe 6 px), quiet fills, real content inside; large radii, a gradient per card and icon-only tiles read as template.
- Codex agreed on art direction over ornaments: one strong image, text on a protected zone, no floating highlight cards on image heroes.

## Phase 1: the art library (R-ASSET-05 v2)

### What ships

```
engine/art/
  manifest.json        one entry per piece: id, composition, prompt, model, date
  <id>.webp            the source: greyscale, 1672 px wide (16:9), lossless WebP
```

Twelve pieces, generated once with Codex's image tool from a shared prompt (monochrome, near-black ground, luminous fine structure, no grain, no text) plus a subject line each: `contours-quiet`, `contours-field`, `ribbon-quiet`, `airflow`, `fins-quiet`, `folds`, `rings-quiet`, `horizon`, `glow`, `dots-quiet`, `traces-quiet`, `glass`. A piece is kept only if it passes review (no text-like marks, no recognisable object, the quiet side really empty).

**Compositions** decide where a piece may go:

| composition | meaning | used by |
|---|---|---|
| `quiet` | structure in the end 55–60 %, the start 40 % dark and nearly empty | hero `backdrop` and `panel`, page header `banner` (text sits over the quiet side) |
| `field` | structure across the frame | cards, media rows, bands, split frames |
| `glow` | light only, no edges | anywhere text sits on art at small sizes |

### Declaring art

The image declaration (R-ASSET-06) gains two optional keys:

```json
{ "slug": "home-hero", "ratio": "21:9", "alt": "", "max": 1600, "art": "contours-quiet", "tone": "dark" }
```

- `art`: a library id. Absent → the build picks one from the site's `brand.art` list (or every `field` and `glow` piece when the site sets none), seeded by the slug, so a rebuild picks the same.
- `tone`: `dark` or `light`. Absent → seeded by the slug. The sections that put text on art force `dark`.
- The `picture` primitive writes both as `data-art` and `data-tone` on the `<img>`; the build reads them from the built HTML with the URLs it already collects. The same slug declared with two different arts or tones fails the build with both pages named.
- `site.json` `brand.art` (optional): the ids this site uses, giving each site its own visual signature. The reference site: `contours-*`, `ribbon-quiet`, `airflow`, `fins-quiet`, `folds`, `glow`, `traces-quiet`.

### Recolouring

For each referenced file the build: loads the source → greyscale → `normalise` → maps every grey level through a 256-entry ramp made from the brand and accent hues → crops to the ratio (`cover`; `quiet` pieces crop from the end side so the structure survives a 4:3 or 1:1 crop) → resizes → AVIF q50 / WebP q75, the widths and names as today.

| tone | ramp (OKLCH; b = brand hue, a = accent hue) |
|---|---|
| dark | 0 → L .13 C .03 b · .25 → .22 .07 b · .55 → .50 .15 b · .80 → .72 .13 a · 1 → .95 .04 a |
| light | 0 → L .975 C .01 b · .25 → .93 .03 b · .55 → .75 .10 b · .80 → .55 .15 b · 1 → .50 .13 a |

The ramp stops are tuned in implementation against the twelve pieces (the first test lost some glow in the mid-tones); the table is the starting point. Brightest structure lands on the accent, so DESIGN §1's "accent = evidence" becomes "accent = where the light is" inside art, which is a rendering rule, not a UI colour.

**Contrast guarantee:** in the dark ramp the start 40 % of a `quiet` piece maps to L ≤ .25; white text on L .25 OKLCH is ≥ 10:1. Sections still add a scrim (Phase 2) because a crop can bring structure under the text.

### Rules, licences, tests

- R-ASSET-05 is rewritten: images come from the engine's art library, recoloured to the brand at build time; the library is abstract, committed and reviewed; no photographs, faces or text. The code-drawn generator remains for R-ASSET-13's video frames.
- R-ASSET-06 gains `art` and `tone`. Minor version (new keys, old declarations stay valid; images change look but no gate result changes).
- `engine/LICENSES.md`: the library is generated with OpenAI's image model through the Codex CLI; outputs belong to the user under OpenAI's terms; the prompts are in `manifest.json`.
- Unit tests: the ramp is deterministic and changes with the hue; a `quiet` crop keeps the end side; every manifest id has a file and every file an entry; a slug declared twice with different art fails; tone and art defaults are stable for a slug.
- Budget: a recoloured 1600 px AVIF is expected at 30–90 KB (smooth gradients compress well; fine lines cost more). Measured in implementation; if a page breaks its budget the hero ships `max: 1200` for that ratio rather than a raised budget.

## Phase 2: heroes and page headers

### Hero variants (R-SEC-07 amended: five → eight)

1. **`backdrop`**: the art fills the section edge to edge (`quiet`, `dark`, ratio 21:9 at `md`+, 4:3 below via a second declaration or object-cover). Text in the start seven columns over the quiet side, `text-ink-inverse`; an eased side scrim from `brand-950/85` at the start edge through `/60` at 40 % and `/20` at 65 % to transparent at 80 % (one arbitrary-value `bg-[linear-gradient(...)]` utility, mirrored in RTL with `rtl:` and the opposite direction), and a bottom fade to the page surface only when the next section is on `bg-surface`. Height: content-driven `py-24 md:py-32`, and at `lg` `min-h-[min(calc(100svh-4rem),46rem)]` with the text block vertically centred, so it fills the first screen on a laptop without becoming a 1 000 px billboard on a tall monitor. No highlight card on this variant. Buttons: primary inverse, secondary outline-inverse. Proof strip in inverse ink. The art is the LCP image (`fetchpriority=high`, `alt=""`, decorative). RTL mirrors the art with `rtl:-scale-x-100` (abstract art may mirror; photographs never would). Expressive: the art layer gets the hero depth (`parallax-md`, `scroll(root)`), text stays still.
   - **`backdrop` + `inset: true`**: the same, but inside a `rounded-3xl` frame within the container margin (the art does not touch the window edge), text anchored to the frame's bottom-start. The more editorial of the two.
2. **`panel`**: full-bleed `quiet` art with an opaque `bg-surface-raised` panel (`rounded-2xl`, hairline ring, `p-8 md:p-12`) holding the text in the start six columns; the art shows around and to the end of it. Text never sits on art, so light and dark themes both pass contrast with no scrim.
3. **`editorial`**: no glow, no frame. Eyebrow, then the h1 across ten columns at `text-5xl md:text-6xl xl:text-7xl`, `font-medium tracking-[-0.025em]` with tight leading (the lighter weight is the point: research found premium openings at 300–500); below it a two-column row: lede at the start (six columns), buttons and proof at the end; then a full-container `rounded-2xl` 21:9 panorama (`field`). Feels like an annual-report spread.

Existing variants keep working; `split` and `centered` pictures simply get the new art.

### Page header variants (R-SEC-08 amended: one → four)

`s.variant` on `page-header`; default `plain` (today's).

| variant | anatomy | notes |
|---|---|---|
| `plain` | breadcrumbs, eyebrow, h1, lede | unchanged; joins the next section (D57) |
| `banner` | the art (`quiet`, `dark`) behind the whole header, scrim as the hero's, breadcrumbs and text in inverse ink, `py-16 md:py-24` | breadcrumbs gain an `inverse` option; never joins (it is a band) |
| `band` | plain header, then a `rounded-2xl` art band (`field`, 21:9, `aspect-[16/9] md:aspect-[21/9]`) `mt-12` below the lede | the band is the LCP image; the header keeps its bottom padding |
| `split` | text in seven columns, a 4:3 `rounded-2xl` art frame in five (six at `xl`), vertically centred | stacks text → art below `lg` |

No motion on any page header (R-SEC-10 unchanged).

### Rules touched

- R-SEC-07: eight variants and their anatomy. R-SEC-08: four variants. R-COL-09: add the backdrop scrim (`from-brand-950/85 to-transparent`, the one gradient over art) and the bottom fade. R-MOT-15: the backdrop art layer joins the hero depth row. DESIGN §4 gets a "Hero" and "Page header" update and an "Art" entry.
- Style guide: the "heroes" group lists the three new hero variants and three new page-header variants (samples in `samples.json`).
- Reference site: the home page moves to `backdrop`, the landing page to `editorial`; services, about and careers headers use `banner`, `band` and `split` so every variant is exercised; the a11y gate's "incomplete" contrast reviews over art are expected and recorded in the report.

## Phase 3: feature sections

Four new sections; each uses the column vocabulary (R-MOT-16) and the rhythm table, and lives in the style guide's features group.

1. **`feature-bento`**: small radius (`rounded-lg`), quiet raised fills with a hairline ring, no per-tile gradients; one lead tile spanning eight columns and two rows (art on top, title and text on a solid caption area below; text never over art), two four-column tiles beside it, an optional row of up to three plain tiles below. 3–6 items. Collapses to one column in source order. Elegant because the hierarchy is explicit: one main idea, two supporting.
2. **`feature-index`**: a numbered editorial list. Each row: hairline rule above, a two-digit number (tabular, `text-ink-brand`), the title across four columns, text plus an optional link across seven. 3–6 rows. No icons. Rows rise in sequence; the rule draws from the start edge (the heading-rule device).
3. **`feature-spotlight`**: one large `field` art frame (seven columns, 4:3) with an optional caption, beside a heading group and three compact items separated by hairlines (five columns). The picture settles from 115 %; items cascade.
4. **`feature-disclosures`**: the section heading group and lede in five columns, beside native `<details name>` items in seven (one open at a time, the `disclosure` utility); each open item shows its text and a 16:9 art frame. 3–5 items, the first open. No script.

R-SEC-03/04 get their content limits; R-MOT-16's table gains the four. The reference site uses each once (home: bento; services: index; about: spotlight; product: disclosures).

## Out of scope

Photographs, AI photo-realism, overlay (transparent) site headers above a backdrop hero, auto-playing or animated backgrounds, carousels in heroes.

## Order and checkpoints

Each phase gets its own plan in `docs/superpowers/plans/`, is built, gated (`--skip lighthouse` while iterating, then Lighthouse on the changed page types) and committed with a CHANGELOG bump before the next starts.
