# 05 Colour

Purpose: which role colour goes where, how much contrast is required, and how dark mode and states behave, so colour never has to be chosen on a page. Sources: WCAG 2.2 SC 1.4.3, 1.4.11, 1.4.1; https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark.

### R-COL-01 Role usage
MUST. Backgrounds use `bg-surface` (page), `bg-surface-alt` (alternate sections), `bg-surface-raised` (cards, popovers, dialogs). Text uses `text-ink` (body, headings), `text-ink-muted` (secondary), `text-ink-brand` (eyebrows, links and icons in the brand colour on surfaces), `text-ink-inverse` (on brand backgrounds and dark media; it is the same light value in both schemes because brand backgrounds do not change with the scheme). Borders use `border-line` and `border-line-strong` for inputs. Primary actions use `bg-brand-600 text-ink-inverse hover:bg-brand-700`; secondary actions use `border-line-strong text-ink hover:bg-surface-alt`.
Why: A page author should never pick a colour, only a role.
Gate: manual: checklists/new-component.md

### R-COL-02 Accent is rare
MUST. `accent-*` appears only in eyebrows, highlighted stats, the active nav indicator and the CTA band gradient. It is never a button background.
Why: An accent that is everywhere is not an accent.
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
MUST. Gradients appear only in the hero background and the CTA band, built as `bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600`. Text gradients are not used.
Why: Gradient text fails contrast tools and prints badly.
Gate: manual: checklists/new-component.md

### R-COL-10 Forced colours
SHOULD. Components rely on borders or outlines, not background colour alone, for boundaries so they survive Windows High Contrast (`forced-colors: active`); icons use `currentColor`.
Why: High-contrast mode removes backgrounds and box shadows.
Gate: manual: checklists/pre-delivery.md

## Checklist

- [ ] R-COL-01 roles used per element type
- [ ] R-COL-02 accent limited to listed spots
- [ ] R-COL-03 contrast measured in light and dark
- [ ] R-COL-04 focus ring on every control
- [ ] R-COL-05 state colours only on states
- [ ] R-COL-06 no colour-only meaning
- [ ] R-COL-07 no dark: classes
- [ ] R-COL-08 overlay under text on media
- [ ] R-COL-09 gradients only hero and CTA band
- [ ] R-COL-10 forced-colors check
