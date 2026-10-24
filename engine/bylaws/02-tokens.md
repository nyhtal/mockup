# 02 Tokens

Purpose: the single set of values every utility class on every site draws from. Tokens live in the `@theme` block of `engine/theme/app.css`; a site's brief sets only the brand inputs listed in R-TOK-14. Sources: https://tailwindcss.com/docs/theme, https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch, https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark.

### R-TOK-01 One spacing base
MUST. `--spacing` stays at Tailwind's `0.25rem`. All padding, margin, gap and size utilities use the numeric scale; arbitrary lengths (`p-[13px]`) are not allowed.
Why: One base unit is what makes spacing look consistent without anyone measuring.
Gate: consistency/no-arbitrary-lengths

### R-TOK-02 Rhythm steps
MUST. Vertical spacing between blocks uses only these steps: 2, 4, 6, 8, 12, 16, 24, 32 (`space-y-*`, `gap-*`, `mt-*`, `py-*`). Inside a component, 1, 3 and 5 are also allowed for fine alignment (button padding is `px-5`).
Why: Eight steps are enough for any layout and few enough to look deliberate.
Gate: manual: checklists/new-component.md

### R-TOK-03 Type scale
MUST. Font sizes come from Tailwind's default `--text-*` scale (`xs` 0.75rem … `6xl` 3.75rem) with their paired line heights. No arbitrary sizes. Bylaw 04 says which element uses which size.
Why: A fixed scale keeps hierarchy legible and translations predictable.
Gate: consistency/no-arbitrary-lengths

### R-TOK-04 Colour roles, not hues
MUST. Pages use only role colours: `brand-50…950`, `accent-50…950`, `surface`, `surface-alt`, `surface-raised`, `ink`, `ink-muted`, `ink-brand`, `ink-inverse`, `line`, `line-strong`, `focus`, `success`, `warning`, `danger` (each state colour with `-soft` and `-strong`). Tailwind's named palettes (`gray-900`, `blue-500`) are not used in pages.
Why: Roles let a brief change hues without touching a single class.
Gate: manual: checklists/new-component.md

### R-TOK-05 Roles carry both schemes
MUST. Every role token is defined with `light-dark(<light>, <dark>)` and `<html>` carries `scheme-light-dark`. Pages never use the `dark:` variant. Fallback: browsers older than Chrome 123, Safari 17.5 or Firefox 120 (all before mid-2024) ignore `light-dark()` and render the browser's default colours (black text, transparent backgrounds), which stays readable; `light-dark()` becomes Baseline Widely available on 2026-11-13. This overrides spec §4.4 (recorded in DECISIONS D7).
Why: Dark mode becomes a token concern instead of a class on every element; it follows the OS, and the theme toggle of R-COL-07 overrides it by changing `color-scheme` on `<html>` alone (D54).
Gate: manual: checklists/new-component.md

### R-TOK-06 Brand scales are generated
MUST. `brand-*` and `accent-*` are OKLCH scales generated from the brief's hue: lightness 97, 93, 86, 76, 66, 56, 48, 40, 33, 26, 20 for steps 50–950, chroma rising from 0.02 at the ends to 0.17 at 500–600. `brand-600` is the primary action colour and must reach 4.5:1 on `surface`.
Why: Generated scales are consistent across sites and guarantee a usable action colour.
Gate: manual: checklists/pre-delivery.md

### R-TOK-07 Radius presets
MUST. `--radius-sm|md|lg|xl|full` take one of three presets chosen in the brief: `sharp` (0, 0, 0, 0, 9999px), `soft` (0.25rem, 0.5rem, 0.75rem, 1rem, 9999px), `round` (0.5rem, 1rem, 1.5rem, 2rem, 9999px). Components use `rounded-md` for controls, `rounded-lg` for cards, `rounded-xl` for hero media, `rounded-full` for avatars and pills.
Why: Corner radius is the strongest single signal of a brand's personality and must be uniform.
Gate: manual: checklists/new-component.md

### R-TOK-08 Shadows
MUST. Only `shadow-sm` (cards at rest), `shadow-md` (cards on hover, dropdowns) and `shadow-lg` (dialogs, drawers) exist; `shadow-xl`, `shadow-2xl` and coloured shadows are not used.
Why: Three elevations are enough; more creates visual noise.
Gate: manual: checklists/new-component.md

### R-TOK-09 Z-index scale
MUST. `z-10` sticky header and sub-nav, `z-50` toasts. No other `z-*` is used: dropdowns, menus, drawers, tooltips and dialogs are popovers or dialogs (R-COMP-09), which live in the top layer and carry no `z-*`.
Why: Stacking bugs come from ad-hoc values.
Gate: manual: checklists/new-component.md

### R-TOK-10 Breakpoints and container
MUST. Breakpoints are Tailwind defaults (`sm` 40rem, `md` 48rem, `lg` 64rem, `xl` 80rem). The page container is exactly `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`; prose measure is `max-w-prose`.
Why: One container width makes every section line up.
Gate: manual: checklists/new-component.md

### R-TOK-11 Durations and easings
MUST. Durations are `duration-150` (hover, focus, press), `duration-200` (dropdown, popover, drawer), `duration-300` (dialog, page transition), `duration-(--reveal-duration)` (entrances, set by the flair dial in R-TOK-12) and `duration-1200` (the picture settle and the timeline rule, which travel further). Easings are `ease-out` for overlays, `ease-in-out` for movement, `ease-reveal` (`--ease-reveal: cubic-bezier(0.16, 1, 0.3, 1)`, an exponential ease-out: fast away, long settle) for every entrance, `ease-spring` (`--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)`, a slight overshoot) for the icon pop only, and `--ease-smooth` for the scroll-driven conveniences of R-MOT-14. The assembling art (D62) uses 800 ms (the expressive reveal duration, on `ease-reveal`) and 1200 ms, plus `linear` for its notches: the one time-based animation that is not eased, because a steady flow reads as something travelling along a pipe.
Why: Five durations and four named curves make motion feel like one system; the exponential ease-out is what makes an entrance read as deliberate rather than mechanical.
Gate: manual: checklists/new-component.md

### R-TOK-12 Motion presets
MUST. The brief's motion level is the flair dial. It sets four tokens and decides which treatments of DESIGN.md §3 a site gets; sections read the derived booleans, never the level name:

| Level | `--reveal-distance` (sections) | `--reveal-distance-item` (grid items; the second value below `md`) | `--reveal-duration` (every entrance) | Enables |
|---|---|---|---|---|
| `calm` | 16px | 24px / 16px | 500ms | rise only, static figures, no parallax, no pop |
| `standard` (default) | 32px | 40px / 24px | 700ms | the entrance vocabulary by column (R-MOT-16), picture settle, count-up v2, the heading rule draw, media-row depth, the reading-progress hairline |
| `expressive` | 40px | 56px / 32px | 800ms | everything in `standard` plus icon pop, hero depth (media and glows), the stats backdrop layer, CTA light drift, logo-cloud drift, the sticky editorial row, the count-up settle |

Keyframes and transitions read the distances via `var(--reveal-distance)` (a grid sets it to the item distance with `reveal-items`). Reduced motion overrides every level; sound is a separate opt-in (bylaw 20).
Why: Three levels give a brief a motion dial without exposing numbers, and "which effects" belongs to the dial as much as "how far": a calm site with parallax is a contradiction.
Gate: manual: checklists/new-site.md

### R-TOK-13 Animation tokens
MUST. The `@theme` block defines exactly these `--animate-*` tokens and their keyframes; entrances are transitions (R-MOT-05) and have none, except the one-shot assembly of D62 below, which is the art building itself rather than content arriving. Scroll-tracking: `progress` (scaleX 0 → 1, linear, the reading-progress hairline), `parallax-sm` (translateY −8px → 8px), `parallax-md` (−16px → 16px), `parallax-lg` (−24px → 24px), `drift` (translateX −12px → 12px) and its mirror `drift-end` for `rtl:`. Feedback: `settle` (scale 1.015 → 1 over 160 ms, after a count-up). Overlays and conveniences: `drop` (opacity 0 → 1, translateY(-0.5rem) → none), `scale-in` (opacity 0 → 1, scale 0.96 → 1), `fade` (opacity 0 → 1) and `rise-in` (opacity 0 → 1, translateY(0.5rem) → none, visibility hidden → visible, for scroll-driven appearance only). Ambient, once on load and only for the assembling art of D62, reached only through the `art-flow` utility (there is no `animate-assemble` or `animate-run` class, and the motion gate still reports them): `assemble` (800 ms `ease-reveal`, from an end-side offset `--art-x` and a horizontal scale `--art-sx` to the part at rest) and `run` (1200 ms linear, translate from 0 to `--art-run` with opacity 0 → 1 → 0, a lit notch travelling along a pipe). All animate only `opacity`, `transform`, `translate`, `scale` and, in `rise-in`, `visibility`.
Why: Thirteen keyframes cover everything that tracks the scroll or answers an action; a fixed list keeps the CSS small and lets a gate list what is allowed.
Gate: consistency/motion-vocabulary

### R-TOK-14 Brand inputs from the brief
MUST. A site's `site.json` `brand` object provides only: `hue` (0–360), `accentHue`, `radius` (`sharp|soft|round`), `density` (`compact|comfortable`), `motion` (`calm|standard|expressive`), `font` (name from the approved list). The build writes these into the `@theme` block; nobody edits `app.css` per site.
Why: Look-and-feel is a handful of numbers, by design.
Gate: manual: checklists/new-site.md

### R-TOK-15 Density
MUST. `density` only changes section padding (`comfortable` = `py-16 md:py-24`, `compact` = `py-12 md:py-16`) and card padding (`p-6` vs `p-4`). It changes no type sizes.
Why: Density must not become a second type scale.
Gate: manual: checklists/new-site.md

## Checklist

- [ ] R-TOK-01 no arbitrary lengths in pages
- [ ] R-TOK-02 spacing uses the rhythm steps
- [ ] R-TOK-03 default type scale only
- [ ] R-TOK-04 role colours only, no palette names
- [ ] R-TOK-05 roles use light-dark(), no dark: classes
- [ ] R-TOK-06 brand-600 on surface ≥ 4.5:1
- [ ] R-TOK-07 radius preset applied per element type
- [ ] R-TOK-08 three shadows
- [ ] R-TOK-09 z-index from the scale
- [ ] R-TOK-10 container string exact
- [ ] R-TOK-11 five durations, four named easings
- [ ] R-TOK-12 flair level tokens set; sections read booleans, not the level
- [ ] R-TOK-13 thirteen animation tokens, opacity/transform/translate/scale only; no entrance keyframes but D62's assembly
- [ ] R-TOK-14 brand inputs limited to the six keys
- [ ] R-TOK-15 density touches padding only
