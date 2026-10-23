# 09 Pages

Purpose: the complete page inventory for a corporate site with each page's tier, URL, title pattern, required sections and schema contract, so "build the careers section" needs no further questions. Schema contract IDs refer to `engine/schema-contracts.json` and bylaw 13.

### R-PAGE-01 Tiers
MUST. Every page type is `core`, `optional` or `module`. A brief that says nothing gets every core page in every locale; optional pages are added by name; module pages come with their industry module.
Why: Bounds "every corporate site" to something buildable.
Gate: manual: checklists/new-site.md

### R-PAGE-02 URL policy
MUST. URLs are `/<locale>/<slug>/` with lower-case hyphenated slugs, trailing slash, no file extension, at most three segments below the locale. Detail pages live under their index (`/en/services/<slug>/`). Slugs are translated per locale via `site.json` `slugs` when the brief asks; otherwise the default-locale slug is reused.
Why: Predictable URLs, clean hreflang, no redirect chains.
Gate: manual: checklists/new-page.md

### R-PAGE-03 One primary conversion per page
MUST. Each page declares `conversion` in front matter (demo, contact, download, apply, subscribe, none); the header CTA and the CTA band both point at it.
Why: The brief's conversion goal must be visible on every page.
Gate: manual: checklists/new-page.md

### R-PAGE-04 Meta contract
MUST. Each page type has a title pattern and a description pattern (table below); breadcrumbs reflect the URL path; the OG image is the generated social image for that page (bylaw 17).
Why: Search snippets and shares look uniform.
Gate: manual: checklists/new-page.md

### R-PAGE-05 Schema contract
MUST. Each page type emits the JSON-LD graph named in the table; the schema gate enforces the required types.
Why: Structured data is part of the page definition, not an afterthought.
Gate: schema/contract

### R-PAGE-06 Legal pages
MUST. Privacy, cookies, terms, accessibility statement and (for `de`/`at` locales) the imprint exist on every site, carry a "Last reviewed" `<time>`, use the `prose` component and have no CTA band.
Why: Required in the EU and expected everywhere; a CTA on a legal page is tone-deaf.
Gate: manual: checklists/new-site.md

### R-PAGE-07 Error pages
MUST. `404.html` and `500.html` exist at the output root and per locale, use the base shell, offer search and three top links, and reference nothing that could itself fail (no facades, no forms).
Why: Static hosts serve root error pages; they must work when everything else is broken.
Gate: manual: checklists/pre-delivery.md

### R-PAGE-08 Root redirect
MUST. `/index.html` at the output root is a valid page that sends the visitor to the default locale with `<meta http-equiv="refresh" content="0; url=/<default>/">` and a visible link; it carries `noindex`.
Why: Static hosts cannot negotiate language; the root must still resolve.
Gate: manual: checklists/pre-delivery.md

### R-PAGE-09 Style guide
MUST. `/sys/style-guide/` exists with `noindex` and shows every catalog entry used on the site (R-COMP-16), listed with a line on each page's contents on `/sys/`. It is built once, outside any locale and in the default locale's language, because its sample data is English; the site's own pages show the chrome in every other locale. Its sections are grouped by purpose in `engine/catalog/style-guide-sections.json`, one page each, and the build fails when a catalog section is in no group (D59).
Why: Regression page and designer reference; a German URL with English content would be a validator warning and a lie to search engines.
Gate: manual: checklists/pre-delivery.md

### R-PAGE-10 Thank-you pages
MUST. Every form has its own thank-you page (`/<locale>/<form-slug>/thank-you/`) with `noindex`, a confirmation of what happened and one next step.
Why: GET forms need a destination, and users need confirmation.
Gate: manual: checklists/new-page.md

### R-PAGE-11 Pagination and archives
MUST. Index pages paginate at 12 items with `rel="prev"`/`rel="next"` links in the body, page numbers in the URL (`/en/blog/page/2/`), and `noindex` on tag archives.
Why: Keeps index pages light and avoids duplicate-content archives.
Gate: manual: checklists/new-page.md

### R-PAGE-12 Noindex set
MUST. These pages carry `<meta name="robots" content="noindex">` and are excluded from the sitemap: root redirect, style guide, thank-you pages, search results, tag archives, 404, 500, maintenance, coming soon. Lighthouse's SEO category is not scored for them (its is-crawlable audit fails by design); the other three categories still must reach 100 (R-GATE-10).
Why: Utility pages must not compete in search.
Gate: manual: checklists/pre-delivery.md

## Inventory

Title patterns use `{T}` = page title, `{S}` = site name, `{C}` = company name from the brief. Section names refer to `catalog/sections/`.

| Page type | Tier | URL | Title | Required sections (in order) | Optional sections | Schema |
|---|---|---|---|---|---|---|
| home | core | `/` | `{S} · {Tagline}` | hero, logo-cloud, feature-grid, feature-rows, stats, testimonials, cta-band | case-study-cards, resources-latest, newsletter | home |
| about | core | `/about/` | `About · {S}` | page-header, feature-rows, stats, team-preview, cta-band | timeline, values-grid, awards | about |
| team | core | `/about/team/` | `Leadership · {S}` | page-header, team-grid | cta-band | team |
| person | optional | `/about/team/<slug>/` | `{Name} · {S}` | page-header, person-bio | related-articles | person |
| history | optional | `/about/history/` | `Our history · {S}` | page-header, timeline | cta-band | about |
| values | optional | `/about/values/` | `Mission and values · {S}` | page-header, values-grid | cta-band | about |
| locations | core | `/about/locations/` | `Locations · {S}` | page-header, office-cards | map-facade | locations |
| office | optional | `/about/locations/<slug>/` | `{City} office · {S}` | page-header, office-detail, map-facade | team-preview | office |
| services | core | `/services/` | `Services · {S}` | page-header, service-cards, cta-band | faq | collection |
| service | core | `/services/<slug>/` | `{T} · {S}` | page-header, feature-rows, steps, stats, testimonials, cta-band | faq, case-study-cards, pricing | service |
| products | optional | `/products/` | `Products · {S}` | page-header, product-cards, cta-band | comparison | collection |
| product | optional | `/products/<slug>/` | `{T} · {S}` | page-header, feature-rows, feature-grid, pricing, faq, cta-band | integrations, testimonials | product |
| industries | optional | `/industries/` | `Industries · {S}` | page-header, industry-cards | cta-band | collection |
| industry | optional | `/industries/<slug>/` | `{T} · {S}` | page-header, feature-rows, case-study-cards, cta-band | stats, faq | service |
| pricing | optional | `/pricing/` | `Pricing · {S}` | page-header, pricing, comparison, faq, cta-band | testimonials | pricing |
| partners | optional | `/partners/` | `Partners · {S}` | page-header, logo-cloud, integration-grid, cta-band | — | collection |
| customers | core | `/customers/` | `Customers · {S}` | page-header, logo-cloud, case-study-cards, testimonials, cta-band | filter-bar | collection |
| case-study | core | `/customers/<slug>/` | `{T} · {S}` | page-header, stats, prose, testimonial-single, related-items, cta-band | — | article |
| resources | optional | `/resources/` | `Resources · {S}` | page-header, resource-tabs, cta-band | newsletter | collection |
| blog | core | `/blog/` | `Blog · {S}` | page-header, article-cards, pagination | filter-bar, newsletter | blog |
| post | core | `/blog/<slug>/` | `{T} · {S}` | page-header, article-meta, prose, author-box, related-items | toc, share-links | post |
| archive | optional | `/blog/tag/<slug>/` | `{Tag} · Blog · {S}` | page-header, article-cards, pagination | — | collection |
| author | optional | `/blog/author/<slug>/` | `{Name} · {S}` | page-header, person-bio, article-cards | — | person |
| downloads | optional | `/resources/downloads/` | `Downloads · {S}` | page-header, download-cards | filter-bar | collection |
| download | optional | `/resources/downloads/<slug>/` | `{T} · {S}` | page-header, download-detail, gated-form | related-items | article |
| events | optional | `/events/` | `Events · {S}` | page-header, event-cards | newsletter | collection |
| event | optional | `/events/<slug>/` | `{T} · {S}` | page-header, event-detail, registration-form | speakers, faq | event |
| faq | core | `/faq/` | `FAQ · {S}` | page-header, faq-groups, cta-band | — | faq |
| glossary | optional | `/glossary/` | `Glossary · {S}` | page-header, glossary-list | — | collection |
| help | optional | `/help/` | `Help · {S}` | page-header, search-box, help-categories | — | collection |
| doc | optional | `/help/<slug>/` | `{T} · Help · {S}` | sidebar-nav, prose, was-this-helpful | toc | article |
| news | core | `/news/` | `News · {S}` | page-header, press-cards, pagination | media-kit-cta | collection |
| press-release | core | `/news/<slug>/` | `{T} · {S}` | page-header, article-meta, prose, media-contact | — | news |
| media-kit | optional | `/news/media-kit/` | `Media kit · {S}` | page-header, download-cards, media-contact | — | collection |
| careers | core | `/careers/` | `Careers · {S}` | page-header, feature-grid, testimonials, job-list, cta-band | benefits-grid, stats | collection |
| job | core | `/careers/<slug>/` | `{T} · Careers · {S}` | page-header, job-detail, apply-form | related-items | job |
| culture | optional | `/careers/culture/` | `Life at {C} · {S}` | page-header, feature-rows, image-gallery, benefits-grid, cta-band | — | about |
| investors | module | `/investors/` | `Investors · {S}` | page-header, stats, download-cards, contact-card | — | collection |
| sustainability | optional | `/sustainability/` | `Sustainability · {S}` | page-header, feature-rows, stats, download-cards | timeline | about |
| trust | optional | `/trust/` | `Trust and security · {S}` | page-header, feature-grid, badges, faq, contact-card | — | about |
| contact | core | `/contact/` | `Contact · {S}` | page-header, contact-form, office-cards | map-facade, faq | contact |
| demo | optional | `/demo/` | `Request a demo · {S}` | page-header, contact-form, logo-cloud, testimonials | — | contact |
| newsletter | optional | `/newsletter/` | `Newsletter · {S}` | page-header, newsletter-form | — | generic |
| preferences | optional | `/newsletter/preferences/` | `Email preferences · {S}` | page-header, preferences-form | — | generic |
| unsubscribe | optional | `/newsletter/unsubscribe/` | `Unsubscribe · {S}` | page-header, unsubscribe-form | — | generic |
| landing | optional | `/lp/<slug>/` | `{T} · {S}` | hero, logo-cloud, feature-grid, testimonials, contact-form | stats, faq | generic |
| thank-you | core | `/<form>/thank-you/` | `Thank you · {S}` | page-header, confirmation | related-items | generic |
| search | core | `/search/` | `Search · {S}` | page-header, search-box, search-results | — | search |
| sitemap | core | `/sitemap/` | `Site map · {S}` | page-header, sitemap-list | — | generic |
| style-guide | core | `/sys/style-guide/` (outside any locale) | `Style guide · {S}` | page-header, style-guide-sections | — | generic |
| privacy, cookies, terms, accessibility, imprint | core | `/legal/<slug>/` | `{T} · {S}` | page-header, prose | — | generic |
| 404, 500, maintenance, coming-soon | core | root and `/<locale>/` | `{T} · {S}` | error-state | — | generic |

## Checklist

- [ ] R-PAGE-01 tiers applied from the brief
- [ ] R-PAGE-02 URL pattern followed
- [ ] R-PAGE-03 conversion declared
- [ ] R-PAGE-04 title/description patterns
- [ ] R-PAGE-05 schema contract per page type
- [ ] R-PAGE-06 legal pages present with review dates
- [ ] R-PAGE-07 error pages self-contained
- [ ] R-PAGE-08 root redirect page
- [ ] R-PAGE-09 style guide present
- [ ] R-PAGE-10 thank-you page per form
- [ ] R-PAGE-11 pagination at 12
- [ ] R-PAGE-12 noindex set applied
