# Reference site decisions

All names, figures and quotes on this site are fictional. Northwind Dynamics, its customers, people, offices, awards and certifications are invented for the mockup; no real company, person, award body or regulator is quoted or given figures. The controller families, historians and engineering tools the products integrate with are named as compatibility facts only (R-CONT-11).

## Brief

- Company: Northwind Dynamics, industrial automation software for production lines.
- Locales: en (default), de, ar. Shared slugs. The imprint exists only in de (R-I18N-13).
- Voice: plain. Conversion: demo (header CTA and every CTA band point at `/demo/`).
- Pages: every core and optional page of bylaw 09; no module pages (investors, maintenance, coming soon).

## Overrides and rulings

- Lighthouse coverage follows R-GATE-10 sampling: every en page, one page per type in de and ar.
- The blog has three posts, so index pages carry no pagination (R-PAGE-11 applies from 13 items).
- Docs use the article layout with a table of contents instead of a sidebar nav; the catalog has no sidebar-nav section.
- Press releases name the head of communications as their author so the byline row shows the date.
- Pricing tiers carry `amount` and `currency` next to the displayed `price` so the Offer nodes can be generated.
- The contact and demo pages name the office of the page's language (Manchester for en, Hamburg for de, Riyadh for ar) in their aside; the organisation's `contactPoint` in the schema is the Manchester number from `site.json`.
- The home page carries neither of the optional case-study cards and resources-latest sections (both live on their own index pages; the staggered item reveals of 0.4.0 cost about 3 KB per page); the landing page carries no stats section beyond its hero's and product pages carry no testimonial (R-PERF-01 at 60 KB with the 0.4.0 motion classes).
- The tagline is localised through the `site.tagline` string in `i18n/<locale>.json`.
- The style guide and every other test page are reached from `/sys/` (D56): `/sys/` links `/en/sys/`, which links the QA page `/en/qa/` and lists the style guide under `/en/sys/style-guide/`. None is linked from the site; `/en/style-guide/` redirects.
- The motion level is `expressive` (bylaws 0.6.0, D46): the reference site is the showcase and has to show every device of the flair dial; a new brief defaults to `standard`.
