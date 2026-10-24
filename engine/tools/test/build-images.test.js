import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { parseImageName, referencedImages, generateImages, generateOgImages, promoteLcpImages } from "../build-images.js";

// sharp's operation cache keeps file handles open, which blocks temp-dir removal on Windows.
sharp.cache(false);

test("parseImageName reads slug, ratio and width from the file name", () => {
  assert.deepEqual(parseImageName("/assets/images/hero-automation-16x9-1200.avif"), { slug: "hero-automation", ratio: [16, 9], width: 1200, height: 675, format: "avif", url: "/assets/images/hero-automation-16x9-1200.avif" });
  assert.deepEqual(parseImageName("/assets/images/team-1x1-480.avif").height, 480);
  assert.equal(parseImageName("/assets/images/team-1x1-480.webp"), null, "AVIF only (R-PERF-05)");
  assert.equal(parseImageName("/assets/images/odd-5x7-480.avif"), null, "unknown ratios are rejected, not guessed");
  assert.equal(parseImageName("/assets/images/plain.png"), null);
});

let dir;
const page = (body) => `<!DOCTYPE html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
before(() => {
  dir = mkdtempSync(path.join(tmpdir(), "images-"));
  mkdirSync(path.join(dir, "en"));
  writeFileSync(path.join(dir, "en", "index.html"), page(
    '<img src="/assets/images/hero-16x9-480.avif" srcset="/assets/images/hero-16x9-480.avif 480w, /assets/images/hero-16x9-768.avif 768w" width="768" height="432" alt="">'
  ));
});
after(() => rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }));

test("referencedImages finds every placeholder image URL on every page, once", () => {
  const refs = referencedImages(dir).map((r) => r.url).sort();
  assert.deepEqual(refs, ["/assets/images/hero-16x9-480.avif", "/assets/images/hero-16x9-768.avif"]);
});

test("a WebP reference fails the build, naming the page: pictures are AVIF only (R-PERF-05)", () => {
  const d = mkdtempSync(path.join(tmpdir(), "images-webp-"));
  try {
    mkdirSync(path.join(d, "en"));
    writeFileSync(path.join(d, "en", "index.html"), page('<img src="/assets/images/old-16x9-480.webp" alt="" width="480" height="270">'));
    assert.throws(() => referencedImages(d), /en[\\/]index\.html: image "\/assets\/images\/old-16x9-480\.webp" is WebP/);
  } finally {
    rmSync(d, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});

test("generateImages renders missing files at the right size and skips existing ones on rerun", { timeout: 120000 }, async () => {
  const first = await generateImages(dir, { hue: 250, accentHue: 160 });
  assert.equal(first.generated, 2);
  const avif = path.join(dir, "assets", "images", "hero-16x9-480.avif");
  assert.ok(existsSync(avif));
  const meta = await sharp(avif).metadata();
  assert.equal(meta.width, 480);
  assert.equal(meta.height, 270);
  assert.equal(meta.format, "heif");
  assert.ok(!existsSync(path.join(dir, "assets", "images", "hero-16x9-480.webp")), "no second format");
  const bytes = readFileSync(avif);
  const second = await generateImages(dir, { hue: 250, accentHue: 160 });
  assert.equal(second.generated, 0);
  assert.equal(second.skipped, 2);
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

const pic = (slug, attrs = "") => `<img src="/assets/images/${slug}-16x9-480.avif" srcset="/assets/images/${slug}-16x9-480.avif 480w, /assets/images/${slug}-16x9-768.avif 768w" width="768" height="432" alt=""${attrs}>`;
const site = (pages) => {
  const d = mkdtempSync(path.join(tmpdir(), "art-"));
  for (const [rel, body] of Object.entries(pages)) { mkdirSync(path.join(d, path.dirname(rel)), { recursive: true }); writeFileSync(path.join(d, rel), page(body)); }
  return d;
};
const drop = (d) => rmSync(d, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });

test("referencedImages carries data-art and data-tone to every width of that slug", () => {
  const d = site({ "en/index.html": pic("bg", ' data-art="planes-turn" data-tone="dark"') + pic("plain") });
  try {
    const refs = referencedImages(d);
    assert.ok(refs.filter((r) => r.slug === "bg").every((r) => r.art === "planes-turn" && r.tone === "dark"));
    assert.ok(refs.filter((r) => r.slug === "plain").every((r) => r.art === undefined && r.tone === undefined));
  } finally { drop(d); }
});

test("the same slug declared with two different arts fails, naming the slug and both pages (Review Focus 1)", () => {
  const d = site({ "en/index.html": pic("bg", ' data-art="planes-turn"'), "de/index.html": pic("bg", ' data-art="planes-logistics"') });
  try {
    assert.throws(() => referencedImages(d), (e) => /"bg"/.test(e.message) && /en[\\/]index\.html/.test(e.message) && /de[\\/]index\.html/.test(e.message));
  } finally { drop(d); }
});

test("the same slug declared once with an art and once without is fine (the declaration travels by slug)", () => {
  const d = site({ "en/index.html": pic("bg", ' data-art="planes-turn"'), "de/index.html": pic("bg") });
  try { assert.ok(referencedImages(d).every((r) => r.art === "planes-turn")); } finally { drop(d); }
});

test("an unknown art id fails the image build with the slug and the id (Review Focus 2)", { timeout: 60000 }, async () => {
  const d = site({ "en/index.html": pic("bg", ' data-art="nope"') });
  try { await assert.rejects(generateImages(d, { hue: 250, accentHue: 160 }), /image "bg": unknown art "nope"/); } finally { drop(d); }
});

test("a declared dark tone renders a dark picture, a light tone a light one", { timeout: 60000 }, async () => {
  const d = site({ "en/index.html": pic("night", ' data-art="planes-turn" data-tone="dark"') + pic("day", ' data-art="planes-turn" data-tone="light"') });
  try {
    await generateImages(d, { hue: 250, accentHue: 160 });
    const mean = async (f) => { const s = await sharp(readFileSync(path.join(d, "assets", "images", f))).png().toBuffer(); return (await sharp(s).greyscale().stats()).channels[0].mean; };
    assert.ok((await mean("night-16x9-480.avif")) < 90);
    assert.ok((await mean("day-16x9-480.avif")) > 180);
  } finally { drop(d); }
});

test("promoteLcpImages gives a plain page header's next section its first picture as the LCP image, and leaves other pages alone", () => {
  const d = mkdtempSync(path.join(tmpdir(), "lcp-"));
  try {
    const img = (n) => `<img src="/assets/images/${n}-4x3-480.avif" width="768" height="576" alt="" loading="lazy" decoding="async">`;
    const pages = {
      "plain.html": page(`<main><section data-component="page-header"><h1>A</h1></section><section data-component="feature-rows">${img("a")}${img("b")}</section><section data-component="cta">${img("c")}</section></main>`),
      "hero.html": page(`<main><section data-component="page-header"><img src="/x.avif" alt="" fetchpriority="high"></section><section data-component="cards">${img("a")}</section></main>`),
      "late.html": page(`<main><section data-component="page-header"><h1>A</h1></section><section data-component="prose"><p>x</p></section><section data-component="cards">${img("a")}</section></main>`),
      "nohead.html": page(`<main><section data-component="hero"><h1>A</h1></section><section data-component="cards">${img("a")}</section></main>`),
    };
    for (const [n, html] of Object.entries(pages)) writeFileSync(path.join(d, n), html);
    assert.deepEqual(promoteLcpImages(d), { pages: 1 });
    const plain = readFileSync(path.join(d, "plain.html"), "utf8");
    assert.match(plain, /a-4x3-480\.avif" width="768" height="576" alt="" fetchpriority="high" decoding="async">/);
    assert.equal(plain.match(/fetchpriority/g).length, 1, "only the first picture is promoted");
    for (const n of ["hero.html", "late.html", "nohead.html"]) assert.equal(readFileSync(path.join(d, n), "utf8"), pages[n], n);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("generateOgImages renders a social image only for pages whose head names one, and consumes the manifest", { timeout: 60000 }, async () => {
  const d = mkdtempSync(path.join(tmpdir(), "og-"));
  try {
    mkdirSync(path.join(d, "en", "news"), { recursive: true });
    writeFileSync(path.join(d, "en", "news", "index.html"), page('<meta property="og:image" content="https://x.test/assets/og/en-news.png">'));
    writeFileSync(path.join(d, "en", "issue.html"), page("<p>a framed newsletter issue, no Open Graph tags</p>"));
    writeFileSync(path.join(d, "og-manifest.json"), JSON.stringify([{ slug: "en-news", title: "News", site: "S" }, { slug: "en-issue", title: "Issue", site: "S" }]));
    assert.deepEqual(await generateOgImages(d, { hue: 250 }), { generated: 1 });
    assert.ok(existsSync(path.join(d, "assets", "og", "en-news.png")));
    assert.ok(!existsSync(path.join(d, "assets", "og", "en-issue.png")), "no image nothing points at");
    assert.ok(!existsSync(path.join(d, "og-manifest.json")));
  } finally { drop(d); }
});
