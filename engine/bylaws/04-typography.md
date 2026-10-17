# 04 Typography

Purpose: which font, size, weight and leading each kind of text uses, so a heading on the careers page looks like a heading on the pricing page. Sources: https://fontsource.org (OFL fonts), https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust, https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap.

### R-TYPO-01 Approved fonts
MUST. The brief's `font` is one of: `inter`, `figtree`, `ibm-plex-sans`, `source-sans-3`, `noto-sans`, or `system`. Arabic locales add `noto-sans-arabic`; the build only ships the files a site's locales need. Each is the variable `woff2` from `@fontsource-variable/<name>` (OFL 1.1).
Why: Variable fonts give every weight in one file; a short list keeps sites recognisably related.
Gate: manual: checklists/new-site.md

### R-TYPO-02 Font loading
MUST. The Latin font file is preloaded (`<link rel="preload" as="font" type="font/woff2" crossorigin>`); `@font-face` uses `font-display: swap` and a metric-matched local fallback (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`) so swapping causes no layout shift. The `system` choice ships no font files.
Why: Fonts are the usual cause of CLS and late LCP.
Gate: lighthouse/mobile/performance

### R-TYPO-03 Weights
MUST. Only `font-normal` (400), `font-medium` (500), `font-semibold` (600) and `font-bold` (700) are used. Headings are semibold or bold; body is normal; labels and nav are medium.
Why: Four weights are enough for hierarchy and keep the subset small.
Gate: manual: checklists/new-component.md

### R-TYPO-04 Element scale
MUST. Text elements use exactly these classes: h1 `text-4xl md:text-5xl font-bold tracking-tight text-balance`; h2 `text-3xl md:text-4xl font-semibold tracking-tight text-balance`; h3 `text-xl md:text-2xl font-semibold`; h4 `text-lg font-semibold`; eyebrow `text-sm font-medium uppercase tracking-wide text-brand-700`; lede `text-lg md:text-xl text-ink-muted`; body `text-base leading-relaxed`; small `text-sm text-ink-muted`; stat value `text-4xl font-bold tabular-nums`.
Why: Mapping element to class once removes the question forever.
Gate: manual: checklists/new-component.md

### R-TYPO-05 Line height
MUST. Headings use the scale's paired leading (`tracking-tight`, no override); body uses `leading-relaxed`; Arabic pages use `leading-loose` on prose and `leading-snug` on headings.
Why: Arabic script needs more vertical room for marks; Latin does not.
Gate: manual: checklists/new-locale.md

### R-TYPO-06 Balance, not pretty
MUST. `text-balance` is used on h1, h2 and ledes only; `text-pretty` is not used (limited availability).
Why: Balanced headings avoid orphans; `pretty` is not yet Baseline.
Gate: manual: checklists/new-component.md

### R-TYPO-07 Length limits
MUST. h1 ≤ 60 characters, h2 ≤ 80, eyebrow ≤ 30, button label ≤ 25, nav item ≤ 18, card title ≤ 70, lede ≤ 35 words. Limits apply to every locale.
Why: Over-long headings wrap into walls and break the rhythm.
Gate: manual: checklists/new-page.md

### R-TYPO-08 Links in prose
MUST. Links inside running text are `underline underline-offset-4 decoration-line hover:decoration-brand-600 text-ink`; links elsewhere (cards, nav) are not underlined at rest but gain `underline` on hover and `focus-visible` ring per bylaw 05.
Why: Underlines are the only reliable link affordance in prose.
Gate: a11y/link-in-text-block

### R-TYPO-09 Numbers
MUST. Figures in stats, tables and pricing use `tabular-nums`; locale formatting is done at build time (bylaw 11), never via JS.
Why: Aligned digits read as data; JS formatting would ship code.
Gate: manual: checklists/new-component.md

### R-TYPO-10 Prose component
MUST. Article bodies are rendered through the `prose` catalog component, which applies the element scale to markdown output via child selectors in the utility list (`[&_h2]:…`). No `@tailwindcss/typography` plugin.
Why: The plugin adds a stylesheet layer outside the bylaws' control.
Gate: manual: checklists/new-component.md

### R-TYPO-11 Capitalisation
MUST. Sentence case everywhere: headings, buttons, nav, labels. `uppercase` is allowed only on eyebrows and badges, with `tracking-wide`.
Why: Sentence case localises cleanly and reads faster.
Gate: manual: checklists/new-page.md

### R-TYPO-12 Glyph coverage
MUST. A locale whose script the brief's font does not cover gets its script font added to `font-sans` for that locale's pages only; text is never rendered in images.
Why: Tofu boxes are the most visible i18n failure.
Gate: manual: checklists/new-locale.md

## Checklist

- [ ] R-TYPO-01 font from the approved list
- [ ] R-TYPO-02 preload, swap, metric fallback
- [ ] R-TYPO-03 four weights
- [ ] R-TYPO-04 element → class map followed
- [ ] R-TYPO-05 leading per script
- [ ] R-TYPO-06 balance on h1/h2/lede only
- [ ] R-TYPO-07 length limits held in every locale
- [ ] R-TYPO-08 prose links underlined
- [ ] R-TYPO-09 tabular numbers, build-time formatting
- [ ] R-TYPO-10 prose component, no typography plugin
- [ ] R-TYPO-11 sentence case
- [ ] R-TYPO-12 script fonts per locale
