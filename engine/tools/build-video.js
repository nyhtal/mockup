/**
 * The sample clip (R-ASSET-13, R-PERF-17, DESIGN §5): brand shapes in motion, rendered frame by frame from SVG
 * through sharp and piped raw into ffmpeg-static, which writes H.264 (MP4) and VP9 (WebM) in one pass. The first
 * frame is the poster. Every parameter is in the cache key, so a rebuild copies and an unchanged clip never re-encodes.
 */
import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { listHtml, parse } from "./lib/html.js";
import { seed, rng } from "./lib/placeholder.js";
import { oklchToHex } from "./lib/theme.js";

/** Clip length in seconds for every generated sample (DESIGN §5; R-PERF-17 allows up to 10). */
export const SECONDS = 8;
export const FPS = 24;
export const WIDTH = 1280;
const CACHE_DIR = "engine/.cache/video";

const TAU = Math.PI * 2;
const fix = (n) => Number(n.toFixed(2));

/**
 * One frame at time t ∈ [0, 1) of the clip for `slug`: a tinted field, a slow gradient band, a rotating ring and
 * seven shapes drifting on closed paths, so frame 1 follows the last frame and the clip loops. No text, no faces.
 */
export function videoFrameSvg({ slug, hue = 250, accentHue = 160, width = WIDTH, t = 0 }) {
  const height = Math.round((width * 9) / 16);
  const r = rng(seed(slug));
  const u = width / 1280; // scale every length from the 1280-wide design
  const field = oklchToHex(0.97, 0.015, hue);
  const band1 = oklchToHex(0.9, 0.05, hue), band2 = oklchToHex(0.92, 0.05, accentHue);
  const shapes = [];
  for (let i = 0; i < 7; i++) {
    const accent = r() < 0.3;
    const colour = oklchToHex(0.5 + r() * 0.3, 0.1 + r() * 0.06, accent ? accentHue : hue);
    const size = (80 + r() * 200) * u;
    const cx = (120 + r() * 1040) * u, cy = (90 + r() * 540) * u;
    const ax = (40 + r() * 140) * u, ay = (30 + r() * 100) * u;
    const phase = r(), turns = 1 + Math.floor(r() * 2), spin = r() < 0.5 ? 1 : -1;
    const x = cx + ax * Math.sin(TAU * (t * turns + phase)), y = cy + ay * Math.cos(TAU * (t * turns + phase));
    const kind = r();
    if (kind < 0.45) shapes.push(`<circle cx="${fix(x)}" cy="${fix(y)}" r="${fix(size / 2)}" fill="${colour}" fill-opacity="0.85"/>`);
    else if (kind < 0.8) shapes.push(`<rect x="${fix(x - size / 2)}" y="${fix(y - size / 2)}" width="${fix(size)}" height="${fix(size)}" rx="${fix(size * 0.22)}" fill="${colour}" fill-opacity="0.85" transform="rotate(${fix(spin * 360 * t * turns + phase * 90)} ${fix(x)} ${fix(y)})"/>`);
    else shapes.push(`<circle cx="${fix(x)}" cy="${fix(y)}" r="${fix(size / 2)}" fill="none" stroke="${colour}" stroke-width="${fix(10 * u)}" stroke-opacity="0.9"/>`);
  }
  const ringR = 230 * u, ringCx = width * 0.68, ringCy = height * 0.5;
  const bandShift = fix(Math.sin(TAU * t) * 60 * u);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${band1}"/><stop offset="1" stop-color="${band2}"/></linearGradient></defs>` +
    `<rect width="${width}" height="${height}" fill="${field}"/>` +
    `<rect x="${fix(-200 * u + bandShift)}" y="${fix(height * 0.55)}" width="${fix(width + 400 * u)}" height="${fix(height * 0.6)}" fill="url(#b)" transform="rotate(-8 ${fix(width / 2)} ${fix(height / 2)})"/>` +
    `<circle cx="${fix(ringCx)}" cy="${fix(ringCy)}" r="${fix(ringR)}" fill="none" stroke="${oklchToHex(0.6, 0.12, hue)}" stroke-width="${fix(14 * u)}" stroke-dasharray="${fix(ringR * 1.2)} ${fix(ringR * 0.8)}" stroke-linecap="round" stroke-opacity="0.7" transform="rotate(${fix(360 * t)} ${fix(ringCx)} ${fix(ringCy)})"/>` +
    shapes.join("") +
    `</svg>`;
}

const stamp = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}.${String(Math.round((s % 1) * 1000)).padStart(3, "0")}`;

/** A WebVTT file with one cue spanning the clip (the sample has no speech; the cue describes it). */
export function captionsVtt(seconds, text) {
  return `WEBVTT\n\n${stamp(0)} --> ${stamp(seconds)}\n${text}\n`;
}

async function encode({ slug, hue, accentHue, seconds, fps, width, height, mp4, webm, poster }) {
  const n = seconds * fps;
  const svg = (i) => Buffer.from(videoFrameSvg({ slug, hue, accentHue, width, t: i / n }));
  writeFileSync(poster, await sharp(svg(0)).webp({ quality: 75 }).toBuffer());
  const args = [
    "-y", "-hide_banner", "-loglevel", "error",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${width}x${height}`, "-r", String(fps), "-i", "pipe:0",
    "-c:v", "libx264", "-preset", "medium", "-crf", "26", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4,
    "-c:v", "libvpx-vp9", "-crf", "36", "-b:v", "0", "-deadline", "good", "-cpu-used", "4", "-row-mt", "1", "-pix_fmt", "yuv420p", "-an", webm,
  ];
  await new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, args, { stdio: ["pipe", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.stdin.on("error", () => {});
    p.on("error", reject);
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
 * Write `<slug>.mp4`, `<slug>.webm` and `<slug>-poster.webp` into outDir, encoding only when the cache (keyed by
 * every parameter) lacks them. Returns { generated, files }.
 */
export async function generateVideo({ slug, hue = 250, accentHue = 160, seconds = SECONDS, fps = FPS, width = WIDTH, outDir, cacheDir = CACHE_DIR }) {
  const height = Math.round((width * 9) / 16);
  const key = `${slug}-${width}x${height}-${fps}fps-${seconds}s-${hue}-${accentHue}`;
  mkdirSync(outDir, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });
  const outputs = [[".mp4", `${slug}.mp4`], [".webm", `${slug}.webm`], ["-poster.webp", `${slug}-poster.webp`]];
  const cached = (ext) => path.join(cacheDir, `${key}${ext}`);
  let generated = false;
  if (!outputs.every(([ext]) => existsSync(cached(ext)))) {
    await encode({ slug, hue, accentHue, seconds, fps, width, height, mp4: cached(".mp4"), webm: cached(".webm"), poster: cached("-poster.webp") });
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
