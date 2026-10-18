# New site checklist

Use this once per site, from the Site Brief to the first green gate. It took the reference site (`sites/reference/`) about four commits; most of the time goes into the content data.

## Procedure

1. **Read the brief against `engine/site-brief/TEMPLATE.md`.** Every field has a destination file; a field the brief leaves empty takes the template's default. Decide the voice preset, the conversion, the locales (and which are RTL), the page tiers (core by default, optional by name) and the brand inputs.
2. **Create `sites/<name>/site.json`** from the brief: `name`, `tagline` (fallback; the localised one lives in the string overlay), `url`, `year`, `defaultLocale`, `locales`, `rtl`, `hasSearch`, `voice`, `contact`, `errorLinks`, `cta`, `nav`, `footer` (columns and legal), `brand` (`hue`, `accentHue`, `radius`, `density`, `motion`, `font`), `allowedExternal`. Labels are string keys, never text.
3. **Create the string overlay** `sites/<name>/i18n/<locale>.json` for every locale: nav labels and descriptions, footer column titles, `site.tagline`, site map group names, and any plural strings as objects of CLDR forms. Every locale must carry the same keys (`i18n/keys`).
4. **Create the data** `sites/<name>/data/<locale>/entities.json` and `pages.json` for every locale, same slugs everywhere. Start from the reference site's files and replace the content; keep every entity kind the recipes need. Descriptions are 120–155 characters in every locale (German runs about 35 % longer than English).
5. **Create the singular pages** `sites/<name>/content/<locale>/*.md` (front matter only; legal pages carry their markdown body with a "Last reviewed" `<time>`), plus `legal/imprint.md` for `de`.
6. **Write `sites/<name>/DECISIONS.md`**: the brief summary, the fictional-content statement, every override of a bylaw with rule ID, replacement, reason and date (R-PREC-02), and any third-party assets with their rights.
7. **Write `sites/<name>/glossary.json`** with the product and industry terms per locale.
8. **Build and gate**: `npm run build -- --site <name>` then `npm run gate -- --site <name> --skip lighthouse` while iterating; the full gate (with Lighthouse, several hours on a large site) before delivery. Fix findings in the data, never in the catalog.
9. **Run the checks in `pre-delivery.md`** and record them in `reports/latest.md`.

## Learned on the reference site

- The three-locale chrome (header, drawer, footer, switcher) costs about 27 KB per page; home pages with every optional section may exceed the HTML budget. Drop optional sections before touching the catalog.
- A German page with English UI strings is invisible to the gates: open one page per locale and read the chrome.
- A script font the brand font does not cover must be in the stack (`fontPlan` adds it); check that Arabic renders in Noto Sans Arabic, not in the Latin fallback.
