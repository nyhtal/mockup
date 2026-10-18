# New page checklist

Use this for every page added to a site, whether a singular page (one front-matter file per locale) or a new entity detail page (one recipe in `pages.json` per locale and one entity per locale).

## Procedure

1. **Find the page type's row** in `engine/bylaws/09-pages.md`: URL, title pattern, required and optional sections in order, schema contract. If the type is not in the inventory, it is a bylaw change (R-PREC-03), not a page.
2. **Singular page**: add `content/<locale>/<path>.md` in every locale with `layout`, `pageType`, `conversion`, `title`, `eyebrow`, `lede`, `description` and `sections` (site section ids from `pages.json`, catalog sample ids, or inline objects). Non-home pages get their page-header from the title automatically.
3. **Entity page**: add the entity to `data/<locale>/entities.json` in every locale with the same slug, and if the kind is new, a `detail` recipe in `pages.json` (`each`, `layout`, `sections` with `{e.field}` placeholders, `from: "e.<list>"`). The engine generates the URL from the kind's index path.
4. **Forms**: a page with a form names its thank-you page in `pages.json` `thankYou` keyed by the form page's path, and the form's `action` points at it.
5. **Copy**: title ≤ 60 characters, description 120–155 characters, lede ≤ 35 words, no forbidden words, sentence case, verb-first button labels, in every locale.
6. **Build and gate** with `--skip lighthouse`; the consistency gate reports title and description lengths, the schema gate the contract, the links gate every href.
7. **Open the page at 320 px and 1024 px** in every locale: no horizontal scrolling, no wrapped CTA, no truncated label.

## Learned on the reference site

- Breadcrumbs skip URL segments that have no page of their own (`/blog/tag/`), so an index page is optional but a crumb never points at a 404.
- A description that starts with a single word and a colon ("Northwind-Preise: …") parses as a URL with a scheme and fails the links gate; reword it.
- The budget counts every font whose `unicode-range` matches text on the page: one Arabic word in a Latin page pulls the Arabic face unless it is set in `font-system`.
