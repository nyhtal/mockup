# Animated home hero art: design

Date: 2026-10-23. Owner request: "animate the home page image"; asked how, the owner chose "animate the shapes themselves", a "slow continuous flow", for the "home hero only". Approach approved in chat ("do it").

## Intent

The reference site's home hero (`hero-home`, variant `backdrop`, art `planes-flow`) shows a still raster. The owner wants the shapes in it to move: the bands glide slowly and the light runs along the offset channels, endlessly, calm enough to sit behind a headline. Only the home hero changes; no other section, site or art piece gains motion.

Success: on the reference home page in every locale, the planes-flow composition is visibly the same piece as today at rest, it flows slowly on a loop when motion is allowed, it can be paused by anyone, it is still under reduced motion, without CSS animation and in print, and every gate stays green.

## Approach

A vector twin of planes-flow, drawn at build time as inline SVG and animated by CSS. Rejected: an autoplaying clip from `build-video.js` (hundreds of KB in the hero, against D52, and not this composition) and slicing the raster into moving layers (soft edges, fragile). D60 judged hand-written SVG art weaker than the generated rasters; planes-flow is flat geometry (straight bands, quarter turns, parallel channels), so its twin is a faithful redraw of an existing piece rather than new art, and the at-rest frame is compared with the raster before it ships.

## Design

### The twin

- `engine/tools/lib/art-flow.js` exports `planesFlowSvg({ hue, accentHue })`: the planes-flow composition on its 16:9 grid as an SVG string, filled with five tones from the dark ramp of `art.js` (`ramp("dark", hue, accentHue)`, the same steps `build-video.js` takes), so it carries the brand like the raster does. Each moving part is a `<g data-flow="n">` group: the main bands, the offset channels, the lower band. No text, no `<style>`, no inline `style` (CSP `style-src 'self'`, R-PREC-07).
- The piece is wired into Eleventy as a shortcode or filter the hero calls; `width`/`height` are fixed by `viewBox` and `preserveAspectRatio="xMidYMid slice"`, so it fills the art layer exactly as `object-cover` does and causes no layout shift.

### Declaration and seam

- `hero-home`'s image gains `"animate": true` in all four locales' `pages.json`.
- In `hero.njk`, `artLayer` renders the inline SVG in place of the `picture` when `s.image.animate` is set. The wrapper keeps everything it has today: `aria-hidden="true"`, `-z-10`, `overflow-clip`, the RTL mirror, and the expressive scroll depth (R-MOT-15), which now sits on the SVG element. The loop runs on the inner groups, so the two transforms never stack on one element.
- The build fails when `animate` is set on an image whose art is not `planes-flow`, or on a hero variant other than `backdrop`, naming the page.
- The style guide's image-map demo uses `home-backdrop-16x9-768.avif`, which is only built because the hero declares it. The demo's `img` gains `data-art="planes-flow" data-tone="dark"` so `build-images.js` keeps producing it (R-ASSET-06's one-slug-one-art rule is unaffected).

### Motion

- One new keyframe `flow` in the `@theme` block (R-TOK-13): a translate out along the layer's axis and back, so every layer is at its rest position at 0 % and 100 % and the loop never jumps.
- A named `@utility art-flow` on the SVG (added to the R-PREC-07 exception list, since per-layer axes, amplitudes and phases are not expressible as plain utilities) gives each `[data-flow]` group its axis, its amplitude (at most half a grid module, under 64 px at 1600 wide) and a phase offset, with a 30 s cycle and an ease-in-out curve. The channels trail their band by a few percent of the cycle, like the clip.
- Only `translate` moves (R-MOT-01). Everything is under `prefers-reduced-motion: no-preference` (R-MOT-02); with reduced motion or in print the SVG is the composition at rest. The loop is pure CSS, so it also runs with JS off, and so does the pause switch. Nothing is time-based apart from this loop: the text, buttons and proof strip never move (R-MOT-11).

### Pause control (WCAG 2.2.2)

Motion that starts by itself and lasts more than 5 s needs a way to pause it; reduced motion alone does not satisfy 2.2.2.

- A small toggle in the hero's bottom-end corner: a visually styled `<input type="checkbox" role="switch">` with a visible label, i18n key `ui.pauseAnimation` ("Pause animation" and its de, ar, ja equivalents). Checking it pauses the loop through `:has(:checked)` inside the `art-flow` utility (`animation-play-state: paused`). It works without JS; `enhance.js` is unchanged (R-MOT-10).
- In the tab order after the hero's buttons; a visible focus ring; meets target size (24 × 24 px minimum) and contrast on the dark scrim; hidden under reduced motion and in print, where there is nothing to pause. The choice does not persist across pages (no storage).

### Performance

- The hero's LCP element moves from the AVIF to the `h1`. The inline SVG is expected to be 2 to 4 KB in the HTML; R-PERF budgets are checked by the gate run.
- The animation is compositor-only (`translate` on a handful of groups); browsers throttle it off-screen.

### Bylaws and records (bylaws 0.21.0, minor: a rule changes and a site green before stays green)

- R-MOT-03: "Nothing loops except …" adds the home hero's flowing art, paused by its control.
- R-MOT-11: an animated art piece on a backdrop hero, declared with `animate`, is allowed to loop behind the text under `motion-safe`, with a pause control; the text column still never moves.
- R-TOK-13: the `flow` keyframe. R-PREC-07: the `art-flow` utility.
- R-ASSET-05/06: an image may declare `animate`; only `planes-flow` has a vector twin.
- R-SEC-07 / the hero's catalog header (`motion:` and `a11y:` lines): the animated backdrop and its pause switch.
- DESIGN §3 and §5: the flowing twin as the one exception to a still opening.
- `engine/DECISIONS.md` D62 with the owner's words and the rejected options; `engine/CHANGELOG.md` 0.21.0.
- `consistency/motion-vocabulary`: `flow` joins `ANIMATIONS`, allowed only inside a `backdrop` hero on an element carrying `art-flow`; anywhere else it is a finding.

## Testing

- Unit (`engine/tools/test/`): `planesFlowSvg` is deterministic, has no `style` attribute or element, and its groups carry `data-flow`; `animate` renders the SVG and no `img` in the hero; `animate` on another piece or variant fails the build; the motion gate accepts `flow` in the hero and reports it elsewhere.
- Build test: the reference home pages in en, de, ar, ja carry the SVG and the switch with the locale's label; `home-backdrop-16x9-768.avif` is still built.
- `npm run gate` (all nine gates, including a11y and Lighthouse).
- In the browser: the at-rest frame beside the raster; the loop running; the pause switch by mouse and keyboard; reduced motion emulated; LTR and RTL (ar); light and dark themes; a phone width.

## Out of scope

Animated twins of other pieces, an engine-wide `animate` for other heroes or sections, persisting the pause choice, and any change to the sample clip.
