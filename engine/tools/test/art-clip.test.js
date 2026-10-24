import { test } from "node:test";
import assert from "node:assert/strict";
import { loadLibrary, renderArt } from "../lib/art.js";
import { FLOWS, artClip } from "../lib/art-clip.js";

const library = loadLibrary();
const size = { width: 800, height: 450 };
const opts = { library, art: "planes-flow", hue: 250, accentHue: 160, ...size };

/** The rail boxes of planes-flow in output pixels, grown by `m` so the resize kernel's reach is inside them. */
function railBoxes(m = 3) {
  const s = size.width / 1672;
  return FLOWS["planes-flow"].runs.flatMap(({ from, to, rails }) => rails.map(([y0, y1]) => [to * s - m, from * s + m, y0 * s - m, y1 * s + m]));
}
const inRail = (x, y) => railBoxes().some(([x0, x1, y0, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);

test("an art clip's frames are the picture itself, lit only on the rails (D65)", async () => {
  const clip = await artClip(opts);
  const picture = await (await renderArt({ library, id: "planes-flow", tone: "dark", ...size, hue: 250, accentHue: 160 })).raw().toBuffer();
  for (const t of [0, 0.3, 0.7]) {
    const frame = await clip.frame(t);
    assert.equal(frame.length, size.width * size.height * 3, "raw RGB at the requested size");
    let lit = 0;
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        const i = (y * size.width + x) * 3;
        const diff = Math.abs(frame[i] - picture[i]) + Math.abs(frame[i + 1] - picture[i + 1]) + Math.abs(frame[i + 2] - picture[i + 2]);
        if (!diff) continue;
        assert.ok(inRail(x, y), `t=${t}: pixel ${x},${y} off the rails differs from the picture`);
        lit++;
      }
    }
    assert.ok(lit > 200, `t=${t}: notches of light are on the rails (${lit} pixels lit)`);
  }
});

test("an art clip loops: the frame at t = 1 is the frame at t = 0, and the light moves in between", async () => {
  const clip = await artClip(opts);
  const first = await clip.frame(0);
  assert.ok(first.equals(await clip.frame(1)), "the loop closes on its first frame");
  assert.ok(!first.equals(await clip.frame(0.1)), "the notches move");
});

test("the light runs toward the words: along the trail from the end edge, then out along the channels", async () => {
  const { runs, notches, cycle } = FLOWS["planes-flow"];
  assert.ok(runs.every((r) => r.from > r.to), "every run heads to the start side");
  assert.ok(runs[0].to > runs[1].from, "the trail comes first, the channels by the words second");
  const length = runs.reduce((n, r) => n + r.from - r.to, 0);
  assert.ok(cycle >= length, "every notch finishes its trip inside one loop");
  assert.ok(notches >= 3, "a stream, not a single blip");
});

test("an art without a measured flow cannot make a clip", async () => {
  await assert.rejects(artClip({ ...opts, art: "planes-energy" }), /planes-energy.*no flow/);
});
