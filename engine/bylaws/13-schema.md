# 13 Structured data

Purpose: one JSON-LD graph per page that is valid, visible-content-only and typed by page. Sources: https://schema.org, https://developers.google.com/search/docs/appearance/structured-data/sd-policies, https://developers.google.com/search/docs/appearance/structured-data/search-gallery (25 features as of 2026-06; FAQ and HowTo rich results withdrawn), https://json-ld.org.

### R-SCH-01 One block, one graph
MUST. Each page has exactly one `<script type="application/ld+json">` in the head containing `{"@context":"https://schema.org","@graph":[…]}`. No microdata, no RDFa.
Why: One block is one thing to validate and one thing to read.
Gate: schema/single-block

### R-SCH-02 Shared nodes
MUST. Every graph contains `Organization` with `@id` `{site.url}/#organization` (name, url, logo as `ImageObject`, `sameAs` only for real profiles the brief supplies, `contactPoint` when a contact page exists) and `WebSite` with `@id` `{site.url}/#website` (`publisher` → organization, `inLanguage`; `potentialAction: SearchAction` only when a search page exists).
Why: Stable identifiers let every page point at the same entity.
Gate: schema/contract

### R-SCH-03 Page node
MUST. Every graph contains one `WebPage` (or the subtype the contract names: `AboutPage`, `ContactPage`, `CollectionPage`, `ProfilePage`, `SearchResultsPage`, `FAQPage`) with `@id` and `url` equal to the canonical, `name`, `description`, `isPartOf` → website, `inLanguage`, `breadcrumb` → the page's `BreadcrumbList` (non-home pages) and `primaryImageOfPage` when the page has a hero image.
Why: The page node ties content nodes to the site.
Gate: schema/contract

### R-SCH-04 Stable ids and resolvable references
MUST. Nodes that are referenced carry an `@id` that is an absolute URL (`{canonical}#breadcrumb`, `{site.url}/about/team/jane-doe/#person`); references are `{"@id": …}` objects and every reference resolves to a node in the same graph or to another page's canonical with a fragment.
Why: Dangling references are silent errors in every validator.
Gate: schema/ref-resolves

### R-SCH-05 Absolute URLs
MUST. `url`, `image`, `logo`, `sameAs`, `contentUrl`, `thumbnailUrl`, `embedUrl` and `item` values are absolute `https` URLs on `site.url`.
Why: Relative URLs are ambiguous to consumers that read JSON-LD without the page.
Gate: schema/absolute-url

### R-SCH-06 Visible content only
MUST. Every value in the graph is visible on the page (name, dates, prices, authors, questions and answers); nothing is added for the markup's sake.
Why: Google's structured-data policy; invisible data earns a manual action.
Gate: manual: checklists/new-page.md

### R-SCH-07 Contracts per page type
MUST. The required types per page type are those in `engine/schema-contracts.json`, which mirrors bylaw 09's inventory. Highlights: `BlogPosting` with `headline`, `datePublished`, `dateModified`, `author` → `Person`, `image`, `publisher` → organization; `JobPosting` with `title`, `description`, `datePosted`, `validThrough`, `hiringOrganization`, `jobLocation` (or `jobLocationType: TELECOMMUTE`), `employmentType`; `Event` with `name`, `startDate`, `endDate`, `eventAttendanceMode`, `eventStatus`, `location` or `VirtualLocation`, `organizer`; `Service` with `name`, `provider` → organization, `areaServed`, `serviceType`; `Product` with `name`, `image`, `description`, `brand`, and `Offer` only when a price is shown; `Person` with `name`, `jobTitle`, `worksFor`, `image`; `Place` for offices with `address` as `PostalAddress` and `geo` when a map facade exists.
Why: These are the fields Google documents as required or recommended for each feature.
Gate: schema/contract

### R-SCH-08 No fabricated signals
MUST. No `AggregateRating`, `Review`, `award`, or `sameAs` to real profiles unless the brief supplies real data; `FAQPage` is allowed on the FAQ page for validity but no rich result is expected; `HowTo` is not used.
Why: Self-serving ratings are ignored or penalised; FAQ and HowTo rich results no longer exist.
Gate: manual: checklists/new-page.md

### R-SCH-09 LocalBusiness only when local
MUST. An office is a `Place`; it becomes `LocalBusiness` only when the brief says customers visit it (showroom, clinic, branch). The organization is never typed `LocalBusiness`.
Why: `LocalBusiness` implies walk-in service and local-pack eligibility.
Gate: manual: checklists/new-page.md

### R-SCH-10 Dates and languages
MUST. Dates are ISO 8601 (`2026-10-17` or `2026-10-17T09:00:00+01:00`); `inLanguage` is the page's BCP 47 tag.
Why: Consumers parse these literally.
Gate: schema/contract

### R-SCH-11 Escaping
MUST. The JSON is emitted with `<` escaped as `<` (and `>` and `&` likewise) so no content can close the script element.
Why: A `</script>` inside a quote would end the block and break the page.
Gate: schema/parse

### R-SCH-12 Breadcrumbs
MUST. `BreadcrumbList` items are `ListItem` with `position`, `name` and `item` (absolute URL), ending at the current page; the visible breadcrumb shows the same names.
Why: Breadcrumb rich results require exact positions and URLs.
Gate: schema/contract

### R-SCH-13 Validation
MUST. The schema gate passes on every page, and before delivery one page per type is checked in Google's Rich Results Test and the Schema Markup Validator; results are noted in `reports/latest.md`.
Why: The gate checks structure; Google's tools check eligibility.
Gate: manual: checklists/pre-delivery.md

### R-SCH-14 Social and schema agree
MUST. `name`, `description`, `image` and `inLanguage` in the graph equal the title, meta description, OG image and `lang` of the page.
Why: Disagreeing metadata makes search choose one and distrust the rest.
Gate: manual: checklists/new-page.md

## Checklist

- [ ] R-SCH-01 one block, one graph
- [ ] R-SCH-02 organization and website nodes with stable ids
- [ ] R-SCH-03 page node per contract
- [ ] R-SCH-04 references resolve
- [ ] R-SCH-05 absolute URLs
- [ ] R-SCH-06 visible content only
- [ ] R-SCH-07 required fields per type
- [ ] R-SCH-08 no fabricated ratings/reviews/awards
- [ ] R-SCH-09 Place vs LocalBusiness
- [ ] R-SCH-10 ISO dates, BCP 47 language
- [ ] R-SCH-11 escaped output
- [ ] R-SCH-12 breadcrumb list matches visible breadcrumb
- [ ] R-SCH-13 gate green; Rich Results Test per type
- [ ] R-SCH-14 metadata agrees
