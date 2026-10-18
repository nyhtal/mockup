import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, statSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { videoFrameSvg, captionsVtt, generateVideo } from "../build-video.js";

const frame = (over = {}) => videoFrameSvg({ slug: "one", hue: 250, accentHue: 160, width: 320, t: 0, ...over });

test("videoFrameSvg is seeded by slug, sized 16:9 from width, moves with time and has no text", () => {
  const a = frame();
  assert.match(a, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="320" height="180" viewBox="0 0 320 180">/);
  assert.equal(a, frame(), "same slug and time render the same frame");
  assert.notEqual(a, frame({ slug: "two" }), "another slug renders other shapes");
  assert.notEqual(a, frame({ t: 0.5 }), "the shapes move between frames");
  assert.doesNotMatch(a, /<text|<image/);
});

test("captionsVtt covers the whole clip with one cue", () => {
  assert.equal(captionsVtt(8, "Sample clip"), "WEBVTT\n\n00:00.000 --> 00:08.000\nSample clip\n");
});

test("generateVideo writes mp4, webm and a poster, caches them, and skips the encode on rerun", { timeout: 180000 }, async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "video-"));
  try {
    const opts = { slug: "clip", hue: 250, accentHue: 160, seconds: 1, fps: 6, width: 320, outDir: path.join(dir, "out"), cacheDir: path.join(dir, "cache") };
    const first = await generateVideo(opts);
    assert.equal(first.generated, true);
    const mp4 = readFileSync(path.join(dir, "out", "clip.mp4"));
    const webm = readFileSync(path.join(dir, "out", "clip.webm"));
    assert.equal(mp4.subarray(4, 8).toString(), "ftyp", "mp4 starts with an ftyp box");
    assert.equal(webm.readUInt32BE(0), 0x1a45dfa3, "webm starts with the EBML header");
    assert.ok(statSync(path.join(dir, "out", "clip-poster.webp")).size > 0);
    assert.ok(existsSync(path.join(dir, "cache", "clip-320x180-6fps-1s-250-160.mp4")), "mp4 cached under a key with every parameter");
    const second = await generateVideo(opts);
    assert.equal(second.generated, false);
    assert.ok(existsSync(path.join(dir, "out", "clip.webm")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
