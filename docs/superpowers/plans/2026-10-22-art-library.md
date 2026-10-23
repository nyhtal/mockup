# Art library (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the abstract-blob placeholders with a committed library of twelve AI-generated abstract pieces that the build recolours to each site's brand and accent hues.

**Architecture:** `engine/art/` holds greyscale WebP sources and `manifest.json`. A new `engine/tools/lib/art.js` builds a 256-step colour ramp from the hues, picks a piece and tone for a slug, and renders a crop at any size with sharp. `build-images.js` reads optional `data-art` / `data-tone` from each `<img>` in the built HTML and renders through `art.js` instead of `placeholderSvg`. The `picture` primitive writes those attributes from the image declaration.

**Tech Stack:** Node 24, sharp 0.35 (libvips), node:test, Nunjucks.

**Spec:** `docs/superpowers/specs/2026-10-22-elegant-openings-and-art-design.md` (Phase 1).

## Global Constraints

- No photographs, no faces, no text in images; sources are abstract and reviewed.
- Deterministic: the same slug, ratio, width, hues, art and tone give byte-identical files on two fresh builds.
- Output names, widths and formats unchanged: `/assets/images/<slug>-<WxH>-<width>.(avif|webp)`, widths 480/768/1200/1600, AVIF q50 effort 4, WebP q75.
- Colours computed in OKLCH and converted with `oklchToHex` from `engine/tools/lib/theme.js`.
- `placeholderSvg` stays for `build-video.js` (R-ASSET-13).
- Bylaw change is minor (0.10.0): old declarations stay valid.

## Review Focus

1. A slug declared on two pages with different `art` or `tone` → the build fails naming both pages (test in Task 3).
2. An unknown `art` id → the build fails naming the id and the page, not a silent fallback (test in Task 3).
3. `brand.art` listing an id not in the manifest → fails with the id (test in Task 2).
4. A `quiet` piece cropped to 1:1 or 3:4 keeps its structured side (crop from the end) (test in Task 2).
5. Very different hues (25, 160, 300) all produce a dark ramp whose first quarter stays at OKLCH L ≤ .25, so text over the quiet side keeps contrast (test in Task 2).

---

### Task 1: Library sources, manifest and licence

**Files:**
- Create: `engine/art/manifest.json`, `engine/art/<id>.webp` × 12
- Create: `engine/tools/import-art.js` (one-off, kept for re-imports)
- Modify: `engine/LICENSES.md`

**Interfaces:**
- Produces: `manifest.json` = `{ "version": 1, "pieces": [{ "id", "composition": "quiet"|"field"|"glow", "crop": "right"|"centre"|"bottom", "subject", "model", "date" }] }`; the shared prompt under `"prompt"`.

- [ ] **Step 1:** `import-art.js <src.png> <id>`: `sharp(src).greyscale().normalise().webp({ quality: 90 }).toFile("engine/art/<id>.webp")`.
- [ ] **Step 2:** Import the twelve reviewed PNGs: p1 `contours-quiet`, p2 `contours-field`, p3 `ribbon-quiet`, p4 `airflow`, p5 `fins-quiet`, p6 `folds`, p7 `rings-quiet`, p8 `horizon`, p9 `glow`, p10 `dots-quiet`, p11 `traces-quiet`, p12 `glass`.
- [ ] **Step 3:** Write `manifest.json` (compositions: the six `-quiet` pieces `quiet`/`right`; `glow` `glow`/`right`; `horizon` `field`/`bottom`; the rest `field`/`centre`), each with its subject line from the prompts.
- [ ] **Step 4:** Add the library row to `LICENSES.md`.
- [ ] **Step 5:** Commit `feat(art): the art library — twelve abstract sources and their manifest`.

### Task 2: `art.js` — ramp, pick, render

**Files:**
- Create: `engine/tools/lib/art.js`
- Test: `engine/tools/test/art.test.js`

**Interfaces:**
- Produces:
  - `loadLibrary(dir = "engine/art") → { prompt, pieces: Map<id, piece> }` (throws if a piece's file is missing)
  - `ramp(tone, hue, accentHue) → Uint8Array(768)` (RGB per grey level)
  - `pickArt(slug, library, allowed?) → id` (seeded by slug over allowed pieces whose composition is not `glow`; `allowed` ids must exist, else throws `brand.art: unknown piece "<id>"`)
  - `pickTone(slug) → "dark"|"light"`
  - `renderArt({ library, id, tone, width, height, hue, accentHue }) → Promise<sharp>` (cover crop at the piece's `crop` position, LUT applied, ready for `.avif()`/`.webp()`)

- [ ] **Step 1: Failing tests**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { loadLibrary, ramp, pickArt, pickTone, renderArt } from "../lib/art.js";
import { hexToOklch } from "./helpers/oklch.js";
sharp.cache(false);
const lib = loadLibrary();

test("the library has twelve pieces, each with a file", () => { assert.equal(lib.pieces.size, 12); });
test("ramp is deterministic and follows the hue", () => {
  assert.deepEqual(ramp("dark", 250, 160), ramp("dark", 250, 160));
  assert.notDeepEqual(ramp("dark", 250, 160), ramp("dark", 25, 60));
});
test("the dark ramp keeps its first quarter at L ≤ .25 for any hue", () => {
  for (const h of [25, 160, 250, 300]) { const r = ramp("dark", h, h + 40); const [l] = hexToOklch(r[64 * 3], r[64 * 3 + 1], r[64 * 3 + 2]); assert.ok(l <= 0.25, `hue ${h}: L ${l}`); }
});
test("pickArt and pickTone are stable per slug and respect the allowed list", () => {
  assert.equal(pickArt("a", lib), pickArt("a", lib));
  assert.equal(pickArt("a", lib, ["folds"]), "folds");
  assert.throws(() => pickArt("a", lib, ["nope"]), /unknown piece "nope"/);
  assert.ok(["dark", "light"].includes(pickTone("a")));
});
test("a quiet piece cropped square keeps its structured end side", async () => {
  const img = await renderArt({ library: lib, id: "contours-quiet", tone: "dark", width: 240, height: 240, hue: 250, accentHue: 160 });
  const { data } = await img.greyscale().raw().toBuffer({ resolveWithObject: true });
  const mean = (x0, x1) => { let s = 0, n = 0; for (let y = 0; y < 240; y++) for (let x = x0; x < x1; x++) { s += data[y * 240 + x]; n++; } return s / n; };
  assert.ok(mean(120, 240) > mean(0, 120) * 0.8, "the end half is not the empty side");
});
```

(`helpers/oklch.js` is a 20-line inverse of `oklchToHex`: sRGB → linear → LMS → OKLab → L.)

- [ ] **Step 2:** `npm test -- --test-name-pattern=art` → FAIL (module missing).
- [ ] **Step 3: Implement `art.js`**

```js
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { oklchToHex } from "./theme.js";
import { seed } from "./placeholder.js";

/** Ramp stops: [grey position, L, C, "b" brand | "a" accent]. Tuned against the library (spec Phase 1). */
export const RAMPS = {
  dark: [[0, 0.14, 0.03, "b"], [0.25, 0.24, 0.07, "b"], [0.5, 0.46, 0.14, "b"], [0.78, 0.7, 0.13, "a"], [1, 0.96, 0.03, "a"]],
  light: [[0, 0.975, 0.01, "b"], [0.25, 0.93, 0.03, "b"], [0.55, 0.76, 0.1, "b"], [0.82, 0.56, 0.15, "b"], [1, 0.48, 0.13, "a"]],
};
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function loadLibrary(dir = "engine/art") {
  const m = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const pieces = new Map();
  for (const p of m.pieces) {
    const file = path.join(dir, `${p.id}.webp`);
    if (!existsSync(file)) throw new Error(`art library: ${p.id}.webp is missing`);
    pieces.set(p.id, { ...p, file });
  }
  return { prompt: m.prompt, pieces };
}

export function ramp(tone, hue, accentHue) {
  const stops = RAMPS[tone].map(([p, l, c, w]) => [p, rgb(oklchToHex(l, c, w === "a" ? accentHue : hue))]);
  const out = new Uint8Array(768);
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    let k = 0;
    while (k < stops.length - 2 && x > stops[k + 1][0]) k++;
    const [p0, c0] = stops[k], [p1, c1] = stops[k + 1];
    const t = Math.min(1, Math.max(0, (x - p0) / (p1 - p0)));
    for (let ch = 0; ch < 3; ch++) out[i * 3 + ch] = Math.round(c0[ch] + (c1[ch] - c0[ch]) * t);
  }
  return out;
}

export function pickArt(slug, library, allowed) {
  for (const id of allowed || []) if (!library.pieces.has(id)) throw new Error(`brand.art: unknown piece "${id}"`);
  const pool = [...(allowed && allowed.length ? allowed : library.pieces.keys())].filter((id) => library.pieces.get(id).composition !== "glow");
  return pool[seed(slug) % pool.length];
}

export const pickTone = (slug) => (seed(`${slug}#tone`) % 2 ? "dark" : "light");

export async function renderArt({ library, id, tone, width, height, hue, accentHue }) {
  const piece = library.pieces.get(id);
  const { data, info } = await sharp(piece.file).greyscale().resize(width, height, { fit: "cover", position: piece.crop === "centre" ? "centre" : piece.crop }).raw().toBuffer({ resolveWithObject: true });
  const lut = ramp(tone, hue, accentHue);
  const out = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < info.width * info.height; i++) { const g = data[i * info.channels] * 3; out[i * 3] = lut[g]; out[i * 3 + 1] = lut[g + 1]; out[i * 3 + 2] = lut[g + 2]; }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } });
}
```

- [ ] **Step 4:** Tune `RAMPS` on a contact sheet of all twelve × (hue 250/160, 25/60, 300/340) × (dark, light): lift the dark mid-tones until the glow reads; check the light tone keeps fine lines visible. Re-run the tests.
- [ ] **Step 5:** `npm test` → PASS. Commit `feat(art): recolour library pieces to the brand hues`.

### Task 3: build-images reads art and tone

**Files:**
- Modify: `engine/tools/build-images.js` (`referencedImages`, `generateImages`)
- Test: `engine/tools/test/build-images.test.js`

**Interfaces:**
- Consumes: Task 2's `loadLibrary`, `pickArt`, `pickTone`, `renderArt`.
- Produces: `referencedImages(distDir)` entries gain `art?: string`, `tone?: "dark"|"light"`; `generateImages(distDir, brand)` reads `brand.art` (array of ids).

- [ ] **Step 1: Failing tests** (append):

```js
const pic = (slug, attrs) => `<picture><source type="image/avif" srcset="/assets/images/${slug}-16x9-480.avif 480w"><img src="/assets/images/${slug}-16x9-480.webp" width="480" height="270" alt=""${attrs}></picture>`;

test("referencedImages carries data-art and data-tone to every format of that slug", () => {
  const d = mkdtempSync(path.join(tmpdir(), "art-")); mkdirSync(path.join(d, "en"));
  writeFileSync(path.join(d, "en", "index.html"), page(pic("bg", ' data-art="glow" data-tone="dark"')));
  const refs = referencedImages(d);
  assert.ok(refs.every((r) => r.art === "glow" && r.tone === "dark"));
  rmSync(d, { recursive: true, force: true });
});

test("the same slug with two different arts fails, naming both pages", () => {
  const d = mkdtempSync(path.join(tmpdir(), "art-")); mkdirSync(path.join(d, "en")); mkdirSync(path.join(d, "de"));
  writeFileSync(path.join(d, "en", "index.html"), page(pic("bg", ' data-art="glow"')));
  writeFileSync(path.join(d, "de", "index.html"), page(pic("bg", ' data-art="folds"')));
  assert.throws(() => referencedImages(d), (e) => /bg/.test(e.message) && /en/.test(e.message) && /de/.test(e.message));
  rmSync(d, { recursive: true, force: true });
});

test("an unknown art id fails the image build with the id", { timeout: 60000 }, async () => {
  const d = mkdtempSync(path.join(tmpdir(), "art-")); mkdirSync(path.join(d, "en"));
  writeFileSync(path.join(d, "en", "index.html"), page(pic("bg", ' data-art="nope"')));
  await assert.rejects(generateImages(d, { hue: 250, accentHue: 160 }), /unknown art "nope"/);
  rmSync(d, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
});
```

- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement.** In `referencedImages`, also scan every `<img …>` tag: when its `src` parses as an image, read `data-art` / `data-tone` and store them per slug with the page path; a second page giving a different value throws `image "<slug>": data-art "<a>" on <pageA> but "<b>" on <pageB>`. Attach `art`/`tone` to every ref of that slug. In `generateImages`, load the library once; for each ref: `id = ref.art ?? pickArt(ref.slug, lib, brand.art)`; unknown → throw `image "<slug>": unknown art "<id>"`; `tone = ref.tone ?? pickTone(ref.slug)`; `pipeline = await renderArt(...)`; encode as today. Drop the `placeholderSvg` import.
- [ ] **Step 4:** `npm test` → PASS (the existing byte-identical test still holds).
- [ ] **Step 5:** Commit `feat(images): render placeholders from the art library`.

### Task 4: primitive, site, rules, build, gate

**Files:**
- Modify: `engine/catalog/primitives/picture.njk` (data attributes, doc comment), `sites/reference/site.json` (`brand.art`), `engine/bylaws/17-assets.md` (R-ASSET-05, R-ASSET-06), `engine/CHANGELOG.md` (0.10.0), `engine/DECISIONS.md` (D60), `engine/site-brief/TEMPLATE.md` (art list), `engine/DESIGN.md` §5, `engine/checklists/*` (regenerated), sample alt texts that say "abstract shapes" (still true; keep).

- [ ] **Step 1:** `picture.njk`: after `decoding="async"` add `{% if img.art %} data-art="{{ img.art }}"{% endif %}{% if img.tone %} data-tone="{{ img.tone }}"{% endif %}`; document `art`, `tone` in `content limits`.
- [ ] **Step 2:** `site.json` `brand.art`: `["contours-quiet","contours-field","ribbon-quiet","airflow","fins-quiet","folds","glow","traces-quiet","glass"]`.
- [ ] **Step 3:** Rewrite R-ASSET-05 and extend R-ASSET-06 per the spec; CHANGELOG 0.10.0 (minor); D60 records the owner's choice and the Codex source; `npm run checklists`.
- [ ] **Step 4:** `npm run build -- --site reference`; open `/en/` and `/sys/style-guide/sections/` in the preview; screenshot; `npm run gate -- --site reference --skip lighthouse` → all green; check the budget gate's largest pages.
- [ ] **Step 5:** Commit `feat(art): bylaws 0.10.0 — the art library replaces the blob placeholders` with the report.
