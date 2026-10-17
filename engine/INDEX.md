# Engine index: what to read for which task

Read the files in the order listed. Bylaws are numbered rule files in `bylaws/`; each rule has an ID like `R-HTML-04` that pages, decisions and reviews cite.

## Build a new site from a Site Brief

1. `site-brief/TEMPLATE.md` (the brief's fields and defaults)
2. `DECISIONS.md` (engine-wide decisions D1–D25)
3. `bylaws/00-precedence.md`
4. `bylaws/09-pages.md` (inventory and tiers → which pages to create)
5. `bylaws/02-tokens.md` (brand inputs → `site.json`)
6. `bylaws/10-content.md` and `bylaws/11-i18n.md` (voice, locales, strings)
7. `bylaws/08-sections.md` (what each page is made of)
8. `checklists/new-site.md`

## Add a page to a site

1. `bylaws/09-pages.md` (its row: URL, title, sections, schema contract)
2. `bylaws/08-sections.md` (section order and limits)
3. `bylaws/12-seo-meta.md` and `bylaws/13-schema.md`
4. `bylaws/10-content.md` (lengths, wording)
5. `checklists/new-page.md`

## Add or change a catalog component

1. `bylaws/07-components.md` (anatomy block, states, patterns)
2. `bylaws/01-html.md`, `bylaws/02-tokens.md`, `bylaws/03-layout.md`, `bylaws/04-typography.md`, `bylaws/05-color.md`, `bylaws/06-motion.md`
3. `bylaws/14-accessibility.md` and, for forms, `bylaws/16-forms.md`
4. `checklists/new-component.md`

## Add a locale

1. `bylaws/11-i18n.md`
2. `bylaws/03-layout.md` (R-LAY-04, R-LAY-08, R-LAY-09) and `bylaws/04-typography.md` (R-TYPO-05, R-TYPO-12)
3. `i18n/_template.json` → `i18n/<locale>.json`
4. `checklists/new-locale.md`

## Review or deliver a site

1. `bylaws/19-quality-gates.md`
2. `bylaws/15-performance.md`, `bylaws/17-assets.md`, `bylaws/18-security-deploy.md`
3. `checklists/pre-delivery.md`
4. `reports/latest.md` (the evidence)

## Change the bylaws

1. `bylaws/00-precedence.md` (R-PREC-03 to R-PREC-05)
2. `CHANGELOG.md`
3. Rebuild and gate the reference site in `sites/reference/`
