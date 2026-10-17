# 01 HTML

Purpose: the document skeleton and element choices that make every page valid under the Nu checker with zero warnings, readable by assistive technology, and uniform across sites. Sources: WHATWG HTML Living Standard, Nu checker messages (https://validator.github.io/validator/), WCAG 2.2.

### R-HTML-01 Document skeleton
MUST. Every page starts `<!DOCTYPE html>` and `<html lang="<bcp47>" dir="ltr|rtl" class="scheme-light-dark">`. The `lang` matches the page's locale folder; `dir` is `rtl` only for RTL locales.
Why: Language and direction drive hyphenation, screen-reader voice and layout mirroring.
Gate: i18n/lang-attr

### R-HTML-02 Head order
MUST. `<head>` children appear in this order and nothing else: charset, viewport, title, description, canonical, hreflang alternates (including `x-default`), feed link (where a feed exists), robots (only when `noindex`), theme-color (light and dark via `media`), icon links, font preload, stylesheet, Open Graph and Twitter meta, the JSON-LD script. The module script is the last child of `body`, not in `head`.
Why: A fixed order makes diffs readable, puts render-critical tags first and keeps the single JSON-LD block findable.
Gate: consistency/head-order

### R-HTML-03 Title and description
MUST. `<title>` follows `{Page title} · {Site name}` (home: `{Site name} · {Tagline}`) and is at most 60 characters. `<meta name="description">` is 120–155 characters of plain text.
Why: Both are shown in search results and truncated beyond these lengths.
Gate: consistency/meta-length

### R-HTML-04 Exactly one h1
MUST. Each page has exactly one `h1`, which is the page's name, and heading levels never skip downward (h2 → h4 is a violation).
Why: Headings are the document outline for screen-reader users and crawlers.
Gate: consistency/single-h1

### R-HTML-05 Landmarks
MUST. A page has one `header`, one `main` with `id="main"`, one `footer`, and each `nav` carries a distinct `aria-label`. The skip link (`<a href="#main">`) is the first focusable element in `body`.
Why: Landmarks are how keyboard and screen-reader users move around a page.
Gate: a11y/landmark-one-main

### R-HTML-06 Sections start with a heading
MUST. Every `section` and `article` begins with a heading element, except a `section` that carries `aria-label` as its name (R-SEC-02), which the Nu checker accepts without a heading. Grouping that needs neither uses `div`.
Why: The Nu checker warns on headingless sections, and a sectioning element without a heading is meaningless in the outline.
Gate: html/info

### R-HTML-07 No redundant roles or types
MUST. Native elements carry no `role` that repeats their implicit role (`<nav role="navigation">`, `<button role="button">`). `<script>` has no `type` except `module` or `application/ld+json`; `<style>` and `<link rel="stylesheet">` have no `type`.
Why: The Nu checker reports these as warnings and they add bytes for nothing.
Gate: html/info

### R-HTML-08 Allowed ARIA
MUST. ARIA attributes are limited to: `aria-label` on `nav`, `section` without visible heading text and icon-only buttons; `aria-current="page"` on the active nav link; `aria-describedby` linking an input to its help or error text; `aria-hidden="true"` on decorative SVG; `aria-live="polite"` on toast and status regions; `aria-expanded` only where the Popover API cannot express the state. Anything else needs a DECISIONS entry.
Why: Native semantics first; every ARIA attribute is a promise that must be kept with behaviour.
Gate: manual: checklists/new-component.md

### R-HTML-09 Buttons act, links go
MUST. `<button type="button|submit">` for actions and `<a href>` for navigation. `href="#"` and `javascript:` are never used. A control that opens a popover is a `button` with `popovertarget`; one that opens a dialog is a `button` with `command="show-modal"`.
Why: Each element brings the right keyboard behaviour for free.
Gate: consistency/no-hash-links

### R-HTML-10 Component roots
MUST. The root element of every catalog component and section carries `data-component="<catalog-file-name>"`. No other element carries `data-component`.
Why: Lets the gate verify pages use only catalog markup and lets tooling find components.
Gate: consistency/component-known

### R-HTML-11 Ids
MUST. `id` values are unique per page, lower-case, hyphenated, and exist only when something references them (skip link target, `popovertarget`, `commandfor`, `aria-describedby`, `for`, table of contents).
Why: Duplicate ids break fragment links and ARIA references silently.
Gate: consistency/dup-id

### R-HTML-12 Images
MUST. Every `img` has `alt` (empty for decorative images), `width`, `height`, and `loading="lazy"` unless it is the page's LCP image, which has `fetchpriority="high"` and no lazy attribute. Raster images sit in `<picture>` with AVIF and WebP sources.
Why: Missing dimensions cause layout shift; lazy-loading the hero costs LCP.
Gate: consistency/img-attrs

### R-HTML-13 Inline SVG icons
MUST. Icons are `<svg aria-hidden="true" class="size-5 ..."><use href="#i-<name>"></use></svg>` from the sprite, next to visible text or, in icon-only controls, an `sr-only` label.
Why: One sprite, cacheable, no font, and never an unnamed control.
Gate: manual: checklists/new-component.md

### R-HTML-14 Dates and addresses
MUST. Dates are `<time datetime="YYYY-MM-DD">` with locale-formatted text. Postal contact details are in `<address>`; `address` is never used for author bylines.
Why: Machine-readable dates and correct semantics without ARIA.
Gate: manual: checklists/new-page.md

### R-HTML-15 No inline styles, no spacer markup
MUST. No `style` attribute, no `<br>` for spacing, no empty elements used as spacers, no `&nbsp;` runs.
Why: Styling lives in utilities; spacer markup is invisible to the consistency gate.
Gate: consistency/inline-style

### R-HTML-16 External links
MUST. Mockups contain no external links except those listed in `site.json` `allowedExternal`. Any allowed external link that opens a new tab carries `rel="noopener"` and a visible "opens in new tab" hint via an icon with `sr-only` text.
Why: External requests cost Lighthouse points and surprise users.
Gate: links/external

### R-HTML-17 Tab order follows source order
MUST. No `tabindex` greater than 0. `tabindex="-1"` only on the form error summary (R-FORM-06) and honeypot inputs; `main` needs none because it is a landmark target.
Why: Visual order equals DOM order equals focus order.
Gate: a11y/tabindex

### R-HTML-18 Tables
MUST. Data tables have a `caption`, `th` cells with `scope`, and no layout tables. Comparison tables mark the recommended column with visible text, not colour alone.
Why: Screen readers announce headers per cell only when scoped.
Gate: a11y/th-has-data-cells

### R-HTML-19 Valid, warning-free output
MUST. Every built page passes the Nu checker with zero errors and zero warnings.
Why: Validity is the contract the rest of the bylaws assume.
Gate: html/error

## Checklist

- [ ] R-HTML-01 lang/dir/scheme on html
- [ ] R-HTML-02 head order exact
- [ ] R-HTML-03 title ≤ 60, description 120–155
- [ ] R-HTML-04 one h1, no skipped levels
- [ ] R-HTML-05 header/main/footer, labelled navs, skip link first
- [ ] R-HTML-06 every section/article starts with a heading
- [ ] R-HTML-07 no redundant role/type
- [ ] R-HTML-08 ARIA only from the allowed list
- [ ] R-HTML-09 button vs link, no href="#"
- [ ] R-HTML-10 data-component on catalog roots only
- [ ] R-HTML-11 ids unique and referenced
- [ ] R-HTML-12 img alt/width/height/loading rules
- [ ] R-HTML-13 sprite icons aria-hidden with text
- [ ] R-HTML-14 time/address semantics
- [ ] R-HTML-15 no inline style or spacer markup
- [ ] R-HTML-16 no external links unless allow-listed
- [ ] R-HTML-17 no positive tabindex
- [ ] R-HTML-18 tables captioned and scoped
- [ ] R-HTML-19 Nu zero errors, zero warnings
