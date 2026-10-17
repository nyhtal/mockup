# Reference site decisions

All names, figures and quotes on this site are fictional. Northwind Dynamics, its customers, people, offices, awards and certifications are invented for the mockup; no real company, person, award body or regulator is referenced.

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
