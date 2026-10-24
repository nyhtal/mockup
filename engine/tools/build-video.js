/**
 * The sample clip (R-ASSET-13, R-PERF-17, DESIGN §5): Offset Planes in motion, the art library's system, rendered frame by frame from SVG
 * through sharp and piped raw into ffmpeg-static, which writes H.264 (MP4) and VP9 (WebM) in one pass. The first
 * frame is the poster. Every parameter is in the cache key, so a rebuild copies and an unchanged clip never re-encodes.
 */
import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { listHtml, parse } from "./lib/html.js";
import { seed, rng } from "./lib/placeholder.js";
import { ramp } from "./lib/art.js";

/** Clip length in seconds for every generated sample (DESIGN §5; R-PERF-17 allows up to 10). */
export const SECONDS = 8;
export const FPS = 24;
export const WIDTH = 1280;
/** Bump when videoFrameSvg or the encoder arguments change, so cached clips are re-encoded. */
export const VERSION = 2;
const CACHE_DIR = "engine/.cache/video";

const TAU = Math.PI * 2;
const fix = (n) => Number(n.toFixed(2));

/**
 * One frame at time t ∈ [0, 1] of the clip for `slug`, in the art library's system (Offset Planes, DESIGN §5): flat
 * planes in five steps of the brand's dark ramp on a dark ground, the start 40 % empty for the cinema hero's words. A
 * ribbon turning through a quarter-disc holds still while a tall plane, a band, a 45-degree accent band and a small
 * square glide along their own axes by up to half a grid module, each on its own phase (seeded by the slug), and their
 * narrow channels of light trail 6 % of the clip behind. Every offset is zero at t = 0 and t = 1, so the poster is the
 * composition at rest and the clip loops. No text, no faces.
 */
export function videoFrameSvg({ slug, hue = 250, accentHue = 160, width = WIDTH, t = 0 }) {
  const W = width, H = Math.round((width * 9) / 16);
  const r = rng(seed(slug));
  const u = width / 1280; // designed on 1280 × 720, a 12 × 8 grid of 106.67 × 90
  const col = (1280 / 12) * u, row = 90 * u, thin = 7 * u, gap = 12 * u;
  const lut = ramp("dark", hue, accentHue);
  const tone = [6, 70, 128, 186, 250].map((g) => "#" + [0, 1, 2].map((c) => lut[g * 3 + c].toString(16).padStart(2, "0")).join(""));
  const phase = Array.from({ length: 4 }, () => r() * TAU);
  // The slug also sets the composition: the accent band steps up to half a module toward the end, the small square up to 0.6 of a row up.
  const vary = (Math.round(r() * 8) / 8) * 0.5 * col, sq = (Math.round(r() * 6) / 6) * 0.6 * row;
  /** Offset of layer i along its axis: amp × (sin(2π(t − lag) + φ) − sin(φ − 2π·lag)), zero at rest and periodic. */
  const glide = (i, amp, lag = 0) => amp * (Math.sin(TAU * (t - lag) + phase[i]) - Math.sin(phase[i] - TAU * lag));
  const rect = (x, y, w, h, fill) => `<rect x="${fix(x)}" y="${fix(y)}" width="${fix(w)}" height="${fix(h)}" fill="${fill}"/>`;
  const poly = (pts, fill) => `<path d="M${pts.map(([x, y]) => `${fix(x)} ${fix(y)}`).join("L")}Z" fill="${fill}"/>`;
  const parts = [];
  // A quarter-disc resting in the bottom-end corner.
  const qd = 2.2 * row;
  parts.push(`<path d="M${fix(W - qd)} ${fix(H)}A ${fix(qd)} ${fix(qd)} 0 0 1 ${fix(W)} ${fix(H - qd)}L${fix(W)} ${fix(H)}Z" fill="${tone[1]}"/>`);
  // The tall plane glides vertically, its channel beside it.
  parts.push(rect(col * 9.6, row * 0.5 + glide(0, row * 0.5), col, row * 6, tone[1]));
  parts.push(rect(col * 9.6 - gap - thin, row * 0.9 + glide(0, row * 0.5, 0.06), thin, row * 5.2, tone[2]));
  // The ribbon: a band from the end edge turning down through a quarter-annulus into a vertical band; it holds still.
  const top = row * 2.5, band = row, cx = col * 6.6, R = band * 2;
  parts.push(rect(cx, top, W - cx, band, tone[2]));
  parts.push(`<path d="M${fix(cx - R)} ${fix(top + R)}A ${fix(R)} ${fix(R)} 0 0 1 ${fix(cx)} ${fix(top)}L${fix(cx)} ${fix(top + band)}A ${fix(band)} ${fix(band)} 0 0 0 ${fix(cx - band)} ${fix(top + R)}Z" fill="${tone[2]}"/>`);
  parts.push(rect(cx - R, top + R, band, H - top - R, tone[2]));
  parts.push(rect(cx + col * 0.6 + glide(1, col * 0.5, 0.06), top - gap - thin, W, thin, tone[4]));
  // A lighter band below glides horizontally, its channel under it.
  parts.push(rect(col * 7.2 + glide(1, col * 0.5), row * 4.5, W, row * 0.8, tone[3]));
  parts.push(rect(col * 7.6 + glide(1, col * 0.5, 0.06), row * 5.3 + gap, W, thin, tone[3]));
  // The 45-degree accent band glides along its own diagonal, a channel of light beside it.
  const w = 80 * u, rise = row * 6.7, slope = (p, d, wd) => [[p + d, H - d], [p + wd + d, H - d], [p + wd + rise + d, H - rise - d], [p + rise + d, H - rise - d]];
  parts.push(poly(slope(col * 6.2 + vary - 18 * u - thin, glide(2, col * 0.4, 0.06), thin), tone[3]));
  parts.push(poly(slope(col * 6.2 + vary, glide(2, col * 0.4), w), tone[4]));
  // A small square, the micro offset.
  parts.push(rect(col * 10.9 + glide(3, col * 0.25), row * 6.6 - sq, col * 0.55, col * 0.55, tone[4]));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${tone[0]}"/>` + parts.join("") + `</svg>`;
}

const stamp = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}.${String(Math.round((s % 1) * 1000)).padStart(3, "0")}`;

/** A WebVTT file with one cue spanning the clip (the sample has no speech; the cue describes it). */
export function captionsVtt(seconds, text) {
  return `WEBVTT\n\n${stamp(0)} --> ${stamp(seconds)}\n${text}\n`;
}

async function encode({ slug, hue, accentHue, seconds, fps, width, height, mp4, webm, poster, ffmpeg }) {
  if (typeof ffmpeg !== "string" || !ffmpeg) throw new Error(`ffmpeg-static did not provide a binary (was its install script skipped?), so the clip "${slug}" cannot be encoded`);
  const n = seconds * fps;
  const svg = (i) => Buffer.from(videoFrameSvg({ slug, hue, accentHue, width, t: i / n }));
  writeFileSync(poster, await sharp(svg(0)).avif({ quality: 42, effort: 6 }).toBuffer());
  const args = [
    "-y", "-hide_banner", "-loglevel", "error",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${width}x${height}`, "-r", String(fps), "-i", "pipe:0",
    "-c:v", "libx264", "-preset", "medium", "-crf", "26", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4,
    "-c:v", "libvpx-vp9", "-crf", "36", "-b:v", "0", "-deadline", "good", "-cpu-used", "4", "-row-mt", "1", "-pix_fmt", "yuv420p", "-an", webm,
  ];
  await new Promise((resolve, reject) => {
    const p = spawn(ffmpeg, args, { stdio: ["pipe", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.stdin.on("error", () => {});
    p.on("error", (e) => reject(new Error(`ffmpeg could not start (${ffmpeg}): ${e.message}`)));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}: ${err.trim()}`))));
    (async () => {
      for (let i = 0; i < n; i++) {
        const frame = await sharp(svg(i)).flatten({ background: "#ffffff" }).raw().toBuffer();
        if (!p.stdin.write(frame)) await new Promise((r) => p.stdin.once("drain", r));
      }
      p.stdin.end();
    })().catch(reject);
  });
}

/**
 * Write `<slug>.mp4`, `<slug>.webm` and `<slug>-poster.avif` into outDir, encoding only when the cache (keyed by
 * every parameter) lacks them. Returns { generated, files }.
 */
export async function generateVideo({ slug, hue = 250, accentHue = 160, seconds = SECONDS, fps = FPS, width = WIDTH, outDir, cacheDir = CACHE_DIR, ffmpeg = ffmpegPath }) {
  const height = Math.round((width * 9) / 16);
  const key = `${slug}-${width}x${height}-${fps}fps-${seconds}s-${hue}-${accentHue}-v${VERSION}`;
  mkdirSync(outDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });
  const outputs = [[".mp4", `${slug}.mp4`], [".webm", `${slug}.webm`], ["-poster.avif", `${slug}-poster.avif`]];
  const cached = (ext) => path.join(cacheDir, `${key}${ext}`);
  let generated = false;
  if (!outputs.every(([ext]) => existsSync(cached(ext)))) {
    // Encode to temporary names and rename only when every output is complete, so an interrupted build never leaves a truncated clip that the next build would ship as a cache hit.
    const tmp = (ext) => path.join(cacheDir, `${key}.tmp${ext}`);
    try {
      await encode({ slug, hue, accentHue, seconds, fps, width, height, mp4: tmp(".mp4"), webm: tmp(".webm"), poster: tmp("-poster.avif"), ffmpeg });
      for (const [ext] of outputs) renameSync(tmp(ext), cached(ext));
    } catch (e) {
      for (const [ext] of outputs) rmSync(tmp(ext), { force: true });
      throw e;
    }
    generated = true;
  }
  const files = outputs.map(([ext, name]) => { const f = path.join(outDir, name); copyFileSync(cached(ext), f); return f; });
  return { generated, files };
}

/** Every clip and captions track the built pages reference: { slugs: Set, tracks: Map<file, cue> }. */
export function referencedVideos(distDir) {
  const slugs = new Set(), tracks = new Map();
  for (const file of listHtml(distDir)) {
    const { root } = parse(file);
    for (const video of root.querySelectorAll("video")) {
      for (const source of video.querySelectorAll("source[src]")) {
        const m = /^\/assets\/video\/([a-z0-9]+(?:-[a-z0-9]+)*)\.mp4$/.exec(source.getAttribute("src"));
        if (m) slugs.add(m[1]);
      }
      for (const track of video.querySelectorAll("track[src]")) {
        const src = track.getAttribute("src");
        if (src.startsWith("/assets/video/") && src.endsWith(".vtt")) tracks.set(src.slice("/assets/video/".length), track.getAttribute("data-cue") || "");
      }
    }
  }
  return { slugs, tracks };
}

/** Generate every referenced clip into dist/assets/video and write its captions files. Returns counts. */
export async function generateVideos(distDir, brand = {}) {
  const { slugs, tracks } = referencedVideos(distDir);
  if (slugs.size === 0 && tracks.size === 0) return { clips: 0, encoded: 0, tracks: 0 };
  const outDir = path.join(distDir, "assets", "video");
  let encoded = 0;
  for (const slug of slugs) {
    const { generated } = await generateVideo({ slug, hue: brand.hue ?? 250, accentHue: brand.accentHue ?? brand.hue ?? 250, outDir });
    if (generated) encoded++;
  }
  mkdirSync(outDir, { recursive: true });
  for (const [name, cue] of tracks) writeFileSync(path.join(outDir, name), captionsVtt(SECONDS, cue));
  return { clips: slugs.size, encoded, tracks: tracks.size };
}
