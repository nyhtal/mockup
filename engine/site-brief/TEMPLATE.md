# Site Brief

One page. Fill every field or leave it blank to take the default. Each field names the file and key it lands in; the engine reads nothing else. The reference site's filled-in brief is `sites/reference/brief.md`.

## 1. Company

| Field | Value | Destination | Default |
|---|---|---|---|
| Company name | | `site.json` `name` | required |
| Tagline (per locale) | | `i18n/<locale>.json` `site.tagline` (fallback `site.json` `tagline`) | required |
| What it does, in two sentences | | the home hero `lede` in `data/<locale>/pages.json` `sections.hero-home` | required |
| Industry | | drives the vocabulary in `glossary.json` and the industries entities | required |
| Public URL | | `site.json` `url` | `https://example.com` |
| Copyright year | | `site.json` `year` | build year |
| Contact email and phone | | `site.json` `contact` (`email`, `phone`); also the organisation's `contactPoint` in every page's schema | required |

## 2. Voice and conversion

| Field | Value | Destination | Default |
|---|---|---|---|
| Voice preset | plain / confident / warm | `site.json` `voice` (R-CONT-01) | `plain` |
| Primary conversion | demo / contact / download / apply / subscribe | `site.json` `cta` (`key`, `href`) and every page's `conversion` (R-PAGE-03) | `demo` |
| Site search | yes / no | `site.json` `hasSearch` (adds the search page, the header link and the `SearchAction`) | `yes` |

## 3. Locales

| Field | Value | Destination | Default |
|---|---|---|---|
| Default locale | | `site.json` `defaultLocale` | `en` |
| Other locales | | `site.json` `locales` (strings in `engine/i18n/<locale>.json` and `sites/<name>/i18n/<locale>.json`, content in `data/<locale>/` and `content/<locale>/`) | none |
| Right-to-left locales | | `site.json` `rtl` | `["ar"]` when `ar` is listed |
| Native digits | locale → numbering system | `site.json` `numberingSystem` (R-I18N-07) | Latin digits everywhere |
| Locale-specific legal pages | | `content/<locale>/legal/imprint.md` for `de`/`at` (R-I18N-13) | imprint for `de` |

## 4. Brand (R-TOK-14: these six keys and nothing else)

| Field | Value | Destination | Default |
|---|---|---|---|
| Brand hue (0–360) | | `site.json` `brand.hue` | `250` |
| Accent hue | | `brand.accentHue` | `160` |
| Radius | sharp / soft / round | `brand.radius` | `soft` |
| Density | compact / comfortable | `brand.density` | `comfortable` |
| Motion | calm / standard / expressive | `brand.motion` | `standard` |
| Font | inter / figtree / ibm-plex-sans / source-sans-3 / noto-sans / system | `brand.font` (R-TYPO-01; a script font is added per locale automatically) | `inter` |

## 5. Pages (R-PAGE-01)

Core pages are built in every locale without being asked. List optional pages by name; module pages (investors, maintenance, coming soon) come with their module.

| Field | Value | Destination | Default |
|---|---|---|---|
| Optional pages wanted | e.g. products, industries, pricing, partners, resources, downloads, events, glossary, help, media-kit, culture, sustainability, trust, demo, newsletter, landing | one `content/<locale>/<path>.md` per page, detail recipes in `pages.json` `detail` | every optional page (reference site) or none |
| Navigation groups | up to 4 top-level items, each with up to 4 children | `site.json` `nav` (labels as `nav.*` keys in the string overlay) | the reference site's four groups |
| Footer columns | up to 4 columns of up to 8 links, legal links up to 6 | `site.json` `footer` | the reference site's columns |
| Landing pages | slug and purpose each | `content/<locale>/lp/<slug>.md` | none |

## 6. Entities (counts per kind; same slugs in every locale)

| Kind | Count and notes | Destination |
|---|---|---|
| Services | | `data/<locale>/entities.json` `services` (title, lede, description, icon, features, steps, stats, faq, cases) |
| Products | | `products` (image, features, capabilities, tiers with `amount` and `currency`, faq, integrations) |
| Industries | | `industries` (features, stats, faq; cases are matched by `industry`) |
| People | names, roles, who writes posts | `people` (`posts: true` gets an author page) |
| Offices | city, street, postal code, country, phone, email, hours | `offices` |
| Jobs | title, team, city and country or remote with applicant countries, posted and valid-through dates | `jobs` |
| Events | title, format, date, time, time zone, online or place | `events` |
| Downloads | title, file type, pages, gated or not | `downloads` |
| Blog posts | title, author, tags, date, about 300 words | `posts` (markdown `body`) |
| Press releases | | `press` (the communications lead as author) |
| Case studies | customer, metric, quote, industry, services | `cases` |
| Help articles | | `docs` |
| Customers (logo cloud), testimonials, integrations, values, benefits, awards, badges, timeline, stats, FAQ groups, glossary terms, help categories | | the matching lists in `entities.json` |

## 7. Forms

| Field | Value | Destination | Default |
|---|---|---|---|
| Forms wanted | contact, demo, newsletter, preferences, unsubscribe, gated download, event registration, job application | `pages.json` `sections.<form>` with `action: "/<locale>/<path>/thank-you/"`; copy for each thank-you page in `pages.json` `thankYou` (R-PAGE-10) | all of them |

## 8. Legal and external

| Field | Value | Destination | Default |
|---|---|---|---|
| Legal entity, address, register, VAT id | | `content/<locale>/legal/*.md` bodies, imprint for `de` | the reference site's fictional entity |
| Privacy contact, accessibility contact, security contact | | privacy and accessibility statements; `pages.json` `sections.security-contact` | `privacy@`, `accessibility@`, `security@` on the site domain |
| Allowed external links | origins the site may link to | `site.json` `allowedExternal` (R-HTML-16) | none |
| Third-party platforms named as compatibility facts | | entities (integrations, FAQs); listed in `DECISIONS.md` (R-CONT-11) | none |

## 9. Statement

Every site's `DECISIONS.md` carries: "All names, figures and quotes on this site are fictional." together with any override of a bylaw (rule ID, replacement, reason, date; R-PREC-02).
