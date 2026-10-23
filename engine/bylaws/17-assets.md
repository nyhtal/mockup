# 17 Assets

Purpose: fonts, icons, images, favicons and social images: where they come from, how they are generated, named and licensed, so no site ever needs a designer to produce a placeholder. Sources: https://lucide.dev/license, https://fontsource.org, https://sharp.pixelplumbing.com, https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel#icon.

### R-ASSET-01 Folder layout
MUST. Built assets live under `/assets/`: `app.css`, `enhance.js`, `fonts/`, `images/`, `og/`, and the favicon files at the root (`/favicon.ico`, `/icon.svg`, `/apple-touch-icon.png`, `/icon-192.png`). Source assets live in `sites/<name>/assets/` and are never edited in `dist/`.
Why: One layout for every site and every cache rule.
Gate: budget/missing-asset

### R-ASSET-02 Naming
MUST. File names are lower-case kebab-case with a width suffix for raster images (`hero-automation-1200.avif`) and a content hash for fonts and CSS when the deployment adds one; no spaces, no uppercase, no dates in names.
Why: Predictable names make `sizes`/`srcset` generation mechanical.
Gate: manual: checklists/new-site.md

### R-ASSET-03 Icon sprite
MUST. Icons come from `lucide-static` (ISC, licence file copied to `engine/LICENSES.md`); `engine/tools/build-icons.js` builds a per-page sprite of `<symbol id="i-<name>">` elements from the allow-list in `engine/icons.json` (about 60 names); pages reference them per R-HTML-13. No other icon source.
Why: One visual language and zero icon requests.
Gate: manual: checklists/new-site.md

### R-ASSET-04 Fonts
MUST. Fonts are copied from `@fontsource-variable/<name>/files/` for the subsets a site's locales need (`latin`, `latin-ext`, `arabic`, …) into `/assets/fonts/`; `@font-face` declarations in `app.css` (exception list) use `font-display: swap`, `unicode-range` per subset and the metric overrides from R-TYPO-02. Licences (OFL 1.1) are recorded in `engine/LICENSES.md`.
Why: Self-hosted, subset, licensed.
Gate: manual: checklists/new-site.md

### R-ASSET-05 Placeholder images
MUST. `engine/tools/build-images.js` renders every image a page declares from the engine's art library (`engine/art/`: abstract greyscale sources with a `manifest.json` giving each piece's composition, crop and prompt): the declared piece, or one seeded by the slug from the site's `brand.art` list (calm pieces only when declared), cropped to the declared ratio from the piece's crop position, recoloured through a 256-step ramp built from the brand and accent hues (`dark` or `light` tone, declared or seeded by the slug; the dark ramp keeps its first quarter at OKLCH L ≤ .25), and encoded by `sharp` to AVIF (quality 42, effort 6) and WebP (quality 75) at widths 480, 768, 1200 and 1600 (capped at the declared max). The library is one graphic system (Offset Planes, `engine/DESIGN.md` §5): flat geometry in five greys on a dark ground; a piece that breaks the system, or reads as a letter, arrow, chart or icon, is regenerated before it is committed, and a source drawn on a light ground is inverted on import. No photographs, no faces, no text, no recognisable product or place. The sample clip is drawn in the same system by `engine/tools/build-video.js` (R-ASSET-13).
Why: Deterministic, brand-matched, rights-free and honest about being a mockup, and art-directed enough to sit behind a headline.
Gate: budget/missing-asset

### R-ASSET-06 Image declaration
MUST. A page or section declares an image as `{ "slug": "hero-automation", "ratio": "16:9", "alt": "…", "max": 1600 }`, optionally with `"art"` (a piece id from `engine/art/manifest.json`) and `"tone"` (`dark` | `light`); the catalog's `picture` primitive renders the `<picture>` with AVIF and WebP `srcset`, `sizes` from the section's layout rule, `width`/`height`, the alt, and `data-art` / `data-tone` when declared. One slug carries one art and one tone across the site: two pages declaring different values fail the build, as does an unknown piece.
Why: Authors declare intent; the engine does the markup.
Gate: a11y/image-alt

### R-ASSET-07 Avatars
MUST. People get generated avatars: initials on a brand-hue disc, rendered as SVG inline (not raster), `rounded-full`, `size-12` in cards and `size-24` on profile pages, `alt=""` with the name in adjacent text.
Why: No stock faces, no image requests, readable at any size.
Gate: manual: checklists/new-component.md

### R-ASSET-08 Logos for logo clouds
MUST. Customer and partner logos are generated wordmarks (company name set in the site font inside an SVG, monochrome `text-ink-muted`), each in an `li` with the name as `alt`.
Why: Real logos would be trademarks; wordmarks still show the pattern.
Gate: manual: checklists/new-component.md

### R-ASSET-09 Favicons
MUST. `/favicon.ico` (16, 32, 48 px), `/icon.svg` (with `@media (prefers-color-scheme: dark)` inside), `/apple-touch-icon.png` (180 px, opaque background), `/icon-192.png`; linked as `<link rel="icon" href="/favicon.ico" sizes="any">`, `<link rel="icon" href="/icon.svg" type="image/svg+xml">`, `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`. No manifest (D24). Generated from the site's mark by the image tool: the same cut-corner tile with the initial that the `logo` primitive draws in the header and footer (DESIGN.md §4), so tab, home screen and page match.
Why: Every platform's tab and bookmark covered with four files.
Gate: budget/missing-asset

### R-ASSET-10 Social images
MUST. `/assets/og/<page-slug>.png` (1200×630, PNG for platform compatibility, ≤ 150 KB) generated per page with the brand gradient, page title and site name; `og:image:alt` is "{Page title} · {Site name}".
Why: Every link preview branded and legible.
Gate: manual: checklists/pre-delivery.md

### R-ASSET-11 Theme colour
MUST. `<meta name="theme-color" content="<brand-600 light>" media="(prefers-color-scheme: light)">` and the dark counterpart are present; values are hex (not oklch) for browser support.
Why: Mobile browser chrome matches the brand.
Gate: manual: checklists/new-site.md

### R-ASSET-12 Licences file
MUST. `engine/LICENSES.md` lists every third-party asset source (Lucide, each font) with licence name and link; a site's `DECISIONS.md` notes any brief-supplied asset and its rights.
Why: Mockups get reused; rights must travel with them.
Gate: manual: checklists/new-site.md

### R-ASSET-13 Sample video
MUST. `engine/tools/build-video.js` generates every clip a page declares (`{ "slug", "title", "duration" }`): frames of the art library's system in motion (Offset Planes, DESIGN §5: flat planes in five steps of the brand's dark ramp gliding along their axes, the start 40 % empty, the poster the composition at rest, looping), encoded with `ffmpeg-static` to `/assets/video/<slug>.mp4` (H.264, yuv420p) and `<slug>.webm` (VP9), with `<slug>-poster.webp` from the first frame and one `<slug>-<lang>.vtt` captions file per page language (its cue is `ui.videoCaption`); builds are seeded by slug so rebuilds are identical and skipped when the files exist.
Why: A real, self-hosted clip proves the video pattern without rights or requests.
Gate: manual: checklists/new-page.md

## Checklist

- [ ] R-ASSET-01 folder layout
- [ ] R-ASSET-02 naming
- [ ] R-ASSET-03 sprite from allow-list
- [ ] R-ASSET-04 fonts subset and declared
- [ ] R-ASSET-05 generated images deterministic
- [ ] R-ASSET-06 images declared, markup generated
- [ ] R-ASSET-07 SVG avatars
- [ ] R-ASSET-08 wordmark logos
- [ ] R-ASSET-09 favicon set of four, same mark as the header
- [ ] R-ASSET-10 OG image per page
- [ ] R-ASSET-11 theme-color light and dark
- [ ] R-ASSET-12 licences recorded
- [ ] R-ASSET-13 sample video generated, seeded by slug
