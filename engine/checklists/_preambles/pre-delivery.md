# Pre-delivery checklist

Run this on the final build of a site, after the last content change. Its results go into `reports/latest.md` under a "Manual checks" heading with the date, the commit and the name of the person who did them (R-GATE-12). Budget half a day for a three-locale site.

## 1. The gates

- `npm run build -- --site <name>` then `npm run gate -- --site <name>`: all nine gates pass, `reports/latest.md` is regenerated and committed with the build's commit hash in its header. Lighthouse takes several hours on a large site (every default-locale page, one page per type in each other locale); run it last and unattended.
- The report's "Needs human review (axe incomplete)" list is read, not ignored. Items on `svg > text` (wordmarks, logo clouds) are covered by the theme's contrast check on the role tokens; anything else is checked by hand with a contrast tool.

## 2. Reflow and zoom (R-LAY-05, R-A11Y-19)

On one page per template, in every locale:

- 320 px wide: no horizontal scrolling, no clipped text, header fits, long headings wrap or hyphenate.
- 1024 px wide: the full header fits on one line, the CTA does not wrap.
- 400 % zoom at 1280 px: same checks.
- User text spacing (line height 1.5, paragraph 2×, letter 0.12em, word 0.16em): nothing clips.

## 3. Keyboard, screen reader and modes (R-A11Y-20)

On one page per template:

- Keyboard walk with no mouse: skip link first, visible focus on every control, popovers and the drawer open and close with Enter, Escape and outside click, focus returns to the trigger.
- Screen-reader read (NVDA on Windows) of header, hero, one section and footer: landmarks named, headings in order, the current page announced in the nav and the locale switcher.
- RTL locale: the wordmark reads left to right, arrows and chevrons mirror, the drawer opens from the end edge, text aligns start.
- Dark scheme, Windows High Contrast, reduced motion, print preview: readable, boundaries visible, nothing hidden.

## 4. Structured data (R-SCH-13)

One page per type in Google's Rich Results Test and the Schema Markup Validator: no errors; warnings noted.

## 5. Content

- Native-speaker proofread of every locale is done and recorded in the site's `DECISIONS.md` (who, when).
- The fictional-content statement is in `DECISIONS.md`; no real customer, person, award body or regulator is quoted or given figures.
- Every form's thank-you page is reached by submitting the form in the browser pane.

## 6. Deliverable

- `dist/<name>/` copied to a clean folder opens from its root with the headers and redirects files applied by the host; `404.html`, `500.html`, `sitemap.xml`, `robots.txt`, `feed.xml` per locale and `.well-known/security.txt` are present.
- `reports/latest.md` records the gate table, the Lighthouse coverage table, the page weights and the manual checks above.
