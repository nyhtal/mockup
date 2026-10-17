# 18 Security and deployment

Purpose: what a static host needs from the build so the mockup deploys safely anywhere: headers, error pages, redirects, discovery files and the consent story. Sources: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP, https://owasp.org/www-project-secure-headers/, https://www.rfc-editor.org/rfc/rfc9116, https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag.

### R-DEPLOY-01 Headers file
MUST. The build emits `_headers` (Netlify/Cloudflare syntax) and `headers.json` (generic) with: `Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, and the asset cache rule from R-PERF-11.
Why: A strict CSP is only possible because the site has no inline scripts and no third parties; shipping it proves that.
Gate: manual: checklists/pre-delivery.md

### R-DEPLOY-02 JSON-LD under CSP
MUST. The JSON-LD block needs no CSP exception because browsers do not execute `application/ld+json`; the policy above has no `'unsafe-inline'`.
Why: Correctness of the CSP claim.
Gate: schema/single-block

### R-DEPLOY-03 Facades and CSP
MUST. When a facade loads a third-party iframe after a click, the site's `DECISIONS.md` lists the provider origin to add to `frame-src`; the shipped CSP stays `frame-src 'none'` until then.
Why: The exception must be deliberate and documented.
Gate: manual: checklists/pre-delivery.md

### R-DEPLOY-04 Error pages
MUST. `/404.html` and `/500.html` exist at the output root (R-PAGE-07), and the deployment maps 404 and 5xx to them; the static server used by the gate does the same for 404.
Why: Hosts look for root error pages by name.
Gate: links/broken

### R-DEPLOY-05 Redirects
MUST. `_redirects` (and `redirects.json`) map `/` → `/<default-locale>/` (301 where the host supports it; the root HTML page from R-PAGE-08 covers hosts that do not), non-slash URLs to slash URLs, and nothing else.
Why: Clean URLs without redirect chains.
Gate: manual: checklists/pre-delivery.md

### R-DEPLOY-06 Discovery files
MUST. The root contains `robots.txt` (allow all, sitemap line), `sitemap.xml`, `.well-known/security.txt`, and the favicon set; nothing else at the root except the redirect page and error pages.
Why: Crawlers and researchers look in fixed places.
Gate: manual: checklists/pre-delivery.md

### R-DEPLOY-07 Staging is not indexed
MUST. Staging deployments send `X-Robots-Tag: noindex` from the host configuration; the build never bakes `noindex` into indexable pages.
Why: A staging mockup must not outrank the real site.
Gate: manual: checklists/pre-delivery.md

### R-DEPLOY-08 No secrets, no PII
MUST. The repository and the build contain no credentials, API keys, real email addresses or real phone numbers; contact details are fictional and use reserved ranges (`example.com`, `+44 20 7946 0000`-style numbers).
Why: Mockups get shared widely.
Gate: manual: checklists/new-site.md

### R-DEPLOY-09 Cookies and consent
MUST. The mockup sets no cookies and uses no storage, so no consent banner is shown; the `consent-banner` and `consent-preferences` components exist in the catalog with the rule: "enable when the first non-essential cookie or tracker is added, and gate that script behind consent". Video and map facades count as consent-requiring on click and say so.
Why: Honest with Lighthouse and the law; the pattern is ready when needed.
Gate: manual: checklists/pre-delivery.md

### R-DEPLOY-10 Output is the deliverable
MUST. `dist/<site>/` is a complete, self-contained folder: copying it to any static host with the headers and redirects applied is the whole deployment. The build is reproducible from a clean checkout with `npm ci && npm run setup && npm run build -- --site <name>`.
Why: The mockup must work outside this repository.
Gate: manual: checklists/pre-delivery.md

## Checklist

- [ ] R-DEPLOY-01 headers file emitted
- [ ] R-DEPLOY-02 CSP without unsafe-inline
- [ ] R-DEPLOY-03 facade origins documented
- [ ] R-DEPLOY-04 root error pages
- [ ] R-DEPLOY-05 redirects
- [ ] R-DEPLOY-06 discovery files
- [ ] R-DEPLOY-07 staging noindex via header
- [ ] R-DEPLOY-08 no secrets or PII
- [ ] R-DEPLOY-09 no cookies; consent components ready
- [ ] R-DEPLOY-10 clean-checkout build reproduces dist
