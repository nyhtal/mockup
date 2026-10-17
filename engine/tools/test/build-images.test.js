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
