# Reference site decisions

All names, figures and quotes on this site are fictional. Northwind Dynamics, its customers, people, offices, awards and certifications are invented for the mockup; no real company, person, award body or regulator is quoted or given figures. The controller families, historians and engineering tools the products integrate with are named as compatibility facts only (R-CONT-11).

## Brief

- Company: Northwind Dynamics, industrial automation software for production lines.
- Locales: en (default), de, ar, ja. Shared slugs. The imprint exists only in de (R-I18N-13).
- Voice: plain. Conversion: demo (header CTA and every CTA band point at `/demo/`).
- Pages: every core and optional page of bylaw 09; no module pages (investors, maintenance, coming soon).

## Overrides and rulings

- R-DEPLOY-08 override (owner, 2026-10-22: "instead of using example.com use northwind-dynamics.com"): the site's URL and every email address use `northwind-dynamics.com` instead of the reserved `example.com`, so the mockup reads like the company's own site. Phone numbers stay in reserved or placeholder ranges. The domain is not checked to be unregistered: if it belongs to someone, the mockup's mailto links would reach their mail server, so it should not be published as is.
- Lighthouse coverage follows R-GATE-10 sampling: every en page, one page per type in de and ar.
- The blog has three posts, so index pages carry no pagination (R-PAGE-11 applies from 13 items).
- Docs use the article layout with a table of contents instead of a sidebar nav; the catalog has no sidebar-nav section.
- Press releases name the head of communications as their author so the byline row shows the date.
- Pricing tiers carry `amount` and `currency` next to the displayed `price` so the Offer nodes can be generated.
- The contact and demo pages name the office of the page's language (Manchester for en, Hamburg for de, Riyadh for ar, Tokyo for ja) in their aside; the organisation's `contactPoint` in the schema is the Manchester number from `site.json`.
- The home page carries neither of the optional case-study cards and resources-latest sections (both live on their own index pages; the staggered item reveals of 0.4.0 cost about 3 KB per page); the landing page carries no stats section beyond its hero's and product pages carry no testimonial (R-PERF-01 at 60 KB with the 0.4.0 motion classes).
- The tagline is localised through the `site.tagline` string in `i18n/<locale>.json`.
- The style guide and every other test page are reached from `/sys/` (D56, D59): `/sys/` lists the style guide (`/sys/style-guide/`, sections grouped by purpose) and the HTML element reference (`/sys/html/`) with what each page shows, and links each language's system page (`/en/sys/`, `/de/sys/`, `/ar/sys/`, `/ja/sys/`), each listing only its own language's hidden pages, with the language switcher between them. None is linked from the site; `/en/style-guide/`, `/en/sys/style-guide/`, `/en/sys/html/` and the former `/en/qa/` redirect.
- The motion level is `expressive` (bylaws 0.6.0, D46): the reference site is the showcase and has to show every device of the flair dial; a new brief defaults to `standard`.

## Japanese (2026-10-22, D58)

- `ja` is a cultural adaptation, not a literal translation: です・ます in the plain voice, Japanese industry terms (`glossary.json`), people's names in katakana (プリヤ・ナタラジャン), 「」 quotations, 〜 for ranges, dates as 2026年11月12日.
- A fourth office, Tokyo (〒140-0002 東京都品川区東品川2-5-8, +81 3 1234 5678, Monday to Friday 9:00–18:00, closed on public holidays), exists in every language; copy that counts or lists the offices says four. The Riyadh press release keeps its date and still calls Riyadh the third office. Jobs stay in the three offices that hire.
- The Japanese contact and demo pages name the Tokyo office; the demo time field runs 09:00–18:00 Japan time.
- Prices are in yen, tax-exclusive as Japanese B2B sites state them (Starter 80,000円, Plant 300,000円 a month); plan names stay in Latin. The pricing note says Plant pays off from four lines (the English "five" is off by one against the prices).
- The online webinar shows Japan time (19:00〜20:00（日本時間）); in-person events show local time.
- No 特定商取引法 page: the Act exempts business-to-business sales. The privacy policy adds one sentence on the Act on the Protection of Personal Information.
- Not yet proofread by a native speaker (checklists/new-locale.md step 9).
