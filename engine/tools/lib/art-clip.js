/**
 * Art clips (D65): an art-library piece in motion. Every frame is the recoloured picture itself (renderArt's pixels),
 * with soft notches of light streaming along the piece's rails toward the words on the start side, so a clip's still is
 * the picture and only the rails ever change. The rails are measured off the source raster; a piece without a measured
 * flow has no clip. The notches are evenly spaced around one cycle, so the clip loops on its first frame.
 */
import sharp from "sharp";
import { ramp } from "./art.js";

/**
 * Flows in source pixels. `runs`, in the order a notch takes them: a pair of rails ([top, bottom) rows) it crosses
 * together, entered at x = `from` and left at x = `to`; between runs it travels `gap` out of sight (under the joint).
 * `notches` share one `cycle` of track, so each one makes the whole trip once per loop; `half` is a notch's half-width.
 */
export const FLOWS = {
  "planes-flow": {
    source: [1672, 941],
    runs: [
      // The trail pair in the ribbon's hole, from the end edge into the joint.
      { from: 1672, to: 1158, rails: [[523, 539], [551, 564]] },
      // The channel pair above the mid pipe, from under the ribbon's leg to their open end by the words.
      { from: 988, to: 645, rails: [[330, 344], [354, 365]] },
    ],
    gap: 200,
    half: 40,
    notches: 4,
    cycle: 1280,
  },
};

/** Where each notch's centre is at time t ∈ [0, 1]: [{ run, x }] in source pixels, only for notches on a run. */
export function notchPositions(flow, t) {
  const out = [];
  for (let i = 0; i < flow.notches; i++) {
    let s = ((t + i / flow.notches) % 1) * flow.cycle;
    for (const run of flow.runs) {
      const length = run.from - run.to + 2 * flow.half;
      if (s < length) { out.push({ run, x: run.from + flow.half - s }); break; }
      s -= length + flow.gap;
      if (s < 0) break;
    }
  }
  return out;
}

/**
 * A clip of `art` at width × height in the dark tone of the two hues: { frame(t) → raw RGB Buffer }. The greyscale crop
 * is made once; each frame lights the rail pixels under a notch toward white in proportion to how much of the pixel is
 * rail (so the rail's own anti-aliased edges carry the light), then goes through the dark ramp.
 */
export async function artClip({ library, art, hue, accentHue, width, height }) {
  const flow = FLOWS[art];
  if (!flow) throw new Error(`art "${art}" has no flow measured, so it cannot make a clip (D65); pieces with one: ${Object.keys(FLOWS).join(", ")}`);
  const piece = library.pieces.get(art);
  if (!piece) throw new Error(`unknown art "${art}"`);
  const { data, info } = await sharp(piece.file).greyscale().resize(width, height, { fit: "cover", position: piece.crop }).raw().toBuffer({ resolveWithObject: true });
  const grey = new Uint8Array(width * height);
  for (let i = 0; i < grey.length; i++) grey[i] = data[i * info.channels];
  const lut = ramp("dark", hue, accentHue);
  const [sw, sh] = flow.source;
  const scale = Math.max(width / sw, height / sh);
  const ox = (sw * scale - width) / 2, oy = (sh * scale - height) / 2;
  return {
    async frame(t) {
      const g = grey.slice();
      for (const { run, x: cx } of notchPositions(flow, t)) {
        const x0 = Math.max(0, Math.floor(Math.max(run.to, cx - flow.half) * scale - ox));
        const x1 = Math.min(width - 1, Math.ceil(Math.min(run.from, cx + flow.half) * scale - ox));
        for (const [top, bottom] of run.rails) {
          const y0 = Math.max(0, Math.floor(top * scale - oy)), y1 = Math.min(height, Math.ceil(bottom * scale - oy));
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x <= x1; x++) {
              const d = ((x + ox) / scale - cx) / flow.half;
              if (Math.abs(d) >= 1) continue;
              const i = y * width + x, base = grey[i];
              const rail = Math.min(1, Math.max(0, (base - 20) / 180));
              g[i] = Math.round(base + (255 - base) * Math.cos((d * Math.PI) / 2) ** 2 * rail);
            }
          }
        }
      }
      const out = Buffer.alloc(width * height * 3);
      for (let i = 0; i < g.length; i++) {
        const k = g[i] * 3;
        out[i * 3] = lut[k];
        out[i * 3 + 1] = lut[k + 1];
        out[i * 3 + 2] = lut[k + 2];
      }
      return out;
    },
  };
}
