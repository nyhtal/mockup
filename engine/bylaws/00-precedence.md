# 00 Precedence, overrides and the shape of a rule

Purpose: say how rules relate to each other, how a site may deviate, and what every rule in this folder must look like so that `engine/tools/gates/bylaws.js` can lint them.

### R-PREC-01 Precedence order
MUST. When two rules or a rule and a brief conflict, the higher tier wins: (1) legal and accessibility, (2) performance, (3) validation, (4) consistency bylaws, (5) site brief look-and-feel.
Why: Arguments about taste must never cost a user access, speed or a valid page.
Gate: manual: checklists/pre-delivery.md

### R-PREC-02 Overrides are written down
MUST. A site may override a bylaw only by an entry in `sites/<name>/DECISIONS.md` giving the rule ID, the replacement rule, the reason and the date. An override of a tier-1 rule is not allowed.
Why: Undocumented deviations are how consistency dies across sites.
Gate: manual: checklists/new-site.md

### R-PREC-03 Rule format
MUST. Every rule is a `### R-AREA-NN Title` heading, followed by one line beginning `MUST.` or `SHOULD.`, a `Why:` line and a `Gate:` line naming `<gate>/<check>` or `manual: checklists/<file>.md`. Numbers are contiguous per area within a file and IDs are unique across files.
Why: Rules that cannot be cited or checked are opinions.
Gate: bylaws/format

### R-PREC-04 Every rule has a gate
MUST. A rule's `Gate:` names a check that exists in `engine/tools/gates/` or a manual item in a checklist. A rule nobody can verify is deleted, not kept.
Why: The engine's promise is that a green gate means the rules were followed.
Gate: bylaws/gate-ref

### R-PREC-05 Bylaw versioning
MUST. The bylaw set carries a semver version in `engine/CHANGELOG.md`. A change that makes a previously green site fail a gate is a major version; a new rule with a new gate is minor; wording is patch. The reference site is rebuilt and gated on every bump.
Why: Sites built against older bylaws must know what changed.
Gate: manual: checklists/pre-delivery.md

### R-PREC-06 Catalog verbatim
MUST. Pages are composed from catalog sections and components without editing their markup or classes. A new need is met by adding a variant to the catalog, never by improvising on a page.
Why: Consistency is a property of the catalog, not of individual pages.
Gate: manual: checklists/new-page.md

### R-PREC-07 The CSS exception list
MUST. `engine/theme/app.css` contains only: `@import "tailwindcss"`, `@source` lines, one `@theme` block (with its `@keyframes`), `@custom-variant` lines, named `@utility` blocks for the R-COL-09 backgrounds (`bg-hero-backdrop`: layered gradients and a mask that no utility can express) for the item distance of R-TOK-12 (`reveal-items`: sets `--reveal-distance` to the item value on a grid, with its `md` media query) for the disclosure motion of R-MOT-06 (`disclosure`, `disclosure-tabs`: the `::details-content` height and opacity transition, about 500 bytes per `<details>` if written as utilities) and for the lightbox (`lightbox`, `lightbox-control`: the dialog motion of R-MOT-06 and the round controls, about 1.8 KB per picture if written as utilities), `@font-face` blocks for the site's fonts, and the `@view-transition` block wrapped in `@media (prefers-reduced-motion: no-preference)`. No `@apply`, no `@layer components`, no selectors, no inline `style`.
Why: The whole look must be expressible in utilities so pages stay portable and the purge stays small.
Gate: manual: checklists/pre-delivery.md

### R-PREC-08 The JS allowance
MUST. The only runtime script is `engine/scripts/enhance.js`, an ES module of at most 4096 bytes minified with no dependencies, loaded once with `type="module"`. Every behaviour in it is feature-detected and every page works with the script absent. It never fetches and never sets a cookie; it stores two preferences the visitor sets: the sound choice in `sessionStorage` for the tab (D44) and the theme choice in `localStorage` under the key `theme` (D54). Besides it, one inline script of at most 200 bytes in the head reads that theme choice before first paint; the CSP allows exactly that text by its `sha256` hash (`engine/tools/lib/theme-script.js`).
Why: Interaction comes from HTML; the script only smooths what CSS cannot.
Gate: budget/js

### R-PREC-09 Research before rules
SHOULD. A rule that depends on a browser feature, a Lighthouse audit, a validator message or a Google policy cites its source URL in the file and is re-checked when the bylaws' major version changes.
Why: Standards move; stale rules cost scores.
Gate: manual: checklists/pre-delivery.md

## Checklist

- [ ] R-PREC-01 precedence applied to any conflict met during the build
- [ ] R-PREC-02 every override recorded in the site's DECISIONS.md
- [ ] R-PREC-03/04 `npm run gate -- --only bylaws` is green
- [ ] R-PREC-05 CHANGELOG bumped when bylaws changed
- [ ] R-PREC-06 no page carries markup that is not in the catalog
- [ ] R-PREC-07 app.css diff reviewed against the exception list
- [ ] R-PREC-08 enhance.js ≤ 4096 B, no fetch or cookie, localStorage only for the theme, page usable without it
- [ ] R-PREC-09 sources present for feature-dependent rules
