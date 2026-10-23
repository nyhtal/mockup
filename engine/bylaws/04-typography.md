# 04 Typography

Purpose: which font, size, weight and leading each kind of text uses, so a heading on the careers page looks like a heading on the pricing page. Sources: https://fontsource.org (OFL fonts), https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust, https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap.

### R-TYPO-01 Approved fonts
MUST. The brief's `font` is one of: `inter`, `figtree`, `ibm-plex-sans`, `source-sans-3`, `noto-sans`, or `system`. Arabic locales add `noto-sans-arabic`; the build only ships the files a site's locales need. Each is the variable `woff2` from `@fontsource-variable/<name>` (OFL 1.1); Latin faces ship as delivered, script faces are subset at build time to the script's core blocks and the weights the catalog uses (400–700), which takes the Arabic face from 166 KB to 53 KB so an Arabic page fits R-PERF-01. Japanese ships no face (D58): it uses the platform's own (Hiragino Sans, BIZ UDPGothic, Meiryo, Noto Sans CJK JP), added after the brand font on Japanese pages only, because a Japanese web font cut to one site's characters still weighs about 450 KB.
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
MUST. Text elements use exactly these classes: h1 `text-4xl md:text-5xl font-bold tracking-tight text-balance` (in a hero, `xl:text-6xl` as well, except German pages, which stay at `text-5xl` through `xl:[&:lang(de)]:text-5xl` because their compounds would break mid-word); h2 `text-3xl md:text-4xl font-semibold tracking-tight text-balance`; h3 `text-xl md:text-2xl font-semibold`; h4 `text-lg font-semibold`; eyebrow `text-sm font-medium uppercase tracking-wide text-ink-brand`; lede `text-lg md:text-xl text-ink-muted`; body `text-base leading-relaxed`; small `text-sm text-ink-muted`; stat value `text-4xl font-bold tabular-nums` (`text-3xl sm:text-4xl md:text-5xl lg:text-6xl` on the stats band, where two columns from 320 px must hold a non-wrapping eight-character value such as the German "99,98 %"); hero proof figure `text-xl md:text-2xl font-semibold tabular-nums whitespace-nowrap`.
Why: Mapping element to class once removes the question forever.
Gate: manual: checklists/new-component.md

### R-TYPO-05 Line height
MUST. Headings use the scale's paired leading (`tracking-tight`, no override); body uses `leading-relaxed`; Arabic and Japanese pages use `leading-loose` on prose and `leading-snug` on headings, with no letter-spacing.
Why: Arabic script needs more vertical room for marks, and Japanese characters fill the whole em square, so lines need air between them; Latin does not.
Gate: manual: checklists/new-locale.md

### R-TYPO-06 Balance, not pretty
MUST. `text-balance` is used on h1, h2 and ledes only; `text-pretty` is not used (limited availability).
Why: Balanced headings avoid orphans; `pretty` is not yet Baseline.
Gate: manual: checklists/new-component.md

### R-TYPO-07 Length limits
MUST. h1 ≤ 60 characters, h2 ≤ 80, eyebrow ≤ 30, button label ≤ 25, nav item ≤ 18, card title ≤ 70, lede ≤ 35 words. Limits apply to every locale; characters are display widths (R-HTML-03) and in Japanese two characters count as a word.
Why: Over-long headings wrap into walls and break the rhythm.
Gate: manual: checklists/new-page.md

### R-TYPO-08 Links in prose
MUST. Links inside running text are `underline underline-offset-4 decoration-line hover:decoration-brand-600 text-ink`; links elsewhere (cards, nav) are not underlined at rest but gain `underline` on hover and `focus-visible` ring per bylaw 05.
Why: Underlines are the only reliable link affordance in prose.
Gate: a11y/link-in-text-block

### R-TYPO-09 Numbers
MUST. Figures in stats, tables and pricing use `tabular-nums`; locale formatting is done at build time (bylaw 11), never via JS. The count-up of R-MOT-10 renders its intermediate frames with `Intl.NumberFormat` in the page's language with Latin digits and ends by restoring the build-time text exactly, so the figure a reader keeps is the one the build wrote.
Why: Aligned digits read as data; the build decides formatting, the script only passes through it.
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

### R-TYPO-13 Japanese typesetting
MUST. Japanese pages break lines strictly (`line-break: strict`: no small kana or closing bracket starts a line), break headings between phrases (`word-break: auto-phrase` on h1–h3), space Japanese from Latin text and digits (`text-autospace: normal`) instead of typed spaces, never synthesise italics (`font-synthesis-style: none`; emphasis is bold) and quote with 「」, which the Markdown renders as `<q>`. Reading time counts 500 characters a minute.
Why: Japanese has no spaces between words, so the browser's defaults break lines inside words and leave punctuation at line starts; the system faces have no italics, and an oblique kanji reads as a rendering fault.
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
- [ ] R-TYPO-13 Japanese line breaking, spacing and emphasis
