# Mockup Engine Phase 3 Implementation Plan (theme, asset tools, catalog, style guide)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved bylaws into a working catalog: the Tailwind theme generated from a brief's brand inputs, the font/icon/image/favicon/social-image tools, every primitive, component and section as Nunjucks macros, the document shell with full head and discovery files, the final `enhance.js`, and a multi-page style guide that passes all nine gates.

**Architecture:** Everything in the catalog is a Nunjucks macro (`{% from "primitives/button.njk" import button %}`), so pages pass data and never write markup. `engine/theme/app.css` holds static keyframes and variants; brand tokens and `@font-face` blocks are generated at build time and spliced in. Asset tools post-process `dist/`: per-page icon sprites, placeholder images named by `slug-ratio-width.format`, favicons and OG images. Engine-owned pages (style guide, sitemap, robots, security.txt, headers, redirects, root redirect, 404, 500) are Eleventy 3 virtual templates registered from `eleventy.config.js`, so every site gets them without copying files.

**Tech Stack:** Eleventy 3.1.7 (virtual templates via `addTemplate`), Tailwind 4.3.3, sharp 0.35, lucide-static 1.59, @fontsource-variable/inter + noto-sans-arabic, Node 24 test runner. Gates from phase 1–2.

**Spec:** `docs/superpowers/specs/2026-10-17-mockup-engine-design.md` §4 and the bylaws `engine/bylaws/00`–`19` (binding; cite rule IDs).

## Global Constraints

- Every `.njk` catalog file begins with the anatomy comment block of R-COMP-01 (name, purpose, anatomy, variants, states, spacing, motion, keyboard, a11y, i18n, content limits).
- Component root carries `data-component="<file name>"` and, when variants exist, `data-variant="<variant>"` (R-HTML-10; `data-variant` is the chosen form of the spec's `hero-split` example).
- Classes only from Tailwind utilities; role colours only (`bg-surface`, `text-ink`, `bg-brand-600` …); logical properties only (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`, `text-start`, `text-end`, `rounded-s-*`, `border-s`); no `dark:`; all motion under `motion-safe:` (R-TOK-04, R-TOK-05, R-LAY-04, R-MOT-02).
- Buttons `inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-md font-medium` + variant + focus ring `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus` (R-COMP-05, R-COL-04).
- Section skeleton `<section class="py-16 md:py-24 bg-surface|bg-surface-alt" data-component="…">` → container `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8` → eyebrow, `h2`, lede, body, one CTA (R-SEC-01, R-TOK-10).
- Head order exactly R-HTML-02; module script last in `body`.
- `enhance.js` ≤ 2048 B minified, two feature-detected behaviours only (R-MOT-10).
- Budgets per page: HTML ≤ 50 KB, CSS ≤ 30 KB, JS ≤ 2 KB, total ≤ 300 KB (R-PERF-01). Style-guide pages are split until each is within budget.
- After every task: `npm test` green and `npm run build -- --site reference && npm run gate -- --site reference --skip lighthouse` green; full gate (with Lighthouse) at Tasks 5, 9 and 11.
- Commit at the end of every task on branch `mockup-engine`.

## Review Focus

1. A brand hue of 0 or 360 and an accent hue equal to the brand hue must still produce distinct, valid OKLCH scales and a `theme-color` hex (Task 1 test).
2. A page whose text contains only Latin characters must preload and count only the Latin font file even when the site has an Arabic locale (Task 2 test: `@font-face` blocks carry `unicode-range`; budget gate counts fonts by range).
3. An icon name not in `engine/icons.json` must fail the build naming the page and icon, never render an empty `<use>` (Task 3 test).
4. Two builds of the same site must produce byte-identical placeholder images and sprites (Task 4 test).
5. A popover menu must be operable with keyboard only and close on Escape with focus returned to its trigger, with `enhance.js` absent (Task 7: manual check recorded in the task's ledger line, plus the axe run on the style guide).

---

## File structure

```
engine/theme/app.css                         static: @import source(none), @source, @custom-variant js/sda, @theme keyframes, /* @brand */ and /* @fonts */ markers, @view-transition block
engine/tools/lib/theme.js                    brandTokens(brand) → @theme CSS; oklchToHex()
engine/tools/lib/placeholder.js              seeded SVG placeholder generator
engine/tools/lib/ico.js                      PNG-in-ICO encoder
engine/tools/build-fonts.js                  copy subset woff2, emit @font-face CSS (+ metric fallback), return preload file
engine/tools/build-icons.js                  per-page sprite injection from engine/icons.json
engine/tools/build-images.js                 generate referenced images (AVIF/WebP), favicons, OG PNGs
engine/tools/build.js                        orchestrates: eleventy → fonts → theme splice → tailwind → images → icons → cleanup
engine/icons.json                            icon allow-list
engine/catalog/samples.json                  sample data for every section (used by the style guide)
engine/catalog/primitives/*.njk              button, link, field, badge, tag, avatar, icon, divider, kbd, picture, wordmark
engine/catalog/components/*.njk              see Task 8 table
engine/catalog/sections/*.njk                see Task 9 table; sections/_render.njk dispatcher
engine/catalog/templates/_head.njk           full head partial
engine/catalog/templates/base.njk            shell: skip link, header, main, footer, sprite placeholder, script
engine/catalog/templates/page.njk            sections-driven page; article.njk (prose body); error.njk
engine/catalog/virtual/*.njk                 engine-owned pages registered by eleventy.config.js (style guide, sitemap, robots, security.txt, _headers, _redirects, root index, 404, 500)
engine/scripts/enhance.js                    final script
engine/i18n/en.json, _template.json          all UI keys
eleventy.config.js                           + virtual templates, + schema per page type, + breadcrumbs, + filters (t, formatDate, formatNumber)
engine/tools/test/{theme,build-fonts,build-icons,placeholder,ico,build-images,schema-json,consistency-extra}.test.js
```

Macro conventions: every macro takes positional required args then an `opts` object; every section macro is named `render(s)` and takes the section's data object; the dispatcher `sections/_render.njk` exports `section(s)` and switches on `s.type`.

---

### Task 1: Theme tokens from the brief (lib/theme.js, app.css, build splice)

**Files:**
- Create: `engine/tools/lib/theme.js`, `engine/tools/test/theme.test.js`
- Modify: `engine/theme/app.css`, `engine/tools/build.js`, `engine/catalog/templates/base.njk`, `sites/reference/content/en/index.md`

**Interfaces:**
- `brandTokens(brand) → string` where `brand = { hue, accentHue, radius: "sharp"|"soft"|"round", motion: "calm"|"standard"|"expressive", font: string }`; returns one `@theme { … }` block defining `--color-*: initial` then `--color-brand-50…950`, `--color-accent-50…950`, role colours with `light-dark()`, state colours, `--radius-*`, `--reveal-distance/-duration/-stagger`, `--ease-smooth`, `--font-sans`.
- `oklchToHex(l, c, h) → "#rrggbb"`; `themeColors(brand) → { light: hex, dark: hex }` (brand-600 light, brand-400 dark) for `<meta name="theme-color">`.
- `build.js` replaces `/* @brand */` in the temp CSS with `brandTokens(site.brand)` and exposes `site.themeColors` to templates via global data.

- [ ] **Step 1: Failing tests**

```js
// engine/tools/test/theme.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { brandTokens, oklchToHex, themeColors } from "../lib/theme.js";

const brand = { hue: 250, accentHue: 160, radius: "soft", motion: "standard", font: "inter" };

test("oklchToHex converts known colours", () => {
  assert.equal(oklchToHex(1, 0, 0), "#ffffff");
  assert.equal(oklchToHex(0, 0, 0), "#000000");
  const red = oklchToHex(0.628, 0.2577, 29.23);
  assert.match(red, /^#f[ef]0[0-4]0[0-4]$/);
});

test("brandTokens wipes the palette and defines roles with light-dark()", () => {
  const css = brandTokens(brand);
  assert.match(css, /--color-\*: initial;/);
  for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) assert.match(css, new RegExp(`--color-brand-${step}: oklch\\(`));
  assert.match(css, /--color-accent-600: oklch\(/);
  assert.match(css, /--color-surface: light-dark\(oklch\([^)]*\), oklch\([^)]*\)\);/);
  for (const role of ["surface-alt", "surface-raised", "ink", "ink-muted", "ink-inverse", "line", "line-strong", "focus", "success", "success-soft", "success-strong", "warning", "warning-soft", "warning-strong", "danger", "danger-soft", "danger-strong"]) assert.match(css, new RegExp(`--color-${role}: light-dark\\(`), role);
  assert.match(css, /--radius-md: 0\.5rem;/);
  assert.match(css, /--reveal-distance: 16px;/);
  assert.match(css, /--reveal-duration: 300ms;/);
  assert.match(css, /--reveal-stagger: 60ms;/);
  assert.match(css, /--font-sans: "Inter Variable", "Inter Fallback", system-ui, sans-serif;/);
});

test("hue 0, hue 360 and accent equal to brand still give valid distinct scales", () => {
  for (const hue of [0, 360]) {
    const css = brandTokens({ ...brand, hue, accentHue: hue });
    assert.doesNotMatch(css, /NaN|undefined/);
    assert.match(css, /--color-brand-600: oklch\(56% 0\.17 (0|360)\)/);
    assert.match(css, /--color-accent-600: oklch\(56% 0\.17 (0|360)\)/);
  }
});

test("themeColors gives hex values for both schemes", () => {
  const { light, dark } = themeColors(brand);
  assert.match(light, /^#[0-9a-f]{6}$/);
  assert.match(dark, /^#[0-9a-f]{6}$/);
  assert.notEqual(light, dark);
});

test("radius and motion presets map to the bylaw values", () => {
  assert.match(brandTokens({ ...brand, radius: "sharp" }), /--radius-lg: 0;/);
  assert.match(brandTokens({ ...brand, radius: "round" }), /--radius-xl: 2rem;/);
  assert.match(brandTokens({ ...brand, motion: "calm" }), /--reveal-distance: 8px;[\s\S]*--reveal-duration: 200ms;[\s\S]*--reveal-stagger: 0ms;/);
  assert.match(brandTokens({ ...brand, motion: "expressive" }), /--reveal-distance: 24px;[\s\S]*--reveal-duration: 500ms;[\s\S]*--reveal-stagger: 90ms;/);
});
```

- [ ] **Step 2: Run → FAIL (module missing)**

Run: `node --test engine/tools/test/theme.test.js`

- [ ] **Step 3: Implement lib/theme.js**

```js
// engine/tools/lib/theme.js
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const L = [97, 93, 86, 76, 66, 56, 48, 40, 33, 26, 20];
const C = [0.02, 0.04, 0.07, 0.11, 0.14, 0.17, 0.17, 0.14, 0.11, 0.08, 0.05];
const RADIUS = { sharp: ["0", "0", "0", "0", "9999px"], soft: ["0.25rem", "0.5rem", "0.75rem", "1rem", "9999px"], round: ["0.5rem", "1rem", "1.5rem", "2rem", "9999px"] };
const MOTION = { calm: [8, 200, 0], standard: [16, 300, 60], expressive: [24, 500, 90] };
export const FONTS = {
  inter: { family: "Inter Variable", pkg: "inter", fallback: "Arial", metrics: { sizeAdjust: "107.12%", ascent: "90.49%", descent: "22.56%", lineGap: "0%" } },
  figtree: { family: "Figtree Variable", pkg: "figtree", fallback: "Arial", metrics: { sizeAdjust: "100.5%", ascent: "94%", descent: "25%", lineGap: "0%" } },
  "ibm-plex-sans": { family: "IBM Plex Sans Variable", pkg: "ibm-plex-sans", fallback: "Arial", metrics: { sizeAdjust: "100.3%", ascent: "102.6%", descent: "27.6%", lineGap: "0%" } },
  "source-sans-3": { family: "Source Sans 3 Variable", pkg: "source-sans-3", fallback: "Arial", metrics: { sizeAdjust: "94.4%", ascent: "107.5%", descent: "30%", lineGap: "0%" } },
  "noto-sans": { family: "Noto Sans Variable", pkg: "noto-sans", fallback: "Arial", metrics: { sizeAdjust: "104.5%", ascent: "102.6%", descent: "28.1%", lineGap: "0%" } },
  "noto-sans-arabic": { family: "Noto Sans Arabic Variable", pkg: "noto-sans-arabic", fallback: "Arial", metrics: { sizeAdjust: "100%", ascent: "110%", descent: "40%", lineGap: "0%" } },
  system: null,
};

const oklch = (l, c, h) => `oklch(${l}% ${c} ${h})`;
const scale = (name, hue) => STEPS.map((s, i) => `  --color-${name}-${s}: ${oklch(L[i], C[i], hue)};`).join("\n");
const ld = (name, light, dark) => `  --color-${name}: light-dark(${light}, ${dark});`;

export function brandTokens(brand) {
  const h = brand.hue, a = brand.accentHue;
  const r = RADIUS[brand.radius] || RADIUS.soft;
  const [dist, dur, stag] = MOTION[brand.motion] || MOTION.standard;
  const font = FONTS[brand.font] === undefined ? FONTS.inter : FONTS[brand.font];
  const fontSans = font ? `"${font.family}", "${font.family.replace(" Variable", "")} Fallback", system-ui, sans-serif` : `system-ui, sans-serif`;
  const state = (name, hue) => [ld(name, oklch(55, 0.15, hue), oklch(70, 0.15, hue)), ld(`${name}-soft`, oklch(95, 0.04, hue), oklch(25, 0.06, hue)), ld(`${name}-strong`, oklch(38, 0.14, hue), oklch(85, 0.12, hue))].join("\n");
  return `@theme {
  --color-*: initial;
${scale("brand", h)}
${scale("accent", a)}
${ld("surface", oklch(99, 0.002, h), oklch(18, 0.01, h))}
${ld("surface-alt", oklch(96.5, 0.005, h), oklch(22, 0.012, h))}
${ld("surface-raised", oklch(100, 0, h), oklch(26, 0.014, h))}
${ld("ink", oklch(20, 0.02, h), oklch(95, 0.01, h))}
${ld("ink-muted", oklch(46, 0.02, h), oklch(72, 0.015, h))}
${ld("ink-inverse", oklch(99, 0.002, h), oklch(16, 0.01, h))}
${ld("line", oklch(90, 0.01, h), oklch(32, 0.015, h))}
${ld("line-strong", oklch(78, 0.015, h), oklch(42, 0.02, h))}
${ld("focus", oklch(48, 0.17, h), oklch(76, 0.11, h))}
${state("success", 150)}
${state("warning", 80)}
${state("danger", 25)}
  --radius-sm: ${r[0]};
  --radius-md: ${r[1]};
  --radius-lg: ${r[2]};
  --radius-xl: ${r[3]};
  --radius-full: ${r[4]};
  --reveal-distance: ${dist}px;
  --reveal-duration: ${dur}ms;
  --reveal-stagger: ${stag}ms;
  --ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);
  --font-sans: ${fontSans};
}
`;
}

/** OKLCH → sRGB hex (clamped). l in 0..1, c ≥ 0, h in degrees. */
export function oklchToHex(l, c, h) {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr), b = c * Math.sin(hr);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ ** 3, m3 = m_ ** 3, s3 = s_ ** 3;
  const lin = [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
  const srgb = lin.map((v) => { v = Math.min(1, Math.max(0, v)); return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; });
  return "#" + srgb.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
}

export function themeColors(brand) {
  return { light: oklchToHex(L[6] / 100, C[6], brand.hue), dark: oklchToHex(L[4] / 100, C[4], brand.hue) };
}
```

- [ ] **Step 4: app.css static part**

```css
@import "tailwindcss" source(none);
@source "../../../dist/__SITE__";
@source not "../../../dist/__SITE__/assets";

/* JS present (set by enhance.js) and scroll-driven animation support: the two progressive-enhancement variants of bylaw 06. */
@custom-variant js (&:where([data-js], [data-js] *));
@custom-variant sda { @supports (animation-timeline: view()) { @slot } }

/* @brand */

/* @fonts */

@theme {
  --animate-reveal: reveal var(--reveal-duration) var(--ease-smooth) both;
  --animate-reveal-start: reveal-start var(--reveal-duration) var(--ease-smooth) both;
  --animate-drop: drop 200ms var(--ease-smooth) both;
  --animate-scale-in: scale-in 200ms var(--ease-smooth) both;
  --animate-fade: fade 200ms ease-out both;
  @keyframes reveal { from { opacity: 0; transform: translateY(var(--reveal-distance)); } to { opacity: 1; transform: none; } }
  @keyframes reveal-start { from { opacity: 0; transform: translateX(calc(var(--reveal-distance) * -1)); } to { opacity: 1; transform: none; } }
  @keyframes drop { from { opacity: 0; transform: translateY(-0.5rem); } to { opacity: 1; transform: none; } }
  @keyframes scale-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
}

/* Exception list (R-PREC-07): cross-document view transitions, motion-safe only. */
@media (prefers-reduced-motion: no-preference) {
  @view-transition { navigation: auto; }
}
```

Note: `reveal-start` uses `translateX` negative; in RTL the `rtl:` variant is not available inside keyframes, so `reveal-start` is used only on symmetric decoration, never on text blocks (document in R-TOK-13's anatomy note when the catalog uses it).

- [ ] **Step 5: build.js splice and global data**

In `build()` after loading the site: `const css = readFileSync("engine/theme/app.css","utf8").replaceAll("__SITE__", site).replace("/* @brand */", brandTokens(siteConfig.brand))`. Fonts splice comes in Task 2 (`/* @fonts */`). In `eleventy.config.js` add `eleventyConfig.addGlobalData("themeColors", themeColors(site.brand))`.

- [ ] **Step 6: Base shell uses roles**

`base.njk`: `<html lang dir class="scheme-light-dark scroll-pt-20">`, `<body class="bg-surface text-ink font-sans antialiased">`, `<main id="main" class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">`. `index.md`: `h1` → `text-4xl md:text-5xl font-bold tracking-tight text-balance`, `p` → `mt-4 text-lg md:text-xl text-ink-muted`.

- [ ] **Step 7: Run theme tests → PASS; `npm run build -- --site reference && npm run gate -- --site reference --skip lighthouse` → green (class-exists now proves no palette names are used). Commit** `feat(theme): brand tokens generated from the brief; roles with light-dark()`

---

### Task 2: Fonts (build-fonts.js)

**Files:**
- Create: `engine/tools/build-fonts.js`, `engine/tools/test/build-fonts.test.js`
- Modify: `engine/tools/build.js`, `engine/catalog/templates/base.njk` (preload link comes with `_head.njk` in Task 5; for now add the preload line to base.njk)

**Interfaces:**
- `fontPlan(brand, locales) → { faces: [{ family, pkg, file, subset, unicodeRange }], preload: "/assets/fonts/<latin file>"|null, css: string }` using `FONTS` from theme.js; subsets: `latin`, `latin-ext` always; `arabic` (from `noto-sans-arabic`) when any locale starts with `ar`, `fa`, `ur`; `cyrillic` when `ru`/`uk`/`bg`; `greek` when `el`; `vietnamese` when `vi`. For `system`: empty.
- `copyFonts(plan, distDir)` copies each `file` from `node_modules/@fontsource-variable/<pkg>/files/` to `dist/assets/fonts/`.
- `css` holds one `@font-face` per face (`font-display: swap`, `font-weight: 100 900`, `unicode-range`, absolute `/assets/fonts/` url) plus one metric fallback face per family (`src: local("Arial")` with `size-adjust`, `ascent-override`, `descent-override`, `line-gap-override` from `FONTS[*].metrics`).
- `build.js` replaces `/* @fonts */` with `plan.css` and sets global data `fontPreload`.

- [ ] **Step 1: Failing tests**

```js
// engine/tools/test/build-fonts.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fontPlan, copyFonts } from "../build-fonts.js";

test("a Latin-only site ships latin and latin-ext subsets of the brand font and preloads latin", () => {
  const plan = fontPlan({ font: "inter" }, ["en", "de"]);
  assert.deepEqual(plan.faces.map((f) => f.subset).sort(), ["latin", "latin-ext"]);
  assert.match(plan.preload, /^\/assets\/fonts\/inter-latin-wght-normal\.woff2$/);
  assert.match(plan.css, /font-family: "Inter Variable";[\s\S]*unicode-range: U\+0000-00FF/);
  assert.match(plan.css, /font-family: "Inter Fallback";\s*src: local\("Arial"\);\s*size-adjust: 107\.12%/);
  assert.match(plan.css, /font-display: swap/);
});

test("an Arabic locale adds the Arabic script font with its own unicode-range", () => {
  const plan = fontPlan({ font: "inter" }, ["en", "ar"]);
  const arabic = plan.faces.filter((f) => f.pkg === "noto-sans-arabic");
  assert.deepEqual(arabic.map((f) => f.subset), ["arabic"]);
  assert.match(plan.css, /font-family: "Noto Sans Arabic Variable";[\s\S]*unicode-range: U\+0600/);
  assert.equal(plan.faces.length, 3);
});

test("system font ships nothing", () => {
  const plan = fontPlan({ font: "system" }, ["en"]);
  assert.deepEqual(plan.faces, []);
  assert.equal(plan.preload, null);
  assert.equal(plan.css, "");
});

test("copyFonts copies the planned files", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "fonts-"));
  try {
    const plan = fontPlan({ font: "inter" }, ["en"]);
    copyFonts(plan, dir);
    for (const f of plan.faces) assert.ok(existsSync(path.join(dir, "assets", "fonts", f.file)), f.file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run → FAIL. Step 3: Implement**

```js
// engine/tools/build-fonts.js
import { readFileSync, mkdirSync, copyFileSync } from "node:fs";
import path from "node:path";
import { FONTS } from "./lib/theme.js";

const SCRIPT_SUBSETS = [[/^(ar|fa|ur)/, "arabic", "noto-sans-arabic"], [/^(ru|uk|bg|sr)/, "cyrillic", null], [/^el/, "greek", null], [/^vi/, "vietnamese", null]];

function facesFrom(pkg, subsets) {
  const css = readFileSync(path.join("node_modules", "@fontsource-variable", pkg, "index.css"), "utf8");
  const faces = [];
  for (const block of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const body = block[1];
    const file = /url\(\.\/files\/([^)]+?)\)/.exec(body)?.[1];
    const range = /unicode-range:\s*([^;]+);/.exec(body)?.[1].trim();
    const subset = file && /^[a-z0-9-]+?-([a-z-]+?)-wght-normal\.woff2$/.exec(file.replace(`${pkg}-`, ""))?.[1];
    if (!file || !subset || !file.endsWith("-wght-normal.woff2") || !subsets.includes(subset)) continue;
    faces.push({ family: FONTS[pkg].family, pkg, file, subset, unicodeRange: range });
  }
  return faces;
}

export function fontPlan(brand, locales) {
  const main = FONTS[brand.font] === undefined ? FONTS.inter : FONTS[brand.font];
  if (!main) return { faces: [], preload: null, css: "" };
  const faces = facesFrom(main.pkg, ["latin", "latin-ext"]);
  for (const [re, subset, pkg] of SCRIPT_SUBSETS) {
    if (!locales.some((l) => re.test(l))) continue;
    faces.push(...facesFrom(pkg || main.pkg, [subset]));
  }
  const families = [...new Set(faces.map((f) => f.pkg))];
  const css = faces.map((f) => `@font-face {\n  font-family: "${f.family}";\n  font-style: normal;\n  font-weight: 100 900;\n  font-display: swap;\n  src: url(/assets/fonts/${f.file}) format("woff2-variations");\n  unicode-range: ${f.unicodeRange};\n}`).join("\n")
    + "\n" + families.map((pkg) => { const m = FONTS[pkg].metrics; return `@font-face {\n  font-family: "${FONTS[pkg].family.replace(" Variable", "")} Fallback";\n  src: local("${FONTS[pkg].fallback}");\n  size-adjust: ${m.sizeAdjust};\n  ascent-override: ${m.ascent};\n  descent-override: ${m.descent};\n  line-gap-override: ${m.lineGap};\n}`; }).join("\n") + "\n";
  const latin = faces.find((f) => f.pkg === main.pkg && f.subset === "latin");
  return { faces, preload: latin ? `/assets/fonts/${latin.file}` : null, css };
}

export function copyFonts(plan, distDir) {
  const out = path.join(distDir, "assets", "fonts");
  mkdirSync(out, { recursive: true });
  for (const f of plan.faces) copyFileSync(path.join("node_modules", "@fontsource-variable", f.pkg, "files", f.file), path.join(out, f.file));
}
```

Check the subset regex against real file names (`inter-latin-wght-normal.woff2`, `inter-latin-ext-wght-normal.woff2`, `noto-sans-arabic-arabic-wght-normal.woff2`); adjust the regex until the first test passes.

- [ ] **Step 4: Wire into build.js** (`/* @fonts */` splice, `copyFonts`, `fontPreload` global via `process.env`-free path: write `engine/theme/.tmp/build-data.json` `{ fontPreload, themeColors }` before Eleventy runs and read it in `eleventy.config.js`; or compute the plan in `eleventy.config.js` directly from `site` — choose the latter: config imports `fontPlan` and sets `addGlobalData("fontPreload", plan.preload)`). Add `<link rel="preload" href="{{ fontPreload }}" as="font" type="font/woff2" crossorigin>` to the head when present.
- [ ] **Step 5: Tests PASS; build + offline gates green (budget counts the Latin file only for the English page). Commit** `feat(fonts): subset self-hosted variable fonts with metric fallbacks`

---

### Task 3: Icons (engine/icons.json, build-icons.js, icon macro)

**Files:**
- Create: `engine/icons.json`, `engine/tools/build-icons.js`, `engine/tools/test/build-icons.test.js`, `engine/catalog/primitives/icon.njk`
- Modify: `engine/tools/build.js`, `engine/catalog/templates/base.njk` (add `<!--sprite-->` before the script)

**Interfaces:**
- `engine/icons.json`: `["arrow-right","arrow-left","arrow-up","arrow-up-right","check","x","menu","search","chevron-down","chevron-right","chevron-left","chevron-up","globe","mail","phone","map-pin","calendar","clock","download","external-link","play","file-text","briefcase","users","building-2","factory","shield-check","zap","bar-chart-3","settings","cpu","layers","star","quote","info","circle-alert","circle-check","triangle-alert","loader-circle","plus","minus","filter","share-2","linkedin","twitter","youtube","github","sun","moon","languages","hand-helping","heart","thumbs-up","thumbs-down","copy","printer","tag","bookmark","rss","lock","eye","package","truck","wrench","gauge","line-chart","trending-up","award","leaf","handshake"]` (verify each exists in `node_modules/lucide-static/icons/`; replace any that does not).
- `symbol(name) → string` (`<symbol id="i-<name>" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">…paths…</symbol>`); throws `Unknown icon "<name>"` for names outside `icons.json`.
- `usedIcons(html) → string[]` from `href="#i-<name>"`.
- `injectSprites(distDir) → { pages, symbols }` replaces `<!--sprite-->` in each page with `<svg class="hidden" aria-hidden="true">…symbols for that page…</svg>` (or removes the placeholder when no icons); throws naming the page when a used icon is unknown.
- `icon.njk`: `{% macro icon(name, opts={}) %}<svg aria-hidden="true" class="{{ opts.size or 'size-5' }} shrink-0 {{ opts.class }}"><use href="#i-{{ name }}"></use></svg>{% endmacro %}`.

- [ ] **Step 1: Failing tests** (`symbol("arrow-right")` contains both path elements and no `class`/`width`; `symbol("nope")` throws; `usedIcons` dedupes; `injectSprites` on a temp dist with two pages gives each page only its own symbols and removes the placeholder on an icon-less page; a page using `#i-nope` makes `injectSprites` throw with the page path and the name; the output is byte-identical across two runs).
- [ ] **Step 2: Implement** (read SVG, strip the licence comment and the outer `<svg …>`/`</svg>`, keep inner elements trimmed; sort symbol names for determinism).
- [ ] **Step 3: build.js runs `injectSprites(dist)` after Tailwind (the sprite's `class="hidden"` must exist in the CSS: add `hidden` to the base template's always-present classes by using it on the sprite before Tailwind runs — i.e. inject sprites *before* the Tailwind step). Order in build.js: eleventy → fonts → sprites → theme splice → tailwind → images (Task 4).
- [ ] **Step 4: Tests PASS; gates green (Nu accepts `<svg class="hidden" aria-hidden="true">` with symbols; if Nu warns, switch to `width="0" height="0"` and record it). Commit** `feat(icons): per-page Lucide sprites from an allow-list`

---

### Task 4: Images (placeholder.js, build-images.js, picture/avatar/wordmark primitives)

**Files:**
- Create: `engine/tools/lib/placeholder.js`, `engine/tools/build-images.js`, `engine/tools/test/placeholder.test.js`, `engine/tools/test/build-images.test.js`, `engine/catalog/primitives/picture.njk`, `engine/catalog/primitives/avatar.njk`, `engine/catalog/primitives/wordmark.njk`
- Modify: `engine/tools/build.js`

**Interfaces:**
- `placeholderSvg({ slug, width, height, hue, accentHue }) → string`: deterministic (mulberry32 seeded from an FNV-1a hash of `slug`) gradient background (`oklch` brand hues) with 4–7 translucent circles and rounded rectangles; no text.
- Image file naming: `/assets/images/<slug>-<W>x<H>-<width>.<avif|webp>` where `WxH` is the ratio (`16x9`, `4x3`, `3x2`, `1x1`, `21x9`), widths from `[480, 768, 1200, 1600]` up to `max`.
- `picture.njk`: `{% macro picture(img, opts={}) %}` with `img = { slug, ratio: "16:9", alt, max: 1600 }`, `opts = { sizes, priority: false, class }` → `<picture>` with AVIF then WebP `<source srcset>` and `<img src=… width height alt loading="lazy"|fetchpriority="high" decoding="async" class="…">`; `width`/`height` from the ratio at the largest width.
- `avatar.njk`: `{% macro avatar(name, opts={size:"size-12"}) %}` inline SVG disc with initials, `aria-hidden="true"` (name is adjacent text).
- `wordmark.njk`: `{% macro wordmark(name) %}` inline SVG text in the site font, `role="img"` with `<title>` = name.
- `generateImages(distDir, brand) → { generated, skipped }`: scans HTML for image URLs matching the pattern, renders missing ones with sharp from `placeholderSvg` (AVIF quality 50, WebP quality 75, effort set for speed), skips existing files.

- [ ] **Step 1: Failing tests** (placeholder: same input → identical string, different slug → different string, contains `<svg` with the given width/height; build-images: a temp dist page referencing `hero-16x9-480.avif` and `.webp` gets both files, sizes 480×270, second run generates 0; an unknown ratio in a name is reported, not silently square).
- [ ] **Step 2: Implement.** sharp: `sharp(Buffer.from(svg)).avif({ quality: 50, effort: 4 })` / `.webp({ quality: 75 })`; render SVG at the target width (set the SVG's own width/height to the target so no resize is needed).
- [ ] **Step 3: Primitives** with anatomy blocks; `index.md` gains a hero image via `picture` to prove the pipeline (temporary until Task 9's hero section).
- [ ] **Step 4: build.js: `generateImages(dist, site.brand)` after Tailwind. Tests PASS; gates green (budget counts one AVIF candidate). Commit** `feat(images): deterministic placeholder pipeline, picture/avatar/wordmark primitives`

---

### Task 5: Head, favicons, social images, discovery files, error pages

**Files:**
- Create: `engine/tools/lib/ico.js`, `engine/tools/test/ico.test.js`, `engine/catalog/templates/_head.njk`, `engine/catalog/virtual/{sitemap.njk,robots.njk,security.njk,headers.njk,redirects.njk,root.njk,404.njk,500.njk}`
- Modify: `eleventy.config.js` (virtual templates, `noindex` front-matter support, `ogImage` computed), `engine/tools/build-images.js` (favicons + OG), `engine/catalog/templates/base.njk`, `engine/i18n/en.json`

**Interfaces:**
- `encodeIco(pngBuffers: {size, png}[]) → Buffer` (ICO header, directory entries, PNG payloads).
- `generateFavicons(distDir, { letter, hue })` → `/favicon.ico` (16, 32, 48), `/icon.svg` (letter on brand disc; `<style>@media (prefers-color-scheme: dark){…}</style>` inside the SVG), `/apple-touch-icon.png` (180, opaque), `/icon-192.png`.
- `generateOgImages(distDir)` reads `dist/og-manifest.json` (written by a virtual template: `[{ slug, title, site }]`), renders `/assets/og/<slug>.png` 1200×630 with gradient, title (≤ 2 lines, 56px), site name; deletes the manifest afterwards. The page's `ogImage` computed data is `/assets/og/<slug>.png` where slug = page url path slugified (`en-about` for `/en/about/`, `en` for `/en/`).
- `_head.njk` emits R-HTML-02's order using: `title`, `description`, `canonical`, `locale_links`, `feedUrl` (if set), `noindex`, `themeColors`, favicon links, `fontPreload`, stylesheet, OG (`og:type`, `og:title`, `og:description`, `og:url`, `og:site_name`, `og:locale`, `og:locale:alternate`×, `og:image`, `og:image:width`, `og:image:height`, `og:image:alt`), Twitter (`summary_large_image`, title, description, image), JSON-LD.
- Virtual templates (Eleventy 3 `eleventyConfig.addTemplate(name, content, data)`): `sitemap.xml` (all pages where `noindex` is not true, with `xhtml:link` alternates from `locale_links`, `lastmod` from `page.date`), `robots.txt`, `.well-known/security.txt` (Contact `mailto:security@example.com`-style from `site.json`, Expires one year ahead ISO, Preferred-Languages), `_headers` (R-DEPLOY-01 values), `_redirects` (`/ /<default>/ 301`), root `index.html` (meta refresh to default locale + visible link, `noindex`), `404.html` and `500.html` at root (default locale, `error.njk` template, `noindex`), and per-locale `/<locale>/404/`, `/<locale>/500/`.
- `og:locale` mapping: `en → en_GB`, `de → de_DE`, `ar → ar_SA`, else `xx_XX` from the tag.

- [ ] **Step 1: Failing tests** (`encodeIco` output starts with `00 00 01 00 03 00`, directory offsets point at the PNG payloads; a `schema-json`-style test for `_head` is done via the built page: build and assert the head element order with a small Node script in `build.test.js` — list of tag signatures in order).
- [ ] **Step 2: Implement all files. `error.njk`: shell with no nav JS, an `error-state` section (heading, text, search form, three links).**
- [ ] **Step 3: `npm run build` then full `npm run gate` (with Lighthouse): all green, the root redirect and error pages are noindex so SEO is skipped for them; links gate sees no broken links. Commit** `feat(shell): full head, favicons, social images, sitemap/robots/security/headers/redirects, error pages`

---

### Task 6: Primitives and the field system

**Files:**
- Create: `engine/catalog/primitives/{button,link,field,badge,tag,divider,kbd}.njk`, `engine/catalog/virtual/style-guide-foundations.njk`, `engine/catalog/virtual/style-guide-primitives.njk`
- Modify: `eleventy.config.js` (register style guide pages per locale with `noindex`), `engine/i18n/en.json` (`ui.*` keys: `ui.required`, `ui.optional`, `ui.opensNewTab`, `ui.close`, `ui.menu`, `ui.search`, `ui.skip`, `ui.backToTop`, `ui.fixFollowing`, `ui.sending`, `ui.privacyNote`)

**Macro contracts (each file has its anatomy block; classes per Global Constraints):**

| Macro | Signature | Markup essentials |
|---|---|---|
| `button(label, opts)` | `opts: { href, variant: primary\|secondary\|ghost\|link, size: sm\|md\|lg, icon, iconEnd, type, attrs: {} , external }` | `<a>` when `href`, else `<button type>`; `data-component="button" data-variant`; primary `bg-brand-600 text-ink-inverse hover:bg-brand-700`; secondary `border border-line-strong text-ink hover:bg-surface-alt`; ghost `text-ink hover:bg-surface-alt`; link `text-brand-700 underline-offset-4 hover:underline min-h-0 px-0`; sm `min-h-9 px-4 text-sm`, lg `min-h-12 px-6 text-lg`; `motion-safe:transition-colors motion-safe:duration-150`; external adds icon + `<span class="sr-only">{{ "ui.opensNewTab" \| t }}</span>` and `rel="noopener"` |
| `link(label, href, opts)` | `opts: { external, class }` | prose style per R-TYPO-08 |
| `field(f)` | `f: { type: text\|email\|tel\|url\|number\|textarea\|select\|checkbox\|radio\|switch\|file, name, id, label, help, error, required, autocomplete, inputmode, placeholder, value, options[], accept, maxSize, attrs }` | `<div data-component="field">` + `<label for>` (+ `(required)` text) + control per type (`user-invalid:border-danger-strong`, `aria-describedby` listing help/error ids that exist) + `<p id="…-help" class="mt-2 text-sm text-ink-muted">` + `<p id="…-error" class="mt-2 text-sm text-danger-strong">` only when `error` |
| `badge(label, opts)` | `opts: { tone: neutral\|brand\|success\|warning\|danger }` | `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide` |
| `tag(label, href)` | | `rounded-md bg-surface-alt px-2 py-1 text-sm` as `<a>` or `<span>` |
| `divider()` | | `<hr class="border-line">` |
| `kbd(label)` | | `<kbd class="rounded-sm border border-line-strong bg-surface-alt px-1.5 text-xs">` |

- [ ] **Step 1: Write `style-guide-primitives.njk`** first: it renders every macro in every variant and state (disabled, error, with icon, external, each field type including an error-summary example). This is the failing "test": the page does not build until the macros exist.
- [ ] **Step 2: Implement the macros; `style-guide-foundations.njk` shows role colour swatches (both schemes side by side via `scheme-light`/`scheme-dark` wrappers — verify Tailwind emits `scheme-light`/`scheme-dark`; else omit the dark preview), the type scale (R-TYPO-04), spacing steps, radius, shadows, motion tokens.**
- [ ] **Step 3: Build; `--skip lighthouse` gates green on `/en/style-guide/` and `/en/style-guide/primitives/`; fix until green. Commit** `feat(catalog): primitives and the field system; style guide foundations and primitives pages`

---

### Task 7: Shell components and enhance.js

**Files:**
- Create: `engine/catalog/components/{header,nav-menu,mobile-drawer,locale-switcher,search-box,announcement-bar,breadcrumbs,footer,skip-link,back-to-top}.njk`
- Modify: `engine/catalog/templates/base.njk`, `engine/scripts/enhance.js`, `sites/reference/site.json` (`nav`, `footer`, `social` data), `engine/i18n/en.json`, `engine/tools/test/build.test.js` (enhance.js ≤ 2048 B minified: minify with a tiny whitespace/comment strip in `build.js` or ship it hand-minified; assert `statSync(dist/assets/enhance.js).size <= 2048`)

**Contracts:**

| Component | Essentials |
|---|---|
| `header(site, page)` | `<header class="sticky top-0 z-10 h-16 border-b border-line bg-surface/90 backdrop-blur" data-component="header">`, variants `default`, `transparent` (over hero: `absolute inset-x-0 top-0 bg-transparent border-0 text-ink-inverse`), compact-on-scroll via `sda:` scroll timeline on the inner height (skip if it needs non-compositor properties: then no compaction); logo wordmark link to `/<locale>/`, `nav-menu`, locale switcher, search trigger, primary CTA (`site.cta`), mobile menu button `popovertarget="drawer"` (`lg:hidden`) |
| `nav-menu(items, locale)` | `<nav aria-label="{{ 'nav.primary' \| t }}">` `<ul class="hidden lg:flex gap-1">`; items with `children` render a `button popovertarget="menu-<i>"` + `<div popover id="menu-<i>" class="… motion-safe:transition-discrete … starting:open:…">` mega panel (2–3 columns of links with short descriptions); `aria-current="page"` on the active link |
| `mobile-drawer(items)` | `<div popover id="drawer" class="h-full w-80 max-w-full ms-auto bg-surface-raised …">` with the nav as `<details name="mobile-nav">` groups, locale links, CTA; close button `popovertarget="drawer" popovertargetaction="hide"` |
| `locale-switcher(alternates)` | `button popovertarget="locales"` with `icon("languages")` + current native name; popover `<ul>` of links `hreflang lang` native names |
| `search-box(locale)` | `<form role="search" method="get" action="/<locale>/search/">` with `field({type:"search"…})` (`role="search"` on `<search>`? Use the HTML `<search>` element — verify Nu accepts it; else `form role="search"`) |
| `announcement-bar(text, href)` | `bg-brand-700 text-ink-inverse text-sm py-2` single line, dismissible only via its link (no JS) |
| `breadcrumbs(items)` | `<nav aria-label="{{ 'nav.breadcrumbs' \| t }}"><ol class="flex flex-wrap gap-2 text-sm">` last item `aria-current="page"` |
| `footer(site, locale)` | 4 link columns from `site.footer`, newsletter mini form, legal row (© year, legal links, locale switcher), social icon links with `sr-only` names |
| `skip-link()` | first in body |
| `back-to-top()` | `<a href="#main" class="… print:hidden">` placed before the footer |

`enhance.js` (final, ≤ 2 KB):

```js
const d=document,h=d.documentElement;h.dataset.js="";
if(!CSS.supports("animation-timeline: view()")&&"IntersectionObserver"in window){const o=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){e.target.dataset.revealed="";o.unobserve(e.target)}},{rootMargin:"0px 0px -10% 0px"});d.querySelectorAll("[data-reveal]").forEach(el=>o.observe(el))}
if(!("command"in HTMLButtonElement.prototype))d.addEventListener("click",e=>{const b=e.target.closest("button[commandfor]");if(!b)return;const t=d.getElementById(b.getAttribute("commandfor"));if(!(t instanceof HTMLDialogElement))return;const c=b.getAttribute("command");c==="show-modal"?t.showModal():c==="close"&&t.close()});
```

- [ ] **Step 1: Write the test additions (enhance size; built page contains `<header`, `<nav aria-label=`, `popovertarget="drawer"`, exactly one `<main`).**
- [ ] **Step 2: Implement components, wire into `base.njk`, add nav/footer data to `site.json` and `en.json` keys.**
- [ ] **Step 3: Build; `--skip lighthouse` gates green. Manual check in the browser pane: Tab to the menu button, Enter opens the mega menu, Escape closes and focus returns, with `enhance.js` removed from a copy of the page. Record the result in the ledger line. Commit** `feat(catalog): header, navigation popovers, drawer, locale switcher, footer; final enhance.js`

---

### Task 8: Components

**Files:** `engine/catalog/components/*.njk` (one per row), `engine/catalog/virtual/style-guide-components.njk` (+ `-2` if over budget), `engine/i18n/en.json` keys.

| Component | Macro | Essentials |
|---|---|---|
| card | `card(c, opts)` | `relative rounded-lg border border-line bg-surface-raised p-6 shadow-sm motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md`; heading level param (`opts.level`, default 3); whole-card link via `after:absolute after:inset-0`; variants `case-study` (logo wordmark, metric, quote), `team` (avatar, name, role), `office` (city, address, phone), `download` (type badge, pages, button), `event` (date block, type, location), `job` (title, team, location, type), `integration` (icon tile, name), `article` (picture, eyebrow, title, date, excerpt), `service` (icon, title, text, link) |
| stat | `stat(s)` | value `text-4xl font-bold tabular-nums` + label; optional trend badge |
| testimonial | `testimonial(t, opts)` | `<figure>` + `<blockquote>` + `<figcaption>` (avatar, name, role, wordmark); variants `single`, `compact` |
| pricing-table | `pricingTable(p)` | 2–4 tiers in a grid; recommended tier `border-brand-600` + badge text "Most popular"; feature list with check icons; price `tabular-nums`; CTA per tier |
| comparison-table | `comparisonTable(c)` | `<table>` with `caption`, `th scope="col"`, check/x icons with `sr-only` text, recommended column marked by text |
| data-table | `dataTable(t)` | `caption`, `th scope`, `overflow-x-auto` wrapper, zebra via `even:bg-surface-alt` |
| accordion | `accordion(items, opts)` | `<details name="…">` per item, `summary` with heading text + chevron icon rotated via `group-open:rotate-180`; variant `faq` adds `data-component` and FAQ copy limits |
| tabs | `tabs(items)` | same element as accordion, `md:flex` summaries row; documented as "disclosure tabs" |
| steps | `steps(items)` | `<ol>` numbered discs, connector line via `before:` pseudo on `md:` |
| timeline | `timeline(items)` | `<ol>` with `<time>`, vertical line `border-s border-line` |
| callout | `callout(text, opts)` | tones info/success/warning/danger with icon and `role="note"` only when tone is info (else no role) |
| blockquote | `blockquote(q, cite)` | `border-s-4 border-brand-600 ps-6 text-xl` |
| code-block | `codeBlock(code, lang)` | `<pre><code class="language-x">` escaped, `overflow-x-auto` |
| image-gallery | `gallery(images)` | `<ul class="grid md:grid-cols-3 gap-6">` of `picture` with `figcaption` |
| video-facade | `videoFacade(v)` | poster `picture` + play `button command="show-modal" commandfor="video-<id>"` + `<dialog id closedby="any"?>` (omit `closedby`) containing a `<template>` with the iframe markup and a note "Loads from {provider}" — the iframe is never in the live DOM in the mockup |
| map-facade | `mapFacade(m)` | static placeholder image + address + "Open in maps" external link listed in `allowedExternal` or rendered as a non-link address when not allowed |
| author-box | `authorBox(a)` | avatar, name, role, bio ≤ 40 words, link to author page |
| share-links | `shareLinks(url, title)` | copy-free: links to `mailto:` and social share URLs are external → render as `button` with `sr-only` labels marked "placeholder" (no external requests) |
| tag-list | `tagList(tags)` | `<ul class="flex flex-wrap gap-2">` of `tag` |
| pagination | `pagination(p)` | `<nav aria-label>` prev/next + numbered links, `aria-current="page"` |
| toc | `toc(headings)` | `<nav aria-label>` sticky on `lg:` |
| sidebar-nav | `sidebarNav(items)` | `<nav aria-label>` with `aria-current` |
| sub-nav | `subNav(items)` | sticky under header `top-16 z-10`, horizontal scroll |
| filter-bar | `filterBar(filters)` | `<form method="get">` of selects + submit |
| search-results | `searchResults(r)` | list of results; `empty-state` when none |
| empty-state | `emptyState(e)` | icon, heading, text, one button |
| error-state | `errorState(e)` | for 404/500: heading, text, search box, three links |
| skeleton | `skeleton(kind)` | `animate-pulse` blocks (allowed loop), `aria-hidden` |
| toast | `toast(t)` | `<div role="status" aria-live="polite" class="fixed bottom-4 end-4 z-50 …">` static example |
| dialog | `dialog(id, content, opts)` | `<dialog id class="… backdrop:bg-ink/60 …">` + `<form method="dialog"><button>Close</button></form>` first? No: close button last; entrance per R-MOT-06 |
| drawer | `drawer(id, content)` | popover panel from the inline-end edge |
| tooltip | `tooltip(id, text)` | `popover="hint"` opened by `popovertarget` on hover? Hover cannot open popovers without JS: render as a `button popovertarget` (click) with `title`-free text; document the limitation |
| progress | `progress(value, max, label)` | `<progress>` styled minimally + text |
| consent-banner | `consentBanner()` | catalog only; `hidden` by default with the R-DEPLOY-09 note |
| consent-preferences | `consentPreferences()` | dialog with category switches |
| was-this-helpful | `wasThisHelpful()` | two buttons as GET links to `?helpful=yes/no` on the same page (no JS) |
| error-summary | `errorSummary(errors)` | `<div tabindex="-1" class="rounded-lg border border-danger-strong bg-danger-soft p-4">` heading + links |
| logo-wordmark | `logo(site)` | site wordmark link |
| prose | `prose(html)` | wrapper applying R-TYPO-04 to children via `[&_h2]:…`, `[&_p]:…`, `[&_a]:…`, `[&_ul]:…`, `[&_blockquote]:…`, `[&_table]:…` |

- [ ] **Step 1: Write `style-guide-components.njk`** rendering every component in every variant and state (the failing test).
- [ ] **Step 2: Implement the macros, grouped in commits of ~10 (cards+stats+testimonial+pricing+tables; disclosure+steps+timeline+callout+quote+code+gallery; facades+author+share+tags+pagination+toc+navs+filter+search; states+toast+dialog+drawer+tooltip+progress+consent+helpful+summary+prose).**
- [ ] **Step 3: After each group: build + `--skip lighthouse` gates green; split the style-guide components page when HTML > 50 KB. Commit per group** `feat(catalog): components — <group>`

---

### Task 9: Sections and the dispatcher

**Files:** `engine/catalog/sections/*.njk`, `engine/catalog/sections/_render.njk`, `engine/catalog/samples.json`, `engine/catalog/virtual/style-guide-sections.njk` (+ `-2`), `engine/catalog/templates/page.njk`, `sites/reference/content/en/index.md` (becomes a sections-driven home page)

Section list (file name = `type`; all take `s = { eyebrow, title, lede, items, cta, surface, image, … }`): `hero` (variants centered, split, video, form, stats), `page-header`, `logo-cloud`, `feature-grid`, `feature-rows`, `stats`, `testimonials` (single/grid/carousel), `cta-band`, `newsletter`, `contact-form`, `team-grid`, `team-preview`, `person-bio`, `office-cards`, `office-detail`, `map-facade`, `service-cards`, `product-cards`, `industry-cards`, `pricing`, `comparison`, `faq-groups`, `faq` (single group), `steps`, `timeline`, `values-grid`, `awards`, `case-study-cards`, `article-cards`, `press-cards`, `download-cards`, `download-detail`, `gated-form`, `event-cards`, `event-detail`, `registration-form`, `speakers`, `job-list`, `job-detail`, `apply-form`, `benefits-grid`, `integration-grid`, `resource-tabs`, `glossary-list`, `help-categories`, `search-box`, `search-results`, `sitemap-list`, `prose` (section wrapper for article bodies), `article-meta`, `author-box`, `related-items`, `related-articles`, `media-contact`, `media-kit-cta`, `contact-card`, `badges`, `image-gallery`, `confirmation`, `error-state`, `resources-latest`, `pagination`, `filter-bar`, `toc`, `share-links`, `was-this-helpful`, `sidebar-nav`, `style-guide-sections` (meta).

- `_render.njk`: `{% macro section(s, ctx) %}{% if s.type == "hero" %}{{ hero(s, ctx) }}{% elif … %}{% else %}{{ throwUnknownSection(s.type) }}{% endif %}{% endmacro %}` where `throwUnknownSection` is a filter/global that throws (unknown section = build error, R-SEC-12).
- `page.njk`: `{% extends "templates/base.njk" %}`; body = breadcrumbs (when `pageType != home`) + `{% for s in sections %}{{ section(s, ctx) }}{% endfor %}`; alternation of `bg-surface`/`bg-surface-alt` computed by position unless the section sets `surface`; reveal classes added to sections after the first (R-SEC-10) via a shared `reveal` macro string.
- `samples.json`: realistic fictional sample data for every section (Northwind Dynamics), reused by the style guide and as defaults for the reference site in phase 4.

- [ ] **Step 1: `style-guide-sections.njk` renders every section with its sample (failing test); `index.md` front matter becomes `sections: [...]` using samples.**
- [ ] **Step 2: Implement sections in groups (hero+headers+marketing; cards+lists; forms; article/resource; utility), build + gates after each. Commit per group** `feat(catalog): sections — <group>`
- [ ] **Step 3: Full gate with Lighthouse on `/en/` and the style-guide pages: 100 × 4 (SEO n/a on the style guide). Commit** `feat(catalog): sections-driven home page green on all gates`

---

### Task 10: Schema per page type, breadcrumbs, templates

**Files:**
- Create: `engine/tools/test/schema-json.test.js`, `engine/catalog/templates/article.njk`
- Modify: `eleventy.config.js` (`schemaJson` → per-type graph; `breadcrumbs` computed; `formatDate`/`formatNumber` filters; `entity` front matter)

**Interfaces:**
- `schemaJson(site, data)` builds: organization, website (+ `SearchAction` when a search page exists in `site.pages` or `data.collections`), page node typed by `PAGE_TYPES[pageType]` (`about → AboutPage`, `contact → ContactPage`, `collection/blog/team/locations/services… → CollectionPage`, `person/author → ProfilePage`, `search → SearchResultsPage`, `faq → FAQPage`, else `WebPage`), `BreadcrumbList` from `data.breadcrumbs` (non-home), and an entity node from `data.entity` when present: `{ "@type": ENTITY_TYPES[pageType], … }` with absolute URL fields and `@id` `{canonical}#entity`, linked from the page node as `mainEntity`.
- `breadcrumbs` computed: `[{ name, url }]` from the URL segments; names resolved from the sibling page's `title` in `collections.all` by URL, else the slug title-cased; the last item is the page itself.
- Filters: `formatDate(iso, locale)` via `Intl.DateTimeFormat(locale, { dateStyle: "long", numberingSystem: site.numberingSystem?.[locale] })`; `formatNumber(n, locale)`; `formatCurrency(n, locale, code)`.
- `article.njk`: page-header, article-meta, `prose(content)`, author box, related items; used by post, press-release, doc, case-study.

- [ ] **Step 1: Failing unit tests for `schemaJson` and `breadcrumbs` per page type (home → no breadcrumb; about → AboutPage + BreadcrumbList with 2 items; job with `entity` → JobPosting node referenced by `mainEntity` with absolute `url`; search page → `SearchAction`).**
- [ ] **Step 2: Implement; run the schema gate on the style guide and home. Commit** `feat(schema): per-page-type graphs, breadcrumbs, locale formatting filters, article template`

---

### Task 11: Automated checks for formerly manual rules, bylaw gate sweep, full gate, review

**Files:**
- Modify: `engine/tools/gates/consistency.js` (+ checks `logical-props`, `motion-safe`, `no-arbitrary-lengths`, `no-hash-links`, `img-attrs`, `head-order`, `meta-length`), `engine/tools/test/gate-consistency.test.js`, bylaws `01`, `02`, `03`, `06`, `10`, `19` (Gate lines → the new checks; R-GATE-13 trimmed), `engine/CHANGELOG.md` (0.2.0)

- [ ] **Step 1: Failing tests, one fixture per check** (`pl-4` → logical-props; `animate-fade` without `motion-safe:` → motion-safe; `p-[13px]` → no-arbitrary-lengths while `[animation-timeline:view()]` passes; `href="#"` → no-hash-links; `<img>` without width → img-attrs; description 300 chars → meta-length; stylesheet before canonical → head-order).
- [ ] **Step 2: Implement; sweep Gate lines; bylaws lint green.**
- [ ] **Step 3: Full gate (Lighthouse) on every page; commit `reports/latest.md`. Commit** `feat(gates): seven consistency checks replace manual items; bylaws 0.2.0`
- [ ] **Step 4: Whole-branch review (fresh reviewer) → fix pass → stop for the phase-4 go-ahead.**

---

## Self-review notes

- Spec §4.4 tokens (T1), §4.8 assets (T2–T5), §4.9 head (T5), §4.5 motion and §4.6 primitives (T6–T9), §4.7 script (T7), §4.3 data flow (T9–T10). Reference site in three locales and checklists/README are phase 4–5.
- Review Focus 1–5 have tests in T1, T2, T3, T4 and a recorded manual check in T7.
- Ruling carried from the spec: one data-driven `page.njk` plus `article.njk` and `error.njk` instead of one template per page type; the page type lives in front matter and drives schema, breadcrumbs and section rules. Recorded in the ledger at T9.
