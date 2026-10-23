import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, readdirSync, statSync, existsSync } from "node:fs";
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

test("videoFrameSvg is in the Offset Planes system (0.16.0): flat fills from the brand ramp, no gradients or transparency, it loops, and the left 40 % stays empty", async () => {
  const { ramp } = await import("../lib/art.js");
  const a = frame();
  assert.doesNotMatch(a, /Gradient|opacity|stroke=/, "flat fills only");
  const r = ramp("dark", 250, 160), hex = (i) => "#" + [0, 1, 2].map((c) => r[i * 3 + c].toString(16).padStart(2, "0")).join("");
  assert.ok(a.includes(`fill="${hex(6)}"`), "the ground is the ramp's darkest step");
  assert.notEqual(a, frame({ hue: 25, accentHue: 60 }), "another brand recolours it");
  assert.equal(frame({ t: 0 }), frame({ t: 1 }), "the last frame returns to the first, so the clip loops");
  for (const t of [0, 0.25, 0.5, 0.75]) {
    const xs = [...frame({ t, width: 1280 }).matchAll(/(?:x="|M|L|A [\d.]+ [\d.]+ 0 0 [01] )(-?[\d.]+)/g)].map((m) => Number(m[1]));
    assert.ok(Math.min(...xs.filter((x) => x > 0)) >= 1280 * 0.4, `t=${t}: nothing starts left of 40 %`);
  }
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
    assert.ok(existsSync(path.join(dir, "cache", "clip-320x180-6fps-1s-250-160-v2.mp4")), "mp4 cached under a key with every parameter and the generator version");
    assert.deepEqual(readdirSync(path.join(dir, "cache")).filter((f) => f.includes(".tmp")), [], "no temporary files left in the cache");
    const second = await generateVideo(opts);
    assert.equal(second.generated, false);
    assert.ok(existsSync(path.join(dir, "out", "clip.webm")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("generateVideo leaves nothing in the cache when the encoder fails or is missing", { timeout: 60000 }, async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "video-"));
  try {
    const opts = { slug: "bad", hue: 250, accentHue: 160, seconds: 1, fps: 2, width: 64, outDir: path.join(dir, "out"), cacheDir: path.join(dir, "cache") };
    await assert.rejects(generateVideo({ ...opts, ffmpeg: path.join(dir, "no-such-ffmpeg.exe") }), /ffmpeg/);
    assert.deepEqual(readdirSync(path.join(dir, "cache")), [], "a failed encode leaves no cache files, truncated or otherwise");
    await assert.rejects(generateVideo({ ...opts, ffmpeg: null }), /ffmpeg-static/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
