# 05 Colour

Purpose: which role colour goes where, how much contrast is required, and how dark mode and states behave, so colour never has to be chosen on a page. Sources: WCAG 2.2 SC 1.4.3, 1.4.11, 1.4.1; https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark.

### R-COL-01 Role usage
MUST. Backgrounds use `bg-surface` (page), `bg-surface-alt` (alternate sections), `bg-surface-raised` (cards, popovers, dialogs). Text uses `text-ink` (body, headings), `text-ink-muted` (secondary), `text-ink-brand` (eyebrows, links and icons in the brand colour on surfaces), `text-ink-inverse` (on brand backgrounds and dark media; it is the same light value in both schemes because brand backgrounds do not change with the scheme). Borders use `border-line` and `border-line-strong` for inputs. Primary actions use `bg-brand-600 text-ink-inverse hover:bg-brand-700`; secondary actions use `border-line-strong text-ink hover:bg-surface-alt`.
Why: A page author should never pick a colour, only a role.
Gate: manual: checklists/new-component.md

### R-COL-02 Accent is rare
MUST. Accent means evidence (DESIGN.md §1). `accent-*` appears only in: the eyebrow marker rule, the marker under a case-study metric, the far end of the stats band's numeral gradient (`to-accent-200`), the hero's second glow, the far end of the CTA panel gradient and the footer hairline. It is never a button background, an icon tile or a text colour. Brand means identity and action (the mark, buttons, links, icon tiles, markers on timelines and steps); state colours mean state and never decorate (an icon tile is never `success`).
Why: An accent that is everywhere is not an accent, and a colour that means nothing is noise.
Gate: manual: checklists/new-component.md

### R-COL-03 Contrast
MUST. Text on its background reaches 4.5:1 (3:1 for text ≥ 24px or ≥ 19px bold); UI boundaries and focus indicators reach 3:1 against adjacent colours. This holds in both schemes.
Why: WCAG 1.4.3 and 1.4.11.
Gate: manual: checklists/pre-delivery.md

### R-COL-04 Focus ring
MUST. Every interactive element carries `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus` and nothing removes the outline. `focus` (without `-visible`) is not styled.
Why: One ring everywhere is both consistent and WCAG 2.4.7/2.4.13 compliant.
Gate: manual: checklists/pre-delivery.md

### R-COL-05 State colours only for states
MUST. `success`, `warning`, `danger` appear only in form feedback, alerts, badges and toasts. `danger-strong` text on `danger-soft` background, and so on, are the only pairings.
Why: A red heading is a mistake waiting to be read as an error.
Gate: manual: checklists/new-component.md

### R-COL-06 Never colour alone
MUST. Every meaning carried by colour (error, selected, current, required) is also carried by text, an icon or an underline.
Why: WCAG 1.4.1 and colour-blind users.
Gate: manual: checklists/pre-delivery.md

### R-COL-07 Dark scheme is automatic
MUST. No `dark:` classes in pages. Role tokens contain both values (R-TOK-05); media that cannot adapt gets a `bg-surface-raised` frame; shadows stay, and `line` gets lighter in dark mode via its token.
Why: Dark mode stays correct on every page because it exists in one place.
Gate: manual: checklists/new-component.md

### R-COL-08 Text over media
MUST. Text over images or video facades sits on a `bg-ink/60` overlay (or a `from-ink/70` gradient) and uses `text-ink-inverse`; the overlay is part of the component, never optional.
Why: Contrast over photographs cannot be guaranteed any other way.
Gate: manual: checklists/new-component.md

### R-COL-09 Gradients
MUST. Gradients appear only as: the hero glow (two radial gradients, brand behind the text and accent behind the media at ≤ 40 % alpha, no texture), the CTA panel (`bg-linear-to-br from-brand-700 via-brand-600 to-accent-600`), the stats band numerals (`from-ink-inverse to-accent-200` clipped to text, with `text-ink-inverse` as the fallback colour) the footer hairline (`from-brand-600 to-accent-600`, one pixel) and, in `expressive`, the stats band's depth layer (`from-brand-800/70 via-brand-700/0 to-accent-600/25`, behind the band). No other text gradients.
Why: A few gradients in fixed places read as a system; gradient body text fails contrast tools and prints badly.
Gate: manual: checklists/new-component.md

### R-COL-10 Forced colours
SHOULD. Components rely on borders or outlines, not background colour alone, for boundaries so they survive Windows High Contrast (`forced-colors: active`); icons use `currentColor`.
Why: High-contrast mode removes backgrounds and box shadows.
Gate: manual: checklists/pre-delivery.md

## Checklist

- [ ] R-COL-01 roles used per element type
- [ ] R-COL-02 accent only on evidence; icon tiles brand, never state colours
- [ ] R-COL-03 contrast measured in light and dark
- [ ] R-COL-04 focus ring on every control
- [ ] R-COL-05 state colours only on states
- [ ] R-COL-06 no colour-only meaning
- [ ] R-COL-07 no dark: classes
- [ ] R-COL-08 overlay under text on media
- [ ] R-COL-09 gradients only the hero glow, CTA panel, stats numerals and footer hairline
- [ ] R-COL-10 forced-colors check
