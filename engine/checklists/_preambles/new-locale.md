# New locale checklist

Use this when a site adds a language. The reference site added German (text expansion) and Arabic (right-to-left, its own script) in one phase; both are worked examples under `sites/reference/`.

## Procedure

1. **Engine strings**: copy `engine/i18n/_template.json` to `engine/i18n/<locale>.json` and translate every key, keeping placeholders (`{n}`, `{count}`, `{query}`, `{provider}`, `{label}`) and giving plural strings all five CLDR forms. Add the locale to `OG_LOCALES` and `FORMAT_LOCALES` in `eleventy.config.js` if its tag needs a region.
2. **Site strings**: `sites/<name>/i18n/<locale>.json` with the same keys as the default locale's overlay (nav, footer, `site.tagline`, site map groups).
3. **Site config**: add the locale to `site.json` `locales`, and to `rtl` when it is right-to-left; `numberingSystem` only if the brief asks for native digits.
4. **Content**: `data/<locale>/entities.json` and `pages.json` with every slug and section id of the default locale (a missing site section fails the build; a missing page fails the coverage check), and `content/<locale>/*.md` for every singular page. Locale-specific legal pages (imprint for `de`/`at`) exist only where required.
5. **Lengths in the new language**: descriptions 120–155 characters, titles ≤ 60, button labels ≤ 25, nav items ≤ 18; the consistency gate measures the first two.
6. **Script coverage**: if the brand font does not cover the script, `build-fonts.js` adds the script face, subsets it, puts it in the stack and preloads it on that locale's pages. Check the built CSS `--font-sans` and the `<link rel="preload">` on a page of the locale.
7. **Build and gate** with `--skip lighthouse`; `i18n/keys` and `i18n/lang-attr` must be clean.
8. **Open the locale in the browser pane**: one page per template at 320 px, 1024 px and 1280 px. Check the header, drawer, breadcrumbs, cards, forms, footer and locale switcher. For RTL: the wordmark reads left to right, chevrons and arrows mirror, the drawer opens from the end edge, numbers and dates are formatted (Latin digits unless opted in).
9. **Native-speaker proofread** of the strings and the content before delivery; record who read it in the site's `DECISIONS.md`.

## Learned on the reference site

- German compounds in headings ("Stillstandskostenrechner") overflow 320 px unless the body hyphenates (`hyphens-auto` for `de`) and wraps (`wrap-break-word`).
- The header holds four nav groups, the switcher, search and the CTA only from `xl`; between `lg` and `xl` the switcher is icon-only and the wordmark one step smaller.
- Arabic plurals: "1 دقائق قراءة" is wrong; `t(key, n)` with the five forms fixes it.
- Japanese (D58): no web font fits the page budget, so the system faces carry it; write no spaces between Japanese and Latin text (`text-autospace` adds them); descriptions are 60–77 Japanese characters because widths count double.
