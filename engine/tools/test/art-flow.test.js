// engine/tools/test/art-flow.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { FLOW_GREYS, flowTones, planesFlowSvg } from "../lib/art-flow.js";

sharp.cache(false);
const grey = (g) => "#" + g.toString(16).padStart(2, "0").repeat(3);
const greys = FLOW_GREYS.map(grey);

async function raster(svg) {
  const { data } = await sharp(Buffer.from(svg)).resize(1672, 941).greyscale().raw().toBuffer({ resolveWithObject: true });
  return data;
}

test("the twin is deterministic, carries no style, and groups its moving parts", () => {
  const a = planesFlowSvg({ tones: flowTones(250, 160), className: "x" });
  assert.equal(a, planesFlowSvg({ tones: flowTones(250, 160), className: "x" }));
  assert.doesNotMatch(a, /style/);
  assert.match(a, /^<svg [^>]*aria-hidden="true"/);
  assert.match(a, /^<svg [^>]*viewBox="0 0 1672 941"[^>]*preserveAspectRatio="xMidYMid slice"[^>]*class="x"/);
  for (const g of ["lines", "trail", "body"]) assert.match(a, new RegExp(`<g data-flow="${g}">`));
});

test("the twin takes the brand hues (Review Focus 1)", () => {
  assert.notDeepEqual(flowTones(250, 160), flowTones(25, 60));
  assert.equal(flowTones(250, 160).length, 5);
  assert.ok(flowTones(250, 160).every((t) => /^#[0-9a-f]{6}$/.test(t)));
});

test("at rest the twin matches the planes-flow raster", async () => {
  const src = await sharp("engine/art/planes-flow.webp").greyscale().raw().toBuffer();
  const out = await raster(planesFlowSvg({ tones: greys }));
  let sum = 0, off = 0;
  for (let i = 0; i < src.length; i++) {
    const d = Math.abs(src[i] - out[i]);
    sum += d;
    if (d > 48) off++;
  }
  assert.ok(sum / src.length <= 4, `mean difference ${(sum / src.length).toFixed(2)} > 4`);
  assert.ok(off / src.length <= 0.02, `${((100 * off) / src.length).toFixed(2)} % of pixels differ by more than 48 levels`);
});

test("at the extremes of the loop no hidden end shows (Review Focus 3)", async () => {
  // The worst relative offsets of the loop: the lines and the trail up to 40 px, the body up to 24 px, in any combination.
  for (const shift of [{ body: -24 }, { lines: -40, trail: -40 }, { body: -24, lines: -40, trail: -40 }, { body: -24, lines: -40 }, { trail: -40 }]) {
    const b = shift.body || 0;
    const out = await raster(planesFlowSvg({ tones: greys, shift }));
    const at = (x, y) => out[y * 1672 + x];
    // The channel pair ends under the ribbon's leg: across the leg at the channels' height it stays white.
    for (const y of [336, 359]) for (let x = 1010 + b; x <= 1090 + b; x += 2) assert.ok(at(x, y) > 200, `shift ${JSON.stringify(shift)}: a channel end shows on the leg at ${x},${y}`);
    // The trail pair starts under the mid band's leg: from that leg's edge it runs unbroken (no start, no gap, in view).
    for (const y of [531, 557]) for (let x = 1160 + b; x <= 1400; x += 2) assert.ok(at(x, y) > 165 && at(x, y) < 245, `shift ${JSON.stringify(shift)}: the trail breaks at ${x},${y}`);
  }
});
