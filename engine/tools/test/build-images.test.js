import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { parseImageName, referencedImages, generateImages } from "../build-images.js";

// sharp's operation cache keeps file handles open, which blocks temp-dir removal on Windows.
sharp.cache(false);

test("parseImageName reads slug, ratio and width from the file name", () => {
  assert.deepEqual(parseImageName("/assets/images/hero-automation-16x9-1200.avif"), { slug: "hero-automation", ratio: [16, 9], width: 1200, height: 675, format: "avif", url: "/assets/images/hero-automation-16x9-1200.avif" });
  assert.deepEqual(parseImageName("/assets/images/team-1x1-480.webp").height, 480);
  assert.equal(parseImageName("/assets/images/odd-5x7-480.avif"), null, "unknown ratios are rejected, not guessed");
  assert.equal(parseImageName("/assets/images/plain.png"), null);
});

let dir;
const page = (body) => `<!DOCTYPE html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
before(() => {
  dir = mkdtempSync(path.join(tmpdir(), "images-"));
  mkdirSync(path.join(dir, "en"));
  writeFileSync(path.join(dir, "en", "index.html"), page(
    '<picture><source type="image/avif" srcset="/assets/images/hero-16x9-480.avif 480w, /assets/images/hero-16x9-768.avif 768w"><img src="/assets/images/hero-16x9-480.webp" srcset="/assets/images/hero-16x9-480.webp 480w" width="768" height="432" alt=""></picture>'
  ));
});
after(() => rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }));

test("referencedImages finds every placeholder image URL on every page, once", () => {
  const refs = referencedImages(dir).map((r) => r.url).sort();
  assert.deepEqual(refs, ["/assets/images/hero-16x9-480.avif", "/assets/images/hero-16x9-480.webp", "/assets/images/hero-16x9-768.avif"]);
});

test("generateImages renders missing files at the right size and skips existing ones on rerun", { timeout: 120000 }, async () => {
  const first = await generateImages(dir, { hue: 250, accentHue: 160 });
  assert.equal(first.generated, 3);
  const avif = path.join(dir, "assets", "images", "hero-16x9-480.avif");
  assert.ok(existsSync(avif));
  const meta = await sharp(avif).metadata();
  assert.equal(meta.width, 480);
  assert.equal(meta.height, 270);
  assert.equal(meta.format, "heif");
  const webp = await sharp(path.join(dir, "assets", "images", "hero-16x9-480.webp")).metadata();
  assert.equal(webp.format, "webp");
  const bytes = readFileSync(avif);
  const second = await generateImages(dir, { hue: 250, accentHue: 160 });
  assert.equal(second.generated, 0);
  assert.equal(second.skipped, 3);
  assert.deepEqual(readFileSync(avif), bytes);
});

test("two fresh builds encode byte-identical images (Review Focus 4)", { timeout: 120000 }, async () => {
  const dirs = [0, 1].map(() => mkdtempSync(path.join(tmpdir(), "images-twice-")));
  try {
    for (const d of dirs) {
      mkdirSync(path.join(d, "en"));
      writeFileSync(path.join(d, "en", "index.html"), page('<img src="/assets/images/twice-1x1-480.avif" alt="" width="480" height="480">'));
      assert.equal((await generateImages(d, { hue: 250, accentHue: 160 })).generated, 1);
    }
    const [a, b] = dirs.map((d) => readFileSync(path.join(d, "assets", "images", "twice-1x1-480.avif")));
    assert.ok(a.length > 100);
    assert.deepEqual(a, b);
  } finally {
    for (const d of dirs) rmSync(d, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});

const pic = (slug, attrs = "") => `<picture><source type="image/avif" srcset="/assets/images/${slug}-16x9-480.avif 480w"><img src="/assets/images/${slug}-16x9-480.webp" width="480" height="270" alt=""${attrs}></picture>`;
const site = (pages) => {
  const d = mkdtempSync(path.join(tmpdir(), "art-"));
  for (const [rel, body] of Object.entries(pages)) { mkdirSync(path.join(d, path.dirname(rel)), { recursive: true }); writeFileSync(path.join(d, rel), page(body)); }
  return d;
};
const drop = (d) => rmSync(d, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });

test("referencedImages carries data-art and data-tone to every format of that slug", () => {
  const d = site({ "en/index.html": pic("bg", ' data-art="glow" data-tone="dark"') + pic("plain") });
  try {
    const refs = referencedImages(d);
    assert.ok(refs.filter((r) => r.slug === "bg").every((r) => r.art === "glow" && r.tone === "dark"));
    assert.ok(refs.filter((r) => r.slug === "plain").every((r) => r.art === undefined && r.tone === undefined));
  } finally { drop(d); }
});

test("the same slug declared with two different arts fails, naming the slug and both pages (Review Focus 1)", () => {
  const d = site({ "en/index.html": pic("bg", ' data-art="glow"'), "de/index.html": pic("bg", ' data-art="folds"') });
  try {
    assert.throws(() => referencedImages(d), (e) => /"bg"/.test(e.message) && /en[\\/]index\.html/.test(e.message) && /de[\\/]index\.html/.test(e.message));
  } finally { drop(d); }
});

test("the same slug declared once with an art and once without is fine (the declaration travels by slug)", () => {
  const d = site({ "en/index.html": pic("bg", ' data-art="glow"'), "de/index.html": pic("bg") });
  try { assert.ok(referencedImages(d).every((r) => r.art === "glow")); } finally { drop(d); }
});

test("an unknown art id fails the image build with the slug and the id (Review Focus 2)", { timeout: 60000 }, async () => {
  const d = site({ "en/index.html": pic("bg", ' data-art="nope"') });
  try { await assert.rejects(generateImages(d, { hue: 250, accentHue: 160 }), /image "bg": unknown art "nope"/); } finally { drop(d); }
});

test("a declared dark tone renders a dark picture, a light tone a light one", { timeout: 60000 }, async () => {
  const d = site({ "en/index.html": pic("night", ' data-art="glow" data-tone="dark"') + pic("day", ' data-art="glow" data-tone="light"') });
  try {
    await generateImages(d, { hue: 250, accentHue: 160 });
    const mean = async (f) => { const s = await sharp(readFileSync(path.join(d, "assets", "images", f))).png().toBuffer(); return (await sharp(s).greyscale().stats()).channels[0].mean; };
    assert.ok((await mean("night-16x9-480.webp")) < 90);
    assert.ok((await mean("day-16x9-480.webp")) > 180);
  } finally { drop(d); }
});
