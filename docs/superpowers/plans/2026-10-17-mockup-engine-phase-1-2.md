# Mockup Engine Phase 1–2 Implementation Plan (scaffold, gates, bylaws)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the build and quality-gate toolchain, then draft bylaws 00–19 so that every rule has an ID, a MUST/SHOULD statement, a why, and the gate that checks it.

**Architecture:** Eleventy 3 assembles `sites/<name>/` content through `engine/catalog/` templates into `dist/<name>/`; Tailwind CLI compiles `engine/theme/app.css` against the built HTML. Gates are small ESM scripts in `engine/tools/`, each exporting `run(ctx)` returning findings, with `node --test` fixture tests. Bylaws are markdown with a fixed rule format enforced by `gate-bylaws.js`.

**Tech Stack:** Node 24, @11ty/eleventy 3.1.7, tailwindcss + @tailwindcss/cli 4.3.3, lighthouse 13.5.0 + chrome-launcher, pa11y (axe runner), linkinator 8, node-html-parser, sharp 0.35, lucide-static, @fontsource-variable/inter and noto-sans-arabic, Nu checker standalone Windows build.

**Spec:** `docs/superpowers/specs/2026-10-17-mockup-engine-design.md` (and the brief `docs/MASTER-PROMPT.md`)

## Global Constraints

- Shipped CSS: only Tailwind utilities; `engine/theme/app.css` may contain `@import "tailwindcss"`, `@source`, `@theme` (+ `@keyframes` inside), `@custom-variant`, `@font-face`, and the 5-line `@view-transition` block. No `@apply`, `@layer components`, selectors, or inline `style=""`.
- Shipped JS: one file `engine/scripts/enhance.js`, ≤ 2 KB minified, no dependencies.
- No external requests from any built page (fonts, images, scripts all local).
- Budgets per page: HTML ≤ 50 KB, CSS ≤ 30 KB, JS ≤ 2 KB, total ≤ 300 KB.
- Rule ID format: `R-<AREA>-<NN>` where AREA ∈ {PREC, HTML, TOK, LAY, TYPO, COL, MOT, COMP, SEC, PAGE, CONT, I18N, SEO, SCH, A11Y, PERF, FORM, ASSET, DEPLOY, GATE}.
- Every bylaw rule: heading `### R-AREA-NN Title`, first line `MUST.` or `SHOULD.` followed by the rule, then `Why:` line, then `Gate:` line naming a gate check id or `manual: checklists/pre-delivery.md`.
- Windows host, PowerShell primary; all scripts must run from `npm run …` without shell-specific syntax (no `VAR=x cmd`).
- Commit at the end of every task on branch `mockup-engine`.

## Review Focus

1. A page in locale `de` whose content file is missing must fail the build with the slug named, not silently emit an English page under `/de/` (Task 1 test: strict i18n errorMode).
2. A class like `md:ps-4` or `[animation-timeline:view()]` in HTML must be recognised in the built CSS by the class gate despite CSS escaping (Task 4 test: escaped selectors).
3. A Nu "info/warning" (e.g. `<section>` without heading) must fail the HTML gate, not only errors (Task 3 test).
4. A JSON-LD graph whose `{ "@id": "#org" }` reference has no matching node must fail the schema gate (Task 5 test).
5. A page that references an asset the budget gate cannot find on disk must fail, not count as 0 bytes (Task 6 test).

---

## File structure (created by this plan)

```
package.json                         scripts + pinned deps
eleventy.config.js                   shared Eleventy config (site chosen via SITE env set by build.js)
engine/theme/app.css                 Tailwind input
engine/scripts/enhance.js            runtime script (stub in phase 1, finished in catalog phase)
engine/schema-contracts.json         required @types per page type
engine/budgets.json                  byte budgets
engine/tools/build.js                orchestrates eleventy → tailwind → copy fonts/icons
engine/tools/serve.js                static server for dist (used by gates)
engine/tools/setup-vnu.js            downloads Nu standalone into engine/tools/vnu/ (gitignored)
engine/tools/gates/html.js           Nu checker gate
engine/tools/gates/consistency.js    class/inline-style/h1/heading/id/data-component checks
engine/tools/gates/schema.js         JSON-LD gate
engine/tools/gates/budget.js         size gate
engine/tools/gates/i18n.js           locale key completeness + hreflang reciprocity
engine/tools/gates/lighthouse.js     Lighthouse 13 runner (median of 5)
engine/tools/gates/a11y.js           pa11y + axe
engine/tools/gates/links.js          linkinator
engine/tools/gates/bylaws.js         bylaw format lint
engine/tools/gate.js                 runs all gates, writes reports/latest.md
engine/tools/lib/html.js             shared: list html files, parse, read json-ld
engine/tools/test/*.test.js          node --test files
engine/tools/test/fixtures/*.html    fixture pages
engine/catalog/templates/base.njk    document shell (phase 1 minimal)
sites/reference/site.json            locales, brand, pages
sites/reference/content/en/index.md  one page to prove the pipeline
engine/bylaws/00-precedence.md … 19-quality-gates.md
engine/DECISIONS.md                  expanded decision table
```

Gate interface (all gates):

```js
// engine/tools/gates/<name>.js
export const id = "html";               // gate id used in bylaws' Gate: lines
export async function run(ctx) {        // ctx = { distDir, siteDir, site, engineDir, baseUrl? }
  return { id, ok: boolean, findings: [{ file, line, message, check }] };
}
```

---

### Task 1: Scaffold build pipeline (Eleventy + Tailwind) with one page

**Files:**
- Create: `package.json`, `eleventy.config.js`, `engine/theme/app.css`, `engine/scripts/enhance.js`, `engine/tools/build.js`, `engine/catalog/templates/base.njk`, `sites/reference/site.json`, `sites/reference/content/en/index.md`, `sites/reference/content/en/en.json`, `engine/i18n/en.json`, `engine/tools/test/build.test.js`

**Interfaces:**
- Produces: `npm run build -- --site reference` → `dist/reference/en/index.html`, `dist/reference/assets/app.css`, `dist/reference/assets/enhance.js`. Eleventy global data `site` (parsed site.json), filter `t(key)` (throws on missing key), `locale_links` from the i18n plugin, page data `locale` from directory data file.

- [ ] **Step 1: Write the failing build test**

```js
// engine/tools/test/build.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

test("build produces the reference home page and css", () => {
  execFileSync("node", ["engine/tools/build.js", "--site", "reference"], { stdio: "inherit" });
  assert.ok(existsSync("dist/reference/en/index.html"));
  assert.ok(existsSync("dist/reference/assets/app.css"));
  const html = readFileSync("dist/reference/en/index.html", "utf8");
  assert.match(html, /<html lang="en" dir="ltr">/);
  assert.match(html, /<link rel="stylesheet" href="\/assets\/app.css">/);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test engine/tools/test/build.test.js`
Expected: FAIL (build.js missing).

- [ ] **Step 3: Create package.json and install**

```json
{
  "name": "mockup-engine",
  "private": true,
  "type": "module",
  "scripts": {
    "setup": "node engine/tools/setup-vnu.js",
    "build": "node engine/tools/build.js",
    "serve": "node engine/tools/serve.js",
    "gate": "node engine/tools/gate.js",
    "test": "node --test engine/tools/test/"
  }
}
```

Run: `npm i -D @11ty/eleventy@3.1.7 tailwindcss@4.3.3 @tailwindcss/cli@4.3.3 node-html-parser lighthouse@13.5.0 chrome-launcher pa11y linkinator@8.1.0 sharp@0.35.5 lucide-static@1.59.0 @fontsource-variable/inter@5.3.0 @fontsource-variable/noto-sans-arabic@5.3.0`

- [ ] **Step 4: Write eleventy.config.js**

```js
// eleventy.config.js
import { I18nPlugin } from "@11ty/eleventy";
import { readFileSync } from "node:fs";
import path from "node:path";

export default function (eleventyConfig) {
  const siteName = process.env.SITE || "reference";
  const siteDir = `sites/${siteName}`;
  const site = JSON.parse(readFileSync(path.join(siteDir, "site.json"), "utf8"));
  const strings = Object.fromEntries(
    site.locales.map((l) => [l, JSON.parse(readFileSync(`engine/i18n/${l}.json`, "utf8"))])
  );

  eleventyConfig.addPlugin(I18nPlugin, { defaultLanguage: site.defaultLocale, errorMode: "strict" });
  eleventyConfig.addGlobalData("site", site);
  eleventyConfig.addGlobalData("eleventyComputed", {
    locale: (data) => data.page.lang || site.defaultLocale,
    dir: (data) => (site.rtl || []).includes(data.page.lang) ? "rtl" : "ltr",
  });
  eleventyConfig.addFilter("t", function (key) {
    const lang = this.page?.lang || site.defaultLocale;
    const value = key.split(".").reduce((o, k) => (o == null ? o : o[k]), strings[lang]);
    if (value == null) throw new Error(`Missing i18n key "${key}" for locale "${lang}"`);
    return value;
  });
  eleventyConfig.addPassthroughCopy({ "engine/scripts/enhance.js": "assets/enhance.js" });

  return {
    dir: { input: `${siteDir}/content`, includes: "../../../engine/catalog", layouts: "../../../engine/catalog/templates", output: `dist/${siteName}` },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
```

- [ ] **Step 5: Write the site config, locale data file, i18n strings, base template, page**

```json
// sites/reference/site.json
{ "name": "Northwind Dynamics", "tagline": "Industrial automation, simplified",
  "url": "https://example.com", "defaultLocale": "en", "locales": ["en"], "rtl": ["ar"],
  "brand": { "hue": 250, "accentHue": 160, "radius": "soft", "density": "comfortable", "motion": "standard", "font": "inter" } }
```

```json
// sites/reference/content/en/en.json   (Eleventy directory data file; sets page.lang via i18n plugin convention)
{ "lang": "en" }
```

```json
// engine/i18n/en.json
{ "nav": { "skip": "Skip to content", "home": "Home" }, "footer": { "rights": "All rights reserved." } }
```

```njk
{# engine/catalog/templates/base.njk #}
<!DOCTYPE html>
<html lang="{{ locale }}" dir="{{ dir }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ title }} · {{ site.name }}</title>
<meta name="description" content="{{ description }}">
<link rel="stylesheet" href="/assets/app.css">
</head>
<body class="bg-white text-gray-900 antialiased" data-page="{{ pageType or 'generic' }}">
<a href="#main" class="sr-only focus:not-sr-only">{{ "nav.skip" | t }}</a>
<main id="main" class="mx-auto max-w-7xl px-4">
{{ content | safe }}
</main>
<script type="module" src="/assets/enhance.js"></script>
</body>
</html>
```

```md
---
layout: base.njk
title: Home
description: Northwind Dynamics builds industrial automation that teams actually enjoy using.
pageType: home
---
<h1 class="text-4xl font-bold">{{ site.name }}</h1>
<p class="mt-4 text-lg">{{ site.tagline }}</p>
```

```css
/* engine/theme/app.css */
@import "tailwindcss";
@source "../../dist/__SITE__";
@source not "../../dist/__SITE__/assets";
```

(`build.js` writes a temp copy with `__SITE__` replaced; see Step 6.)

```js
// engine/scripts/enhance.js  (phase-1 stub, finished in the catalog phase)
document.documentElement.dataset.js = "";
```

- [ ] **Step 6: Write build.js**

```js
// engine/tools/build.js
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync, cpSync, existsSync } from "node:fs";
import path from "node:path";

export function parseArgs(argv) {
  const i = argv.indexOf("--site");
  return { site: i >= 0 ? argv[i + 1] : "reference" };
}

export function build({ site }) {
  const dist = `dist/${site}`;
  rmSync(dist, { recursive: true, force: true });
  execFileSync("npx", ["@11ty/eleventy", "--config=eleventy.config.js", "--quiet"], { stdio: "inherit", env: { ...process.env, SITE: site }, shell: true });
  const css = readFileSync("engine/theme/app.css", "utf8").replaceAll("__SITE__", site);
  mkdirSync("engine/theme/.tmp", { recursive: true });
  writeFileSync("engine/theme/.tmp/app.css", css);
  mkdirSync(`${dist}/assets`, { recursive: true });
  execFileSync("npx", ["@tailwindcss/cli", "-i", "engine/theme/.tmp/app.css", "-o", `${dist}/assets/app.css`, "--minify"], { stdio: "inherit", shell: true });
  for (const f of ["fonts"]) if (existsSync(`sites/${site}/assets/${f}`)) cpSync(`sites/${site}/assets/${f}`, `${dist}/assets/${f}`, { recursive: true });
  return dist;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"))) {
  build(parseArgs(process.argv.slice(2)));
}
```

Note: the `@source` path in the temp CSS is relative to `engine/theme/.tmp/`, so use `../../../dist/__SITE__` in `app.css` (three levels). Add `engine/theme/.tmp/` to `.gitignore`.

- [ ] **Step 7: Run the test until it passes**

Run: `node --test engine/tools/test/build.test.js`
Expected: PASS. Inspect `dist/reference/en/index.html` by eye once.

- [ ] **Step 8: Add the strict-locale test (Review Focus 1)**

```js
test("missing locale content fails the build naming the slug", () => {
  // temporarily add "de" to site.locales via env override in build.js: SITE_LOCALES_OVERRIDE="en,de"
  assert.throws(() => execFileSync("node", ["engine/tools/build.js", "--site", "reference"], { env: { ...process.env, SITE_LOCALES_OVERRIDE: "en,de" }, stdio: "pipe" }));
});
```

Implement: in `eleventy.config.js`, `if (process.env.SITE_LOCALES_OVERRIDE) site.locales = process.env.SITE_LOCALES_OVERRIDE.split(",")`. With `errorMode: "strict"` and `/de/` absent the i18n plugin throws. Run the test; PASS.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json eleventy.config.js engine sites .gitignore
git commit -m "feat: scaffold Eleventy + Tailwind build with one reference page"
```

---

### Task 2: Nu checker setup script

**Files:**
- Create: `engine/tools/setup-vnu.js`, `engine/tools/test/setup-vnu.test.js`

**Interfaces:**
- Produces: `engine/tools/vnu/vnu-runtime-image/bin/vnu.bat` (Windows) or `bin/vnu` (other). Exports `vnuPath()` returning the executable path or `null`.

- [ ] **Step 1: Write the failing test**

```js
// engine/tools/test/setup-vnu.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { vnuPath } from "../setup-vnu.js";
test("vnuPath points at an executable when installed", () => {
  const p = vnuPath();
  if (!p) return assert.ok(true, "vnu not installed; run npm run setup");
  assert.match(p, /vnu(\.bat)?$/);
});
```

- [ ] **Step 2: Implement setup-vnu.js**

```js
// engine/tools/setup-vnu.js
import { existsSync, mkdirSync, createWriteStream, rmSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const DIR = "engine/tools/vnu";
const ZIP = { win32: "vnu.windows.zip", darwin: "vnu.osx.zip", linux: "vnu.linux.zip" }[process.platform];
const URL = `https://github.com/validator/validator/releases/download/latest/${ZIP}`;

export function vnuPath() {
  const bin = process.platform === "win32" ? "vnu.bat" : "vnu";
  const p = path.join(DIR, "vnu-runtime-image", "bin", bin);
  return existsSync(p) ? p : null;
}

export async function setup() {
  if (vnuPath()) return vnuPath();
  mkdirSync(DIR, { recursive: true });
  const zipPath = path.join(DIR, ZIP);
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  await pipeline(res.body, createWriteStream(zipPath));
  if (process.platform === "win32") execFileSync("tar", ["-xf", zipPath, "-C", DIR]);
  else execFileSync("unzip", ["-oq", zipPath, "-d", DIR]);
  rmSync(zipPath);
  return vnuPath();
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) setup().then((p) => console.log("vnu at", p));
```

- [ ] **Step 3: Run setup and the test**

Run: `npm run setup` then `node --test engine/tools/test/setup-vnu.test.js` and `engine/tools/vnu/vnu-runtime-image/bin/vnu.bat --version`.
Expected: version string printed; test PASS.

- [ ] **Step 4: Commit** (`engine/tools/vnu/` is gitignored)

```bash
git add engine/tools/setup-vnu.js engine/tools/test/setup-vnu.test.js
git commit -m "feat: add Nu checker setup script"
```

---

### Task 3: HTML gate (Nu)

**Files:**
- Create: `engine/tools/lib/html.js`, `engine/tools/gates/html.js`, `engine/tools/test/gate-html.test.js`, `engine/tools/test/fixtures/valid.html`, `engine/tools/test/fixtures/section-no-heading.html`

**Interfaces:**
- Produces: `lib/html.js` exports `listHtml(dir) → string[]`, `parse(file) → {root, html}` (node-html-parser), `jsonLd(root) → object[]`. `gates/html.js` exports `id = "html"`, `run(ctx)`.

- [ ] **Step 1: Fixtures**

`valid.html`: a complete minimal valid document (doctype, `lang`, `charset`, `viewport`, title, one `h1`, `main`). `section-no-heading.html`: same plus `<section><p>x</p></section>` (Nu emits an info/warning "Section lacks heading").

- [ ] **Step 2: Failing test**

```js
// engine/tools/test/gate-html.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { run } from "../gates/html.js";
import { vnuPath } from "../setup-vnu.js";

test("html gate passes a valid page and fails a warning", { skip: !vnuPath() && "vnu not installed" }, async () => {
  const ok = await run({ distDir: "engine/tools/test/fixtures", only: ["valid.html"] });
  assert.equal(ok.ok, true);
  const bad = await run({ distDir: "engine/tools/test/fixtures", only: ["section-no-heading.html"] });
  assert.equal(bad.ok, false);
  assert.match(bad.findings[0].message, /heading/i);
});
```

- [ ] **Step 3: Implement lib/html.js and gates/html.js**

```js
// engine/tools/lib/html.js
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parse as parseHtml } from "node-html-parser";
export function listHtml(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) out.push(...listHtml(p));
    else if (e.endsWith(".html")) out.push(p);
  }
  return out;
}
export function parse(file) { const html = readFileSync(file, "utf8"); return { html, root: parseHtml(html) }; }
export function jsonLd(root) {
  return root.querySelectorAll('script[type="application/ld+json"]').map((s) => JSON.parse(s.textContent));
}
```

```js
// engine/tools/gates/html.js
import { spawnSync } from "node:child_process";
import { vnuPath } from "../setup-vnu.js";
import { listHtml } from "../lib/html.js";
export const id = "html";
export async function run(ctx) {
  const vnu = vnuPath();
  if (!vnu) return { id, ok: false, findings: [{ file: "-", message: "Nu checker not installed; run npm run setup", check: "html/installed" }] };
  const files = ctx.only ? ctx.only.map((f) => `${ctx.distDir}/${f}`) : listHtml(ctx.distDir);
  const r = spawnSync(vnu, ["--format", "json", "--stdout", "--exit-zero-always", ...files], { encoding: "utf8", shell: process.platform === "win32" });
  const { messages } = JSON.parse(r.stdout || '{"messages":[]}');
  const findings = messages
    .filter((m) => m.type === "error" || (m.type === "info" && m.subType === "warning") || m.type === "non-document-error")
    .map((m) => ({ file: (m.url || "").replace(/^file:\/+/, ""), line: m.lastLine, message: m.message, check: `html/${m.type}` }));
  return { id, ok: findings.length === 0, findings };
}
```

- [ ] **Step 4: Run test → PASS. Commit**

```bash
git add engine/tools/lib engine/tools/gates/html.js engine/tools/test
git commit -m "feat: Nu HTML gate with fixtures"
```

---

### Task 4: Consistency gate

**Files:**
- Create: `engine/tools/gates/consistency.js`, `engine/tools/test/gate-consistency.test.js`, fixtures `inline-style.html`, `two-h1.html`, `skip-heading.html`, `dup-id.html`, `unknown-class.html`, `unknown-component.html`, `escaped-classes.html`, `engine/tools/test/fixtures/app.css`

**Interfaces:**
- Produces: `id = "consistency"`, checks named `consistency/inline-style`, `consistency/single-h1`, `consistency/heading-order`, `consistency/dup-id`, `consistency/class-exists`, `consistency/component-known`. `ctx.cssFile` (default `${distDir}/assets/app.css`), `ctx.components` (allow-list; default derived from `engine/catalog/**/*.njk` file names).

- [ ] **Step 1: Fixture CSS**

```css
/* engine/tools/test/fixtures/app.css  (what Tailwind emits, escaped) */
.mt-4{margin-top:1rem}.md\:ps-4{padding-inline-start:1rem}.\[animation-timeline\:view\(\)\]{animation-timeline:view()}.sda\:animate-reveal{animation:var(--animate-reveal)}
```

`escaped-classes.html` uses `class="mt-4 md:ps-4 [animation-timeline:view()] sda:animate-reveal"` and must pass `class-exists` (Review Focus 2).

- [ ] **Step 2: Failing tests** (one `test()` per check; each loads one fixture with `ctx = { distDir: fixtures, only: [name], cssFile: fixtures/app.css, components: ["hero-split"] }` and asserts `findings.some(f => f.check === "consistency/<check>")`, and that `escaped-classes.html` yields `ok: true`).

- [ ] **Step 3: Implement**

```js
// engine/tools/gates/consistency.js
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { listHtml, parse } from "../lib/html.js";
export const id = "consistency";

export function classesInCss(css) {
  const set = new Set();
  for (const m of css.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)/g)) set.add(m[1].replace(/\\(.)/g, "$1"));
  return set;
}
export function catalogComponents(engineDir = "engine") {
  const out = new Set();
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".njk") && out.add(e.name.replace(/\.njk$/, "")); };
  walk(path.join(engineDir, "catalog"));
  return out;
}
export async function run(ctx) {
  const findings = [];
  const css = classesInCss(readFileSync(ctx.cssFile || `${ctx.distDir}/assets/app.css`, "utf8"));
  const known = ctx.components ? new Set(ctx.components) : catalogComponents(ctx.engineDir);
  const files = ctx.only ? ctx.only.map((f) => `${ctx.distDir}/${f}`) : listHtml(ctx.distDir);
  for (const file of files) {
    const { root } = parse(file);
    const add = (check, message, el) => findings.push({ file, line: el?.range ? undefined : undefined, message, check: `consistency/${check}` });
    root.querySelectorAll("[style]").forEach((el) => add("inline-style", `inline style on <${el.tagName.toLowerCase()}>`, el));
    const h1s = root.querySelectorAll("h1"); if (h1s.length !== 1) add("single-h1", `${h1s.length} h1 elements`);
    let prev = 0;
    for (const h of root.querySelectorAll("h1,h2,h3,h4,h5,h6")) { const n = +h.tagName[1]; if (prev && n > prev + 1) add("heading-order", `h${prev} followed by h${n}`); prev = n; }
    const ids = new Map();
    root.querySelectorAll("[id]").forEach((el) => { const v = el.getAttribute("id"); ids.set(v, (ids.get(v) || 0) + 1); });
    for (const [v, n] of ids) if (n > 1) add("dup-id", `id "${v}" used ${n} times`);
    for (const el of root.querySelectorAll("[class]")) for (const c of el.getAttribute("class").split(/\s+/).filter(Boolean)) if (!css.has(c)) add("class-exists", `class "${c}" not in built CSS`);
    root.querySelectorAll("[data-component]").forEach((el) => { const v = el.getAttribute("data-component"); if (!known.has(v)) add("component-known", `data-component "${v}" not in catalog`); });
  }
  return { id, ok: findings.length === 0, findings };
}
```

Note: `class-exists` must ignore classes that Tailwind never emits because they are variants-only wrappers? No: every class in HTML either produces CSS or is dead. Tailwind also emits `.group`/`.peer` as no-op? It does not emit them. Allow-list `["group", "peer", "sr-only"?]`: `sr-only` is emitted; add `const NOOP = new Set(["group", "peer"])` and skip those (and `group/name`, `peer/name` prefixes).

- [ ] **Step 4: Run tests → PASS. Commit**

```bash
git add engine/tools/gates/consistency.js engine/tools/test
git commit -m "feat: consistency gate (classes, h1, headings, ids, components, inline styles)"
```

---

### Task 5: Schema gate

**Files:**
- Create: `engine/schema-contracts.json`, `engine/tools/gates/schema.js`, `engine/tools/test/gate-schema.test.js`, fixtures `schema-ok.html`, `schema-dangling-ref.html`, `schema-relative-url.html`, `schema-missing-type.html`

**Interfaces:**
- Produces: `id = "schema"`; checks `schema/parse`, `schema/single-block`, `schema/graph`, `schema/contract`, `schema/ref-resolves`, `schema/absolute-url`. Page type read from `<body data-page="...">`. Contracts file shape: `{ "home": { "required": ["Organization", "WebSite", "WebPage"] }, "generic": { "required": ["Organization", "WebSite", "WebPage", "BreadcrumbList"] } }` (filled per page type in the bylaws phase; start with these two).

- [ ] **Step 1: Fixtures.** `schema-ok.html` body `data-page="home"` with one block:

```json
{"@context":"https://schema.org","@graph":[
 {"@type":"Organization","@id":"https://example.com/#organization","name":"Northwind","url":"https://example.com/"},
 {"@type":"WebSite","@id":"https://example.com/#website","url":"https://example.com/","publisher":{"@id":"https://example.com/#organization"}},
 {"@type":"WebPage","@id":"https://example.com/en/","url":"https://example.com/en/","isPartOf":{"@id":"https://example.com/#website"}}]}
```

`schema-dangling-ref.html`: `publisher` points at `#nope` (Review Focus 4). `schema-relative-url.html`: `"url":"/en/"`. `schema-missing-type.html`: WebPage node removed.

- [ ] **Step 2: Failing tests** (four tests asserting the matching check id; ok fixture asserts `ok: true`).

- [ ] **Step 3: Implement**

```js
// engine/tools/gates/schema.js
import { readFileSync } from "node:fs";
import { listHtml, parse, jsonLd } from "../lib/html.js";
export const id = "schema";
const URL_KEYS = new Set(["url", "image", "logo", "sameAs", "contentUrl", "thumbnailUrl", "item"]);
export async function run(ctx) {
  const contracts = ctx.contracts || JSON.parse(readFileSync("engine/schema-contracts.json", "utf8"));
  const findings = [];
  const files = ctx.only ? ctx.only.map((f) => `${ctx.distDir}/${f}`) : listHtml(ctx.distDir);
  for (const file of files) {
    const { root } = parse(file);
    const add = (check, message) => findings.push({ file, message, check: `schema/${check}` });
    let blocks; try { blocks = jsonLd(root); } catch (e) { add("parse", e.message); continue; }
    if (blocks.length !== 1) { add("single-block", `${blocks.length} JSON-LD blocks`); continue; }
    const graph = blocks[0]["@graph"];
    if (!Array.isArray(graph)) { add("graph", "no @graph array"); continue; }
    const ids = new Set(graph.map((n) => n["@id"]).filter(Boolean));
    const types = new Set(graph.flatMap((n) => [].concat(n["@type"] || [])));
    const pageType = root.querySelector("body")?.getAttribute("data-page") || "generic";
    for (const t of contracts[pageType]?.required || []) if (!types.has(t)) add("contract", `page type "${pageType}" requires ${t}`);
    const walk = (v, key) => {
      if (Array.isArray(v)) return v.forEach((x) => walk(x, key));
      if (v && typeof v === "object") {
        if (Object.keys(v).length === 1 && v["@id"] && !ids.has(v["@id"]) && !/^https?:/.test(v["@id"])) add("ref-resolves", `reference ${v["@id"]} has no node`);
        return Object.entries(v).forEach(([k, x]) => walk(x, k));
      }
      if (typeof v === "string" && URL_KEYS.has(key) && !/^https?:\/\//.test(v)) add("absolute-url", `${key} "${v}" is not absolute`);
    };
    walk(graph, null);
  }
  return { id, ok: findings.length === 0, findings };
}
```

- [ ] **Step 4: Run tests → PASS. Commit** `feat: JSON-LD schema gate`

---

### Task 6: Budget gate

**Files:**
- Create: `engine/budgets.json`, `engine/tools/gates/budget.js`, `engine/tools/test/gate-budget.test.js`, fixtures `budget-ok.html` (+ `assets/app.css` reused), `budget-missing-asset.html`

**Interfaces:**
- `engine/budgets.json`: `{ "html": 51200, "css": 30720, "js": 2048, "page": 307200 }`. Checks `budget/html`, `budget/css`, `budget/js`, `budget/page`, `budget/missing-asset`. Page weight = HTML + every local `href`/`src`/`srcset` URL resolved under `distDir` (Review Focus 5: a missing asset is a finding, not zero).

- [ ] **Step 1: Failing tests** (ok fixture → `ok: true`; missing asset fixture referencing `/assets/nope.css` → `budget/missing-asset`; a test that passes `budgets: { html: 10 }` → `budget/html`).

- [ ] **Step 2: Implement**

```js
// engine/tools/gates/budget.js
import { readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { listHtml, parse } from "../lib/html.js";
export const id = "budget";
export function localAssets(root) {
  const urls = new Set();
  for (const el of root.querySelectorAll("[src],[href],[srcset]")) {
    for (const attr of ["src", "href"]) { const v = el.getAttribute(attr); if (v && v.startsWith("/") && !v.startsWith("//")) urls.add(v.split(/[?#]/)[0]); }
    const ss = el.getAttribute("srcset"); if (ss) ss.split(",").map((s) => s.trim().split(/\s+/)[0]).filter((u) => u.startsWith("/")).forEach((u) => urls.add(u));
  }
  return [...urls].filter((u) => /\.(css|js|woff2|avif|webp|png|svg|ico)$/.test(u));
}
export async function run(ctx) {
  const budgets = ctx.budgets || JSON.parse(readFileSync("engine/budgets.json", "utf8"));
  const findings = [];
  const files = ctx.only ? ctx.only.map((f) => `${ctx.distDir}/${f}`) : listHtml(ctx.distDir);
  for (const file of files) {
    const add = (check, message) => findings.push({ file, message, check: `budget/${check}` });
    const htmlBytes = statSync(file).size;
    if (htmlBytes > budgets.html) add("html", `${htmlBytes} B > ${budgets.html}`);
    let total = htmlBytes;
    for (const u of localAssets(parse(file).root)) {
      const p = path.join(ctx.distDir, u);
      if (!existsSync(p)) { add("missing-asset", `${u} not found`); continue; }
      const b = statSync(p).size; total += b;
      if (u.endsWith(".css") && b > budgets.css) add("css", `${u} ${b} B > ${budgets.css}`);
      if (u.endsWith(".js") && b > budgets.js) add("js", `${u} ${b} B > ${budgets.js}`);
    }
    if (total > budgets.page) add("page", `${total} B > ${budgets.page}`);
  }
  return { id, ok: findings.length === 0, findings };
}
```

- [ ] **Step 3: Run tests → PASS. Commit** `feat: byte budget gate`

---

### Task 7: i18n gate

**Files:**
- Create: `engine/tools/gates/i18n.js`, `engine/tools/test/gate-i18n.test.js`, fixtures `i18n/en.json`, `i18n/de.json` (missing one key), fixtures `hreflang/en/index.html`, `hreflang/de/index.html` (de lacks the link back to en)

**Interfaces:**
- Checks `i18n/keys` (every key path in default locale exists in every other locale and vice versa), `i18n/hreflang-reciprocal` (for each page with `link[rel=alternate][hreflang]`, every target page exists on disk and links back to this page), `i18n/x-default` (every page with alternates has `hreflang="x-default"`), `i18n/lang-attr` (`<html lang>` equals the first path segment).

- [ ] **Step 1: Failing tests** for the four checks.
- [ ] **Step 2: Implement** (flatten keys with a recursive `keys(obj, prefix)`; for hreflang, map `href` to `distDir + path + index.html`; compare sets both ways).
- [ ] **Step 3: PASS. Commit** `feat: i18n completeness and hreflang gate`

---

### Task 8: Static server, Lighthouse gate, a11y gate, links gate

**Files:**
- Create: `engine/tools/serve.js`, `engine/tools/gates/lighthouse.js`, `engine/tools/gates/a11y.js`, `engine/tools/gates/links.js`, `engine/tools/test/serve.test.js`

**Interfaces:**
- `serve.js` exports `startServer(distDir, port=0) → { url, close() }` using `node:http` with a mime map (html, css, js, woff2, avif, webp, png, svg, ico, xml, txt, json), serving `index.html` for directory URLs and `404.html` with status 404 for misses; `Cache-Control: public, max-age=31536000` for `/assets/`.
- `gates/lighthouse.js`: `run(ctx)` with `ctx.urls` (default: every HTML file → URL), `ctx.runs` (default 5), `ctx.profiles` (`["mobile","desktop"]`). Uses `lighthouse(url, { port, output: "json", onlyCategories: [...] }, config)` with `config = profile === "desktop" ? desktopConfig : undefined` (from `lighthouse/core/config/desktop-config.js`). Median per category; finding when any median < 100 (check `lighthouse/<profile>/<category>`); also records medians to `ctx.report.lighthouse`.
- `gates/a11y.js`: `pa11y(url, { runners: ["axe"], standard: "WCAG2AA", chromeLaunchConfig: { args: ["--headless=new"] } })` per URL; each issue → finding `a11y/<code>`.
- `gates/links.js`: `new LinkChecker().check({ path: baseUrl, recurse: true, linksToSkip: [/^https?:\/\/(?!localhost)/] })`; broken → `links/broken`; any external link (not localhost) → `links/external` unless listed in `site.allowedExternal`.

- [ ] **Step 1: serve test** (start on port 0, fetch `/en/`, assert 200 and `text/html`; fetch `/nope/`, assert 404). Implement. PASS.
- [ ] **Step 2: Implement the three gates** per the interface. Smoke test manually: `node -e "import('./engine/tools/gates/lighthouse.js').then(m => m.run({distDir:'dist/reference', runs:1, profiles:['mobile']})).then(r => console.log(JSON.stringify(r,null,1)))"`. Expected: a result object with medians (scores need not be 100 yet).
- [ ] **Step 3: Commit** `feat: lighthouse, a11y and link gates with static server`

---

### Task 9: Bylaw format gate and gate runner

**Files:**
- Create: `engine/tools/gates/bylaws.js`, `engine/tools/test/gate-bylaws.test.js`, fixtures `bylaw-ok.md`, `bylaw-bad.md`, `engine/tools/gate.js`, `reports/.gitkeep`

**Interfaces:**
- `gates/bylaws.js`: for every `engine/bylaws/*.md`, each `### R-AREA-NN Title` block must have a first body line starting `MUST.` or `SHOULD.`, a `Why:` line, and a `Gate:` line whose value is either `manual: checklists/<file>.md` or a `<gateId>/<check>` where `gateId` is one of the gate ids in `gate.js` (`html, consistency, schema, budget, i18n, lighthouse, a11y, links, bylaws`). IDs must be unique across files and numbered contiguously within a file. Checks `bylaws/format`, `bylaws/gate-ref`, `bylaws/unique-id`.
- `gate.js`: parses `--site`, `--skip a,b`, `--only a,b`, `--runs n`; builds `ctx`; starts the server; runs gates in order `bylaws, html, consistency, schema, budget, i18n, links, a11y, lighthouse`; prints a table; writes `reports/latest.md` (versions of node/lighthouse/tailwind/eleventy/vnu, commit hash, per-gate counts, Lighthouse medians per page); exits 1 if any gate failed.

- [ ] **Step 1: Failing tests** for the three bylaw checks.
- [ ] **Step 2: Implement both files.**
- [ ] **Step 3: Run `npm run gate -- --site reference --skip lighthouse,a11y`** against the phase-1 page. Fix the page until html, consistency, schema, budget, i18n, links are green (add the JSON-LD block and `data-page="home"` to `base.njk`; add `sitemap.xml` later in catalog phase). Then run the full gate once and record the numbers in the commit message.
- [ ] **Step 4: Commit** `feat: bylaw lint gate and gate runner`

---

### Task 10: DECISIONS.md and bylaws 00–04

**Files:**
- Create: `engine/DECISIONS.md`, `engine/bylaws/00-precedence.md`, `01-html.md`, `02-tokens.md`, `03-layout.md`, `04-typography.md`

Each file: purpose paragraph (≤ 80 words), rules in the fixed format, then `## Checklist` of one line per rule. Sources as footnote links. Keep each file under 250 lines.

- [ ] **Step 1: DECISIONS.md** = master prompt section 3 table (D1–D18) plus spec section 2 answers, each row with date 2026-10-17 and source URL.
- [ ] **Step 2: 00-precedence.md (R-PREC-01…06):** precedence order; override procedure (`DECISIONS.md` entry with bylaw ID, reason, date); bylaw versioning (semver in CHANGELOG.md, breaking = a rule that makes a passing site fail); the CSS exception list (exactly: `@font-face` blocks, 5-line `@view-transition` block); the JS allowance (one module, ≤ 2048 B, feature-detected); the "catalog verbatim" rule.
- [ ] **Step 3: 01-html.md (R-HTML-01…~20):** doctype and `<html lang dir>`; fixed head order (spec 4.9); exactly one `h1`, no skipped levels; landmarks: one `header`, one `nav[aria-label]` per nav, one `main`, one `footer`; every `section` and `article` starts with a heading (Nu warning otherwise), otherwise use `div`; no `role` that duplicates native semantics; no `type` on script/style except `module` and `application/ld+json`; `data-component` on catalog roots only; `button` for actions, `a` for navigation, never `a href="#"`; `<time datetime>` for dates; `<address>` only for contact info; ids unique and lower-case-hyphen; no `tabindex` > 0; `aria-*` only from the allowed list (`aria-label` on nav/landmarks, `aria-current`, `aria-describedby` on inputs, `aria-hidden` on decorative svg, `aria-live` on toasts); images always have `alt` (empty for decorative); no inline `style`; no `<br>` for spacing; `target="_blank"` only with `rel="noopener"` and a visible hint; Gate refs: `html/error`, `html/info`, `consistency/*`, `a11y/*`.
- [ ] **Step 4: 02-tokens.md (R-TOK-01…~15):** spacing base 0.25rem, allowed section rhythm steps (4, 6, 8, 12, 16, 24, 32); type scale (xs…6xl with fixed `--text-*` line heights); color roles (`brand`, `accent`, `surface`, `surface-alt`, `ink`, `ink-muted`, `line`, `success`, `warning`, `danger`, `focus`) each as a 50–950 OKLCH scale generated from the brief's hue; radius scale (`sharp` = 0, `soft` = 0.5rem/0.75rem, `round` = 1rem/9999px); shadow scale (sm, md, lg only); z-index scale (`z-10` sticky header, `z-20` dropdowns, `z-30` drawer, `z-40` dialog, `z-50` toast); breakpoints (default Tailwind: sm 40rem, md 48rem, lg 64rem, xl 80rem); container `max-w-7xl` with `px-4 sm:px-6 lg:px-8`; durations (`fast` 150, `base` 200, `slow` 300, `reveal` 500 ms) and easings (`ease-out` default, `ease-in-out` for movement); motion presets table (calm/standard/expressive distances and stagger); the `--animate-*` tokens list (`reveal`, `reveal-up`, `reveal-start`, `drop`, `scale-in`); brand injection rule.
- [ ] **Step 5: 03-layout.md (R-LAY-01…~12):** one container; 12-column grid via `grid-cols-12` or `md:grid-cols-2/3` only; section vertical padding `py-16 md:py-24`, alternating surfaces; stacking spacing inside sections `space-y-*` from the rhythm steps only; max measure `max-w-prose` for text; sticky header height and `scroll-mt`; logical properties only (`ps/pe/ms/me/start/end`), no `pl/pr/ml/mr/left/right`; min viewport 320 px, no horizontal overflow; 400 % zoom reflow; overflow rules for long words (`break-words`, `hyphens-auto` for de); print: `print:hidden` for nav, footer, motion.
- [ ] **Step 6: 04-typography.md (R-TYPO-01…~12):** approved font list and per-script font; weights 400/500/600/700 only; element → size/weight/leading table (h1 `text-4xl md:text-5xl font-bold leading-tight tracking-tight`, h2 `text-3xl md:text-4xl font-semibold`, h3 `text-xl font-semibold`, body `text-base leading-relaxed`, lede `text-lg md:text-xl`, small `text-sm`); `text-balance` on headings only; heading length limits (h1 ≤ 60 chars, h2 ≤ 80); link styling (underline on hover and always in prose); number formatting via `tabular-nums` for stats; text expansion allowance (+35 % width tolerance in components); Arabic line-height `leading-loose`.
- [ ] **Step 7: Run `node engine/tools/gates/bylaws.js` (or `npm run gate -- --only bylaws`) → green. Commit** `docs: decisions and bylaws 00–04`

---

### Task 11: Bylaws 05–09

**Files:** `05-color.md`, `06-motion.md`, `07-components.md`, `08-sections.md`, `09-pages.md`

- [ ] **05-color.md (R-COL-01…~10):** role usage table (surface for backgrounds, ink for text, brand-600 for primary actions, accent sparingly); contrast ≥ 4.5:1 text, ≥ 3:1 large text and UI; focus ring `focus-visible:outline-2 outline-offset-2 outline-focus`; dark mode mapping table (role → dark value) under `dark:`; state colors only for states; never color alone to convey meaning; gradients only in hero and CTA band; image overlays need `bg-ink/60` for text contrast.
- [ ] **06-motion.md (R-MOT-01…~14):** allowed properties (`transform`, `opacity`); budget (max 3 simultaneous entrances, ≤ 24 px travel, 150–500 ms); every animated class under `motion-safe:`; reveal pattern (exact class string with `sda:` and `js:`/`data-revealed` variants); entry pattern for popover/dialog (`starting:` + `transition-discrete`); hover pattern; LCP element never animates; no autoplay loops except `animate-pulse` skeletons; `@view-transition` allowed on exception list; `enhance.js` responsibilities and limits; reduced-motion = all motion off, no fades either.
- [ ] **07-components.md (R-COMP-01…~16):** anatomy template every component doc follows (name, purpose, anatomy, variants, states, spacing, motion, a11y, i18n, content limits); states list; component root has `data-component`; size variants only `sm`/`md`/`lg`; buttons: primary/secondary/ghost/link, `min-h-11` touch target, verb-first label; links: external hint; cards: heading level passed in, never hard-coded; lists for repeated items (`ul`); overlays via popover/dialog only; carousel rule; tables: `caption`, `th scope`; icons: `aria-hidden` plus visible text or `sr-only` label; every component shipped in the catalog with every variant on the style-guide page.
- [ ] **08-sections.md (R-SEC-01…~12):** section anatomy (eyebrow, heading, lede, body, CTA); one `h2` per section; content limits table (feature grid 3–6 items, stats 3–4, logos 5–8, testimonials 1–3, FAQ 4–10, steps 3–5, team 4–12, pricing 2–4 tiers); max words per lede (35) and per card body (40); CTA band at most once per page plus header CTA; alternate surfaces; section order rules per page type referenced from `09-pages.md`.
- [ ] **09-pages.md (R-PAGE-01…~12 + inventory table):** inventory table from the master prompt section 6 with columns tier, URL pattern, title pattern, breadcrumb, required sections, optional sections, schema contract id, OG rule, locale notes; URL policy (D12); every page has exactly one primary CTA; legal pages carry "last reviewed" date; 404/500 use the base shell with no nav JS; style-guide page exists on every site at `/<locale>/style-guide/` with `robots: noindex`.
- [ ] Update `engine/schema-contracts.json` with every page type's required types from the table. Run bylaws gate → green. Commit `docs: bylaws 05–09`

---

### Task 12: Bylaws 10–14

**Files:** `10-content.md`, `11-i18n.md`, `12-seo-meta.md`, `13-schema.md`, `14-accessibility.md`

- [ ] **10-content.md (R-CONT-01…~16):** three voice presets (plain, confident, warm) with sample sentences; sentence case for headings and buttons; Oxford comma; numerals ≥ 10, words below; no exclamation marks; CTA verbs list (Get, Start, Book, Talk, Download, Apply, See, Read); forbidden words list (leverage, synergy, click here, learn more as link text, lorem); link text describes destination; microcopy table (form labels, errors, empty states, 404 copy) with i18n keys; title ≤ 60 chars, description 120–155 chars; reading level target (grade 8); fictitious-claims rule (every number is plausible and marked fictional in `DECISIONS.md`); glossary file `sites/<name>/glossary.json` for terminology; date/number formats delegated to 11.
- [ ] **11-i18n.md (R-I18N-01…~16):** folder per locale; BCP 47 tags; `lang` and `dir` on `html`; hreflang reciprocity + `x-default`; translated slugs allowed with a slug map in `site.json`; UI strings only via `t()`; content never concatenates strings; pluralisation via separate keys; date format per locale table (en `17 October 2026`, de `17. Oktober 2026`, ar Arabic-Indic digits optional off by default), numbers and currency per CLDR; logical properties; `rtl:` only for directional icons (`rtl:-scale-x-100`); never flags for languages, native names in switcher; text expansion tolerance; per-script fonts and preload; locale switcher links to the same page; fallback locale behaviour = build error, never silent English.
- [ ] **12-seo-meta.md (R-SEO-01…~14):** head order; title and description patterns; canonical absolute; robots only for noindex pages; OG (`og:title`, `og:description`, `og:image` 1200×630, `og:locale`, `og:locale:alternate`, `og:type`, `og:url`, `og:site_name`), Twitter `summary_large_image`; sitemap.xml with `xhtml:link` alternates; robots.txt with sitemap line; feed.xml (Atom) for blog; one `h1` per page; link text unique within a page; no external links in mockups; `security.txt` at `/.well-known/`.
- [ ] **13-schema.md (R-SCH-01…~14 + contract table):** JSON-LD only, one block, `@graph`; shared nodes `#organization`, `#website` (with `SearchAction` only if a search page exists), per page `WebPage` subtype with `isPartOf`, `breadcrumb`, `inLanguage`; contract table per page type (home: Organization, WebSite, WebPage; about: AboutPage; contact: ContactPage + ContactPoint; team: ProfilePage per person page, Person nodes; blog post: BlogPosting with `author`, `datePublished`, `image`; job: JobPosting with required Google fields; event: Event; case study: Article; service: Service with `provider`; product: Product with `Offer` only if price is shown; FAQ page: FAQPage allowed, no rich-result expectation; office: LocalBusiness only when the office serves customers in person); absolute URLs; nothing invisible; no ratings/reviews unless real; dates ISO 8601; escaping `<` as `<`.
- [ ] **14-accessibility.md (R-A11Y-01…~20):** WCAG 2.2 AA map; skip link first focusable; focus visible everywhere; focus order = DOM order; dialogs: native `showModal` behaviour, `autofocus` on first field, close button first in DOM? (no: last, after content; Escape works natively); popovers return focus natively; target size ≥ 24 px, buttons `min-h-11`; contrast; no motion-only info; captions/transcripts for media facades; form labels always visible; errors in text linked by `aria-describedby`; consistent help location (footer contact); no redundant entry (multi-step forms carry values via GET); reflow; text spacing; manual checklist list (keyboard walk, screen-reader read of each template, zoom 400 %, RTL visual check, Windows high contrast via `forced-colors:` check).
- [ ] Run bylaws gate → green. Commit `docs: bylaws 10–14`

---

### Task 13: Bylaws 15–19, INDEX.md, CHANGELOG.md

**Files:** `15-performance.md`, `16-forms.md`, `17-assets.md`, `18-security-deploy.md`, `19-quality-gates.md`, `engine/INDEX.md`, `engine/CHANGELOG.md`

- [ ] **15-performance.md (R-PERF-01…~16):** budgets (from `budgets.json`); one CSS file, minified; one JS module ≤ 2 KB, `type="module"`; fonts: ≤ 2 files per page, preload the Latin, `font-display: swap` + `size-adjust`; images: AVIF+WebP, width/height, `sizes`, lazy except LCP, LCP `fetchpriority="high"`, hero ≤ 120 KB; no external requests; no layout shift (reserved space for everything, including fonts); no render-blocking beyond the one CSS; test conditions (spec Q6) recorded in `reports/latest.md`; CLS 0, LCP ≤ 1.2 s lab mobile, TBT 0.
- [ ] **16-forms.md (R-FORM-01…~14):** `form` with `method="get"` to thank-you; every control has a visible `label`; `autocomplete` tokens table; `required` + native validation; `inputmode` for numeric; help text via `aria-describedby`; error summary pattern (static example state) at top with links to fields; preserved input (GET keeps values); submit button verb-first; one honeypot `input` in a `hidden` wrapper with `tabindex="-1" autocomplete="off"`; file upload: accepted types and max size stated; multi-step: one step per page, progress indicator, values passed via GET; success page: confirmation plus next step; `novalidate` never used.
- [ ] **17-assets.md (R-ASSET-01…~12):** folder layout `/assets/{fonts,icons,images,og}`; icon sprite build and allow-list; favicon set (spec Q5) and `theme-color` light/dark; placeholder image generator (seeded by slug, brand hues, aspect ratios, output sizes 480/768/1200/1600 widths); OG image generator; naming `kebab-case`; no stock photos, no real people; licence notes (Lucide ISC, fonts OFL).
- [ ] **18-security-deploy.md (R-DEPLOY-01…~10):** `_headers` file template (CSP `default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-src 'none'; base-uri 'self'; form-action 'self'`, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), note that inline JSON-LD is not executed and passes CSP; `/.well-known/security.txt`; `robots.txt`; 404 and 500 pages at root for static hosts; trailing-slash redirects; staging `noindex` via `X-Robots-Tag` header; no secrets in the repo.
- [ ] **19-quality-gates.md (R-GATE-01…~12):** every gate, its command, threshold, and what it checks; the pre-delivery manual list; the rule that a site is "done" only with a green `reports/latest.md` committed.
- [ ] **INDEX.md:** for each task (new site, new page, new component, new locale, review a site) the ordered list of files to read.
- [ ] **CHANGELOG.md:** `0.1.0 – 2026-10-17 – initial bylaws draft`.
- [ ] Run bylaws gate → green; run `npm test`. Commit `docs: bylaws 15–19, index and changelog`. **Stop and ask for bylaw review.**

---

## Self-review notes

- Spec coverage: build (T1), Nu (T2–3), consistency (T4), schema (T5), budgets (T6), i18n/hreflang (T7), Lighthouse/a11y/links/server (T8), bylaw lint + runner (T9), bylaws and decisions (T10–13). Catalog, enhance.js final form, fonts/icons/images builders, reference site, checklists and README are **phase 3–5** and get their own plan after the bylaw review, because their contents depend on the approved bylaws.
- Review Focus items 1–5 each have a named test in T1, T4, T3, T5, T6.
- Interface names used consistently: `run(ctx)`, `ctx.distDir`, `ctx.only`, `findings[].check`, gate ids `html, consistency, schema, budget, i18n, lighthouse, a11y, links, bylaws`.
