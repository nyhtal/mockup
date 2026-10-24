# Animated Home Hero Art Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The reference home hero's planes-flow art becomes an inline SVG twin whose bands glide slowly on a 30 s loop, with a pause switch, still under reduced motion and in print.

**Architecture:** `engine/tools/lib/art-flow.js` draws planes-flow as SVG from geometry measured off the source raster, coloured through the same dark ramp the raster uses. The backdrop hero renders it in place of the `<picture>` when the image declares `animate`. One `flow` keyframe and one `art-flow` utility in `app.css` move three groups along x; a CSS-only checkbox pauses them.

**Tech Stack:** Node (ESM, `node:test`), Eleventy 3 + Nunjucks, Tailwind 4 (`@theme`, `@utility`), sharp (fidelity test only).

**Spec:** `docs/superpowers/specs/2026-10-23-animated-home-hero-art-design.md`

## Global Constraints

- Only `translate` animates (R-MOT-01); every animation sits inside `@media screen and (prefers-reduced-motion: no-preference)` (R-MOT-02); print and reduced motion show the rest frame.
- No inline `style` attribute and no `<style>` element anywhere (CSP `style-src 'self'`, R-PREC-07).
- Cycle 30 s, `ease-in-out`, infinite; travel at most half a grid module (70 px at 1672 wide); the first frame is the composition at rest.
- `animate` is valid only on a `hero` with `variant: "backdrop"` whose art is `planes-flow` (or unset, which defaults to planes-flow); anything else fails the build naming the page.
- The pause control is a `<input type="checkbox" role="switch">` with visible text from `ui.pauseAnimation`, at least 44 px tall, hidden under `motion-reduce:` and `print:`; `enhance.js` is untouched.
- Every locale (en, de, ar, ja) gets the same declaration and string; `_template.json` gets the empty key.
- Bylaws version 0.21.0 (minor); decision D62.

## Review Focus

1. A different brand hue: the SVG must take the site's `brand.hue` / `brand.accentHue` (defaults 250 / `hue`, as `build-images.js` line 161), not hard-coded colours. Pinned in Task 1 (two hues give different fills).
2. RTL (ar): the wrapper's `rtl:-scale-x-100` must mirror the SVG and its motion, the switch must sit at the inline end. Pinned in Task 4 (ar page assertions).
3. Motion offsets exposing a hidden edge (the ribbon leg's bottom, the line ends): the groups that touch must move together. Pinned in Task 1 by rendering the composition with each group shifted to its extreme and checking no pixel of the hole region changes class (body moves as one group; lines' hidden ends stay covered).
4. The style guide image-map demo losing its AVIF once the hero stops referencing it. Pinned in Task 4 (`home-backdrop-16x9-768.avif` still exists, demo carries `data-art`).
5. `animate` copied onto another section by a later brief. Pinned in Task 2 (build fails with the page URL).

---

### Task 1: The vector twin

**Files:**
- Create: `engine/tools/lib/art-flow.js`
- Test: `engine/tools/test/art-flow.test.js`

**Interfaces:**
- Produces: `export const FLOW_GREYS = [4, 56, 118, 214, 233]` (ground, dark band, mid band, channel line, white), `export function flowTones(hue, accentHue)` → five `#rrggbb` strings, `export function planesFlowSvg({ tones, className = "", shift = {} })` → SVG string. `shift` is `{ body, lines, trail }` in px (for tests only; the site never passes it).

Geometry, measured from `engine/art/planes-flow.webp` (1672 × 941): the white ribbon's outer corner is centred (1172, 367) with r 180 and its inner corner (1203, 376) with r 83, 72 and 60 for the channel and the thin white line; the mid band's outer turn is centred (988, 532) with r 167; the dark band's bottom-start corner is centred (1107, 600) with r 115 and its top edge is the S-curve from (992, 503) to (1095, 563); the thin line around that corner is the annulus r 124–136 about (1107, 600), cut at 125.4°.

- [ ] **Step 1: Write the failing test**

```js
// engine/tools/test/art-flow.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { FLOW_GREYS, flowTones, planesFlowSvg } from "../lib/art-flow.js";

sharp.cache(false);
const grey = (g) => "#" + g.toString(16).padStart(2, "0").repeat(3);
const greys = FLOW_GREYS.map(grey);

async function raster(svg) {
  const { data } = await sharp(Buffer.from(svg)).resize(1672, 941).greyscale().raw().toBuffer({ resolveWithObject: true });
  return data;
}

test("the twin is deterministic, carries no style, and groups its moving parts", () => {
  const a = planesFlowSvg({ tones: flowTones(250, 160), className: "x" });
  assert.equal(a, planesFlowSvg({ tones: flowTones(250, 160), className: "x" }));
  assert.doesNotMatch(a, /style/);
  assert.match(a, /^<svg [^>]*viewBox="0 0 1672 941"[^>]*preserveAspectRatio="xMidYMid slice"[^>]*class="x"/);
  for (const g of ["lines", "trail", "body"]) assert.match(a, new RegExp(`<g data-flow="${g}">`));
});

test("the twin takes the brand hues (Review Focus 1)", () => {
  assert.notDeepEqual(flowTones(250, 160), flowTones(25, 60));
  assert.equal(flowTones(250, 160).length, 5);
  assert.ok(flowTones(250, 160).every((t) => /^#[0-9a-f]{6}$/.test(t)));
});

test("at rest the twin matches the planes-flow raster", async () => {
  const src = await sharp("engine/art/planes-flow.webp").greyscale().raw().toBuffer();
  const out = await raster(planesFlowSvg({ tones: greys }));
  let sum = 0, off = 0;
  for (let i = 0; i < src.length; i++) {
    const d = Math.abs(src[i] - out[i]);
    sum += d;
    if (d > 48) off++;
  }
  assert.ok(sum / src.length <= 4, `mean difference ${(sum / src.length).toFixed(2)} > 4`);
  assert.ok(off / src.length <= 0.02, `${((100 * off) / src.length).toFixed(2)} % of pixels differ by more than 48 levels`);
});

test("at the extremes of the loop no hidden end shows (Review Focus 3)", async () => {
  // The worst relative offsets of the loop: the lines and the trail up to 40 px, the body up to 24 px, in any combination.
  for (const shift of [{ body: -24 }, { lines: -40, trail: -40 }, { body: -24, lines: -40, trail: -40 }, { body: -24, lines: -40 }, { trail: -40 }]) {
    const b = shift.body || 0;
    const out = await raster(planesFlowSvg({ tones: greys, shift }));
    const at = (x, y) => out[y * 1672 + x];
    // The channel pair ends under the ribbon's leg: across the leg at the channels' height it stays white.
    for (const y of [336, 359]) for (let x = 1010 + b; x <= 1090 + b; x += 2) assert.ok(at(x, y) > 200, `shift ${JSON.stringify(shift)}: a channel end shows on the leg at ${x},${y}`);
    // The trail pair starts under the mid band's leg: from that leg's edge it runs unbroken (no start, no gap, in view).
    for (const y of [531, 557]) for (let x = 1160 + b; x <= 1400; x += 2) assert.ok(at(x, y) > 165 && at(x, y) < 245, `shift ${JSON.stringify(shift)}: the trail breaks at ${x},${y}`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test engine/tools/test/art-flow.test.js`
Expected: FAIL, `Cannot find module '../lib/art-flow.js'`.

- [ ] **Step 3: Write the implementation**

```js
// engine/tools/lib/art-flow.js
/**
 * The flowing twin of planes-flow (R-ASSET-05, D62): the art library's piece redrawn as SVG from geometry measured off
 * engine/art/planes-flow.webp (1672 × 941), in the five greys of the source recoloured through the same dark ramp the
 * raster takes, so at rest it is the picture. Three groups move along x under the art-flow utility (app.css): the body
 * (ribbon, mid band, dark band and the line around its corner, which must move as one or a hidden edge shows), the
 * channel pair at the start and the trail pair in the ribbon's hole. No text, no style.
 */
import { ramp } from "./art.js";

/** Source greys: ground, dark band, mid band, channel line, white ribbon. */
export const FLOW_GREYS = [4, 56, 118, 214, 233];

/** The five greys through the dark ramp of the site's hues, as hex. */
export function flowTones(hue = 250, accentHue = hue) {
  const lut = ramp("dark", hue, accentHue);
  return FLOW_GREYS.map((g) => "#" + [0, 1, 2].map((c) => lut[g * 3 + c].toString(16).padStart(2, "0")).join(""));
}

const E = 1772; // bands run past the end edge so a glide never shows their end

/** The SVG; `shift` offsets groups (tests only: the site moves them with CSS). */
export function planesFlowSvg({ tones, className = "", shift = {} }) {
  const [ground, dark, mid, line, white] = tones;
  const at = (k) => (shift[k] ? ` transform="translate(${shift[k]} 0)"` : "");
  const lines = [
    `<rect x="645" y="330.5" width="425" height="13" fill="${line}"/>`,
    `<rect x="645" y="354" width="425" height="11" fill="${line}"/>`,
  ];
  const trail = [
    `<rect x="1100" y="524" width="${E - 1100}" height="15" fill="${line}"/>`,
    `<rect x="1100" y="551" width="${E - 1100}" height="12" fill="${line}"/>`,
  ];
  const body = [
    // The white ribbon: a band from the end edge turning down through a quarter-turn into a leg that runs under the mid band.
    `<path d="M992 640V367A180 180 0 0 1 1172 187H${E}V293H1203A83 83 0 0 0 1120 376V640Z" fill="${white}"/>`,
    `<path d="M${E} 293H1203A83 83 0 0 0 1120 376V640H1131V376A72 72 0 0 1 1203 304H${E}Z" fill="${mid}"/>`,
    `<path d="M${E} 304H1203A72 72 0 0 0 1131 376V640H1143V376A60 60 0 0 1 1203 316H${E}Z" fill="${white}"/>`,
    // The line of light around the dark band's corner, its top under the mid band.
    `<path d="M971 470V600A136 136 0 0 0 1028.2 710.9L1035.2 701.1A124 124 0 0 1 983 600V470Z" fill="${line}"/>`,
    // The mid band: in from the start, turning down at the junction; its leg runs under the dark band.
    `<path d="M645 365H988A167 167 0 0 1 1155 532V640H1000V504H645Z" fill="${mid}"/>`,
    // The dark band: its top rises in an S to meet the mid band, its bottom-start corner rounded.
    `<path d="M992 503C1035 503 1045 563 1095 563H${E}V715H1107A115 115 0 0 1 992 600Z" fill="${dark}"/>`,
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1672 941" preserveAspectRatio="xMidYMid slice"${className ? ` class="${className}"` : ""}>`
    + `<rect x="-100" y="-100" width="${E + 200}" height="1141" fill="${ground}"/>`
    + `<g data-flow="lines"${at("lines")}>${lines.join("")}</g>`
    + `<g data-flow="trail"${at("trail")}>${trail.join("")}</g>`
    + `<g data-flow="body"${at("body")}>${body.join("")}</g>`
    + `</svg>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test engine/tools/test/art-flow.test.js`
Expected: PASS. If the fidelity test fails, render both to PNG in the scratchpad (`sharp(Buffer.from(svg)).png()` and the greyscale source), find the misplaced edge with a difference image, and correct the geometry in `art-flow.js`. Never loosen the thresholds.

- [ ] **Step 5: Commit**

```bash
git add engine/tools/lib/art-flow.js engine/tools/test/art-flow.test.js
git commit -m "feat(art): planes-flow vector twin measured off the raster"
```

### Task 2: The `animate` declaration and its guard

**Files:**
- Modify: `engine/tools/lib/sections.js` (in `planSections`, right after `const s = expand(raw, opts);`)
- Modify: `sites/reference/data/{en,de,ar,ja}/pages.json` (`sections["hero-home"].image`)
- Test: `engine/tools/test/sections-plan.test.js`

**Interfaces:**
- Produces: `s.image.animate === true` reaches the hero template only on a backdrop hero with planes-flow art; otherwise `planSections` throws `Error("<pageUrl>: image \"<slug>\" declares animate, which only a backdrop hero with the planes-flow art supports (R-ASSET-06)")`.

- [ ] **Step 1: Write the failing test** (append to `sections-plan.test.js`)

```js
test("animate is accepted only on a backdrop hero with the planes-flow art (Review Focus 5)", () => {
  const img = { slug: "home-backdrop", ratio: "16:9", art: "planes-flow", animate: true };
  assert.equal(planSections(samples, [{ type: "hero", variant: "backdrop", image: img }], opts)[0].s.image.animate, true);
  assert.equal(planSections(samples, [{ type: "hero", variant: "backdrop", image: { ...img, art: undefined } }], opts)[0].s.image.animate, true);
  assert.throws(() => planSections(samples, [{ type: "hero", variant: "split", image: img }], opts), /\/en\/about\/: image "home-backdrop" declares animate/);
  assert.throws(() => planSections(samples, [{ type: "hero", variant: "backdrop", image: { ...img, art: "planes-energy" } }], opts), /declares animate/);
  assert.throws(() => planSections(samples, [{ type: "feature-rows", image: img }], opts), /declares animate/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test engine/tools/test/sections-plan.test.js`
Expected: FAIL on the first `assert.throws` (nothing throws yet).

- [ ] **Step 3: Implement**

In `planSections`, after `const s = expand(raw, opts);`:

```js
    // The flowing art (D62): one piece has a vector twin, and only the backdrop hero draws it.
    if (s.image?.animate && !(s.type === "hero" && s.variant === "backdrop" && (s.image.art ?? "planes-flow") === "planes-flow")) {
      throw new Error(`${pageUrl}: image "${s.image.slug}" declares animate, which only a backdrop hero with the planes-flow art supports (R-ASSET-06)`);
    }
```

In each of the four `pages.json`, `sections["hero-home"].image` becomes `{ "slug": "home-backdrop", "ratio": "16:9", "art": "planes-flow", "animate": true }` (keep each locale's other fields as they are).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test engine/tools/test/sections-plan.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add engine/tools/lib/sections.js engine/tools/test/sections-plan.test.js sites/reference/data
git commit -m "feat(hero): animate declaration, backdrop + planes-flow only"
```

### Task 3: The motion CSS and its gate

**Files:**
- Modify: `engine/theme/app.css` (a `@utility art-flow` block after `lightbox-control`; `--animate-flow` and `@keyframes flow` in `@theme`)
- Modify: `engine/tools/gates/consistency.js` (`motionFindings`)
- Test: `engine/tools/test/gate-consistency.test.js`

**Interfaces:**
- Consumes: the `data-flow` groups of Task 1; `[data-flow-pause]` on the switch (Task 4).
- Produces: class `art-flow` (on the SVG); a motion-vocabulary finding `class "art-flow" outside a backdrop hero (R-MOT-03, D62)`.

- [ ] **Step 1: Write the failing gate test** (append to `gate-consistency.test.js`)

```js
test("art-flow moves only inside a backdrop hero (R-MOT-03, D62)", async () => {
  const { motionFindings } = await import("../gates/consistency.js");
  const { parse: parseHtml } = await import("node-html-parser");
  assert.deepEqual(motionFindings(parseHtml('<section data-component="hero" data-variant="backdrop"><div aria-hidden="true"><svg class="art-flow absolute"></svg></div></section>')), []);
  assert.ok(motionFindings(parseHtml('<section data-component="hero" data-variant="split"><svg class="art-flow"></svg></section>')).some((m) => /art-flow.*backdrop hero/.test(m)));
  assert.ok(motionFindings(parseHtml('<div><svg class="art-flow"></svg></div>')).some((m) => /art-flow.*backdrop hero/.test(m)));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test engine/tools/test/gate-consistency.test.js`
Expected: FAIL (no finding).

- [ ] **Step 3: Implement the gate rule** (inside the class loop of `motionFindings`, after the `range` check)

```js
      if (base === "art-flow" && !el.closest('[data-component="hero"][data-variant="backdrop"]')) out.push(`class "${c}" outside a backdrop hero (R-MOT-03, D62)`);
```

- [ ] **Step 4: Add the CSS**

In `@theme`, after `--animate-fade`:

```css
  /* The home hero's flowing art (R-MOT-03, D62): the one loop on a page, 30 s, eased both ways, paused by its switch. */
  --animate-flow: flow 30s ease-in-out infinite;
```

and after `@keyframes fade { … }`:

```css
  @keyframes flow {
    50% { translate: var(--flow-x) 0; }
  }
```

After the `lightbox-control` utility:

```css
/* The flowing art (R-MOT-03, R-MOT-11, D62): planes-flow's twin glides along x, the body as one, the two channel pairs further and a beat behind, so the light trails the bands. Screen and motion allowed only: print and reduced motion keep the composition at rest. The switch in the same hero pauses it. */
@utility art-flow {
  @media screen and (prefers-reduced-motion: no-preference) {
    & [data-flow] {
      animation: var(--animate-flow);
    }
    & [data-flow="body"] {
      --flow-x: -24px;
    }
    & [data-flow="lines"] {
      --flow-x: -40px;
      animation-delay: 1.5s;
    }
    & [data-flow="trail"] {
      --flow-x: -40px;
      animation-delay: 3s;
    }
    :where([data-component="hero"]:has([data-flow-pause]:checked)) & [data-flow] {
      animation-play-state: paused;
    }
  }
}
```

- [ ] **Step 5: Run the gate test**

Run: `node --test engine/tools/test/gate-consistency.test.js`
Expected: PASS. (The CSS is checked in Task 4's build test, once a page uses `art-flow`.)

- [ ] **Step 6: Commit**

```bash
git add engine/theme/app.css engine/tools/gates/consistency.js engine/tools/test/gate-consistency.test.js
git commit -m "feat(motion): flow keyframe and art-flow utility, gated to the backdrop hero"
```

### Task 4: The hero renders the twin and its pause switch

**Files:**
- Modify: `eleventy.config.js` (a Nunjucks global next to `unknownSection`)
- Modify: `engine/catalog/sections/hero.njk` (`artLayer`, `backdrop`, the header comment's `motion:` and `a11y:` lines)
- Modify: `engine/i18n/{en,de,ar,ja,_template}.json` (`ui.pauseAnimation`, after `playClip`)
- Modify: `engine/catalog/virtual/style-guide-components.njk:135` (the demo `img`)
- Modify: `engine/tools/test/build.test.js:143` (the backdrop depth assertion) and add a test

**Interfaces:**
- Consumes: `planesFlowSvg`, `flowTones` (Task 1); `s.image.animate` (Task 2); `art-flow` (Task 3).
- Produces: Nunjucks global `planesFlowSvg(className)` → SVG string in the site's hues.

- [ ] **Step 1: Write the failing build test** (replace the assertion at `build.test.js:143` and add a test after that one)

At line 143 replace the `<img…fetchpriority…>` assertion with:

```js
  assert.match(hero, /<svg [^>]*class="art-flow absolute inset-0 size-full md:motion-safe:sda:scale-115 md:motion-safe:sda:translate-y-4 md:motion-safe:sda:animate-parallax-md md:motion-safe:sda:\[animation-timeline:scroll\(root\)\] md:motion-safe:sda:\[animation-range:0_80vh\]"/, "the flowing art sinks on scroll(root), overscanned, at identity at rest");
```

New test:

```js
test("the home hero's art flows (D62): the twin in place of the picture, a pause switch, the demo AVIF still built", () => {
  const labels = { en: "Pause animation", de: "Animation anhalten", ar: "إيقاف الحركة مؤقتًا", ja: "アニメーションを一時停止" };
  for (const [lang, label] of Object.entries(labels)) {
    const home = readFileSync(`dist/reference/${lang}/index.html`, "utf8");
    const hero = /<section[^>]*data-component="hero"[\s\S]*?<\/section>/.exec(home)[0];
    assert.match(hero, /<div aria-hidden="true" class="absolute inset-0 -z-10 overflow-clip rtl:-scale-x-100"><svg [^>]*class="art-flow /, `${lang}: the twin sits in the mirrored art layer`);
    assert.doesNotMatch(hero, /<img/, `${lang}: no raster in the hero`);
    for (const g of ["lines", "trail", "body"]) assert.match(hero, new RegExp(`<g data-flow="${g}">`));
    assert.match(hero, new RegExp(`<label class="[^"]*absolute bottom-4 end-4[^"]*motion-reduce:hidden print:hidden[^"]*"><input type="checkbox" role="switch" data-flow-pause[^>]*><span>${label}</span></label>`), `${lang}: the pause switch`);
    assert.doesNotMatch(hero, /style=/, `${lang}: no inline style`);
  }
  const css = readdirSync("dist/reference/assets/css").map((f) => readFileSync(`dist/reference/assets/css/${f}`, "utf8")).join("");
  assert.match(css, /@keyframes flow/, "the keyframe ships");
  assert.match(css, /animation-play-state:\s*paused/, "the switch pauses it");
  assert.ok(existsSync("dist/reference/assets/images/home-backdrop-16x9-768.avif"), "the style guide's image-map demo keeps its AVIF (Review Focus 4)");
  assert.match(readFileSync("dist/reference/sys/style-guide/components/index.html", "utf8"), /home-backdrop-16x9-768\.avif"[^>]*data-art="planes-flow" data-tone="dark"/);
});
```

Before running, check the real CSS output folder and the components page path (`ls dist/reference/assets`, `ls dist/reference/sys/style-guide`) and correct the two paths in the test if they differ.

- [ ] **Step 2: Build and run to verify it fails**

Run: `npm run build; node --test engine/tools/test/build.test.js`
Expected: FAIL on the new assertions (the hero still renders an `img`).

- [ ] **Step 3: Implement**

`eleventy.config.js`, after the `unknownSection` global (import `planesFlowSvg, flowTones` from `./engine/tools/lib/art-flow.js` at the top):

```js
  // The flowing twin of planes-flow (D62) in the site's hues, for a backdrop hero whose image declares animate.
  const flowTonesForSite = flowTones(site.brand?.hue ?? 250, site.brand?.accentHue ?? site.brand?.hue ?? 250);
  eleventyConfig.addNunjucksGlobal("planesFlowSvg", (className) => planesFlowSvg({ tones: flowTonesForSite, className }));
```

`hero.njk`, `artLayer` becomes:

```njk
{% macro artLayer(s, ctx, defaultArt, tone="dark") %}
{%- set hd = ctx.flair and ctx.flair.parallaxHero -%}
{%- set depthClass = (" md:motion-safe:sda:scale-115 md:motion-safe:sda:translate-y-4" + depth('parallax-md', 'scroll(root)', '0_80vh') if hd else "") -%}
{%- set img = { slug: s.image.slug, ratio: s.image.ratio or "16:9", alt: "", max: 1600, art: s.image.art or defaultArt, tone: tone } -%}
<div aria-hidden="true" class="absolute inset-0 -z-10 overflow-clip rtl:-scale-x-100">
{%- if s.image.animate %}{{ planesFlowSvg("art-flow absolute inset-0 size-full" + depthClass) | safe }}
{%- else %}{{ picture(img, { priority: true, sizes: "(min-width: 48rem) 100vw, 200vw", class: "absolute inset-0 size-full object-cover" + depthClass }) }}{% endif -%}
</div>
{% endmacro %}
{#- The flowing art's pause switch (WCAG 2.2.2, D62): a checkbox the art-flow utility reads through :has(), so it works without script; nothing to pause under reduced motion or in print. -#}
{% macro flowPause(s) %}
{%- if s.image and s.image.animate %}<label class="absolute bottom-4 end-4 z-10 flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-brand-950/70 px-4 text-sm text-ink-inverse ring-1 ring-ink-inverse/25 motion-reduce:hidden print:hidden"><input type="checkbox" role="switch" data-flow-pause class="size-4 accent-accent-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-inverse"><span>{{ "ui.pauseAnimation" | t }}</span></label>{% endif -%}
{% endmacro %}
```

In `backdrop`, call `{{ flowPause(s) }}` as the last child of the inset frame (`<div class="relative isolate overflow-hidden rounded-3xl …">`, before its closing `</div>`) and as the last child of the non-inset `<section>` (before `</section>`).

Header comment: `motion:` gains "; a backdrop whose image declares `animate` draws planes-flow's SVG twin, which flows on a 30 s loop behind the words (D62)"; `a11y:` gains "; the flowing art has a pause switch (WCAG 2.2.2) in the bottom-end corner".

i18n, after `"playClip"` in each file: en `"pauseAnimation": "Pause animation"`, de `"Animation anhalten"`, ar `"إيقاف الحركة مؤقتًا"`, ja `"アニメーションを一時停止"`, `_template.json` `""`.

`style-guide-components.njk:135`: add `data-art="planes-flow" data-tone="dark"` to the demo `img` after its `class` attribute.

- [ ] **Step 4: Build and run**

Run: `npm run build; npm test`
Expected: all tests PASS. If `@keyframes flow` is missing from the CSS, Tailwind has dropped the keyframe because no `animate-flow` class is used: change the utility's `animation` to `flow 30s ease-in-out infinite` directly and keep the `@theme` token, then rebuild.

- [ ] **Step 5: Commit**

```bash
git add eleventy.config.js engine/catalog engine/i18n engine/tools/test/build.test.js
git commit -m "feat(hero): the home hero draws the flowing twin with a pause switch"
```

### Task 5: Bylaws, design notes and the record (0.21.0)

**Files:**
- Modify: `engine/bylaws/06-motion.md` (R-MOT-03, R-MOT-11), `engine/bylaws/02-tokens.md` (R-TOK-11, R-TOK-13), `engine/bylaws/00-precedence.md` (R-PREC-07), `engine/bylaws/17-assets.md` (R-ASSET-05, R-ASSET-06), `engine/DESIGN.md` (§3 motion table, §5), `engine/DECISIONS.md` (D62), `engine/CHANGELOG.md` (0.21.0), the bylaws version wherever 0.20.0 is recorded (`grep -rn "0\.20\.0" engine --include=*.md --include=*.json --include=*.js`), checklists regenerated.

- [ ] **Step 1: Edit the rules** (exact additions)

- R-MOT-03, "Nothing loops except `animate-pulse` on skeletons and `animate-spin` on a pending button" → append ", and the flowing art of a backdrop hero whose image declares `animate` (D62): 30 s, at most 40 px, paused by its switch".
- R-MOT-11, append: "One exception: the flowing art of a backdrop hero (D62) loops behind the words from first paint under `motion-safe`, starting from the composition at rest, with a pause switch (WCAG 2.2.2); its text column still never moves."
- R-TOK-11, append: "The flowing art's 30 s cycle (D62) is the one duration outside this list."
- R-TOK-13: "eleven" → "twelve"; add "Ambient: `flow` (translate along x to `--flow-x` and back, 30 s ease-in-out infinite, the flowing art of D62 only)." Checklist line "eleven animation tokens" → "twelve".
- R-PREC-07: in the exception list, after the carousel: "and for the flowing art (`art-flow`: per-group travel, delay and the `:has()` pause of D62, which no utility reaches)".
- R-ASSET-05: append "The one exception to raster art is planes-flow's SVG twin (`engine/tools/lib/art-flow.js`), drawn from geometry measured off the source and checked against it, for the flowing backdrop hero (D62)."
- R-ASSET-06: append "`\"animate\": true` draws that twin instead of the picture; only a backdrop hero with the planes-flow art may declare it, and any other use fails the build naming the page."
- DESIGN §3: add a row or sentence: the home hero's art flows slowly (30 s) as the one ambient motion, the words still. §5: one paragraph on the twin.
- D62 (owner, 2026-10-23: "animate the home page image"; chose "animate the shapes themselves", "slow continuous flow", "home hero only"): the twin, the three groups and why the body moves as one, the switch, rejected options (autoplaying clip, sliced raster, scroll-only depth), and the D60 risk handled by the fidelity test.
- CHANGELOG 0.21.0 entry in the house style (owner quote, what changed, minor by R-PREC-05).

- [ ] **Step 2: Regenerate the checklists and run the bylaws gate**

Run: `npm run checklists; node engine/tools/gate.js --only bylaws`
Expected: checklists rewritten; gate PASS.

- [ ] **Step 3: Commit**

```bash
git add engine docs
git commit -m "docs(bylaws): 0.21.0, the flowing home hero art (D62)"
```

### Task 6: Verification

- [ ] **Step 1:** `npm test`: all pass.
- [ ] **Step 2:** `npm run gate` (all nine gates, run in the background; about ten minutes). Expected: green; `reports/latest.md` regenerated. Fix any finding at its source (vnu on `data-flow` or `role="switch"`, axe contrast on the switch, Lighthouse).
- [ ] **Step 3:** Browser (`npm run serve`, via the preview tools): screenshot the home hero at rest beside the old raster; watch it move (two screenshots 10 s apart); toggle the switch by click and by keyboard (Tab, Space) and confirm `animation-play-state` is `paused` on the groups; emulate reduced motion and confirm no animation and no switch; `/ar/` for the mirror and the switch at the inline end; dark and light theme; 375 px width.
- [ ] **Step 4:** Commit the regenerated report if the gate rewrote it.

```bash
git add reports
git commit -m "chore(report): gate run for 0.21.0"
```
