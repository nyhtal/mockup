# 12 SEO and metadata

Purpose: everything in `<head>` and the discovery files, so search engines and social cards get the same correct answer on every page. Sources: https://developers.google.com/search/docs/crawling-indexing (canonical, robots, sitemap), https://ogp.me, https://developer.x.com/en/docs/x-for-websites/cards, https://www.rfc-editor.org/rfc/rfc9116 (security.txt), https://www.sitemaps.org/protocol.html.

### R-SEO-01 Head order and completeness
MUST. The head follows R-HTML-02 exactly and every item in it is present on every page (robots only where noindex applies).
Why: A missing canonical or description is the most common SEO defect.
Gate: lighthouse/mobile/seo

### R-SEO-02 Canonical
MUST. `<link rel="canonical">` is the page's own absolute URL on `site.url`, trailing slash included; paginated pages are self-canonical.
Why: Duplicate URLs (with and without slash, http and https) must resolve to one.
Gate: manual: checklists/new-page.md

### R-SEO-03 Robots
MUST. `<meta name="robots" content="noindex">` appears only on the pages in R-PAGE-12; indexable pages carry no robots meta. `robots.txt` allows everything and names the sitemap.
Why: Default is indexable; exceptions are explicit.
Gate: manual: checklists/pre-delivery.md

### R-SEO-04 Open Graph
MUST. Every page has `og:type` (`website` for home, `article` for posts and news, `website` otherwise), `og:title` (page title without site suffix), `og:description` (the meta description), `og:url` (canonical), `og:site_name`, `og:locale` (`en_GB`-style from the locale), `og:locale:alternate` per other locale, and `og:image` with `og:image:width` 1200, `og:image:height` 630 and `og:image:alt`.
Why: Shares on every platform read Open Graph first.
Gate: manual: checklists/pre-delivery.md

### R-SEO-05 Twitter card
MUST. `twitter:card` is `summary_large_image`; `twitter:title`, `twitter:description` and `twitter:image` repeat the OG values.
Why: X does not fall back to OG for the card type.
Gate: manual: checklists/pre-delivery.md

### R-SEO-06 Social image
MUST. Each page's social image is generated at build time (bylaw 17): 1200×630, brand gradient, page title and site name in a system sans-serif (the renderer cannot load the site's web font), no photos; the home page uses the site's tagline as its title.
Why: Every shared link gets a legible, branded preview without design work.
Gate: manual: checklists/pre-delivery.md

### R-SEO-07 Sitemap
MUST. `sitemap.xml` at the root lists every indexable page in every locale with `lastmod` (ISO date) and hreflang alternates (R-I18N-15); pages in R-PAGE-12 are excluded.
Why: The sitemap is the crawl contract.
Gate: manual: checklists/pre-delivery.md

### R-SEO-08 Feed
MUST. Sites with a blog or news section publish `feed.xml` (Atom) per locale at `/<locale>/feed.xml`, linked from the head of index and post pages with `<link rel="alternate" type="application/atom+xml">`.
Why: Feeds are still how press and partners follow a company.
Gate: manual: checklists/pre-delivery.md

### R-SEO-09 Headings carry the keywords
SHOULD. The `h1` contains the page's main noun; the first paragraph repeats it naturally; `h2`s name the sections in plain words rather than slogans.
Why: Headings are the strongest on-page relevance signal and the outline for readers.
Gate: manual: checklists/new-page.md

### R-SEO-10 Internal linking
MUST. Every page is reachable within three clicks from the home page; every detail page links to its index and to three related items; the footer links to every core page group.
Why: Crawl depth and orphan pages decide what gets indexed.
Gate: manual: checklists/pre-delivery.md

### R-SEO-11 Breadcrumbs
MUST. Every non-home page shows breadcrumbs that mirror the URL path and emits a matching `BreadcrumbList` (bylaw 13).
Why: Orientation for users and a rich-result eligible structure for search.
Gate: schema/contract

### R-SEO-12 security.txt and humans
MUST. `/.well-known/security.txt` exists with `Contact`, `Expires` (one year ahead) and `Preferred-Languages` lines; `humans.txt` is not shipped.
Why: RFC 9116; responsible-disclosure contact is expected of corporate sites.
Gate: manual: checklists/pre-delivery.md

### R-SEO-13 No external requests
MUST. The head references only same-origin assets; no external fonts, scripts, images or prefetches.
Why: Every external request costs performance and privacy and is outside the mockup's control.
Gate: links/external

### R-SEO-14 Language and region signals agree
MUST. `html lang`, `og:locale`, `inLanguage` in JSON-LD, the locale folder and the hreflang entry for the page all name the same locale.
Why: Conflicting signals make search pick the wrong version.
Gate: manual: checklists/new-page.md

## Checklist

- [ ] R-SEO-01 head complete in order
- [ ] R-SEO-02 self canonical absolute
- [ ] R-SEO-03 robots only on noindex set; robots.txt present
- [ ] R-SEO-04 OG set complete
- [ ] R-SEO-05 Twitter card
- [ ] R-SEO-06 social image generated per page
- [ ] R-SEO-07 sitemap with alternates
- [ ] R-SEO-08 Atom feed where articles exist
- [ ] R-SEO-09 headings carry the subject
- [ ] R-SEO-10 three-click reachability
- [ ] R-SEO-11 breadcrumbs and BreadcrumbList
- [ ] R-SEO-12 security.txt
- [ ] R-SEO-13 no external requests
- [ ] R-SEO-14 locale signals agree
