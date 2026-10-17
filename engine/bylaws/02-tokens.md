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
Why: Dark mode becomes a token concern instead of a class on every element; it follows the OS as D7 requires.
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
MUST. Durations are `duration-150` (hover, focus), `duration-200` (dropdown, popover), `duration-300` (dialog, drawer, page transition) and `duration-(--reveal-duration)` (scroll reveals, set by the motion preset in R-TOK-12). Easings are `ease-out` for entrances and `ease-in-out` for movement; `--ease-smooth: cubic-bezier(0.22, 1, 0.36, 1)` is the only custom easing.
Why: Four durations and two curves make motion feel like one system.
Gate: manual: checklists/new-component.md

### R-TOK-12 Motion presets
MUST. The brief's motion level sets three tokens: `calm` = distance 8px, duration 200ms, stagger 0; `standard` = 16px, 300ms, 60ms; `expressive` = 24px, 500ms, 90ms. Keyframes read them via `var(--reveal-distance)` and `var(--reveal-duration)`; nothing else changes.
Why: One switch changes the feel of the whole site without touching components.
Gate: manual: checklists/new-site.md

### R-TOK-13 Animation tokens
MUST. The `@theme` block defines exactly these `--animate-*` tokens and their keyframes: `reveal` (translateY(var(--reveal-distance)) → none, transform only), `reveal-start` (translateX from the inline-start side, transform only), `drop` (opacity 0 → 1, translateY(-0.5rem) → none), `scale-in` (opacity 0 → 1, scale 0.96 → 1), `fade` (opacity 0 → 1). All animate only `opacity` and `transform`; the two scroll reveals never touch opacity, because an element partly in view at load would be mid-fade and fail contrast checks.
Why: Five entrances cover every component; a fixed list keeps the CSS small.
Gate: manual: checklists/new-component.md

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
- [ ] R-TOK-11 four durations, two easings
- [ ] R-TOK-12 motion preset tokens set
- [ ] R-TOK-13 five animation tokens, transform/opacity only
- [ ] R-TOK-14 brand inputs limited to the six keys
- [ ] R-TOK-15 density touches padding only
