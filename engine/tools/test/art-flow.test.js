// engine/tools/test/art-flow.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

/** The loop as app.css runs it: the cycle, and each group's travel and delay, read from the art-flow utility. */
function flowLoop() {
  const css = readFileSync("engine/theme/app.css", "utf8");
  const cycle = Number(/--animate-flow:\s*flow\s+([\d.]+)s/.exec(css)[1]);
  const groups = {};
  for (const g of ["body", "lines", "trail"]) {
    const block = new RegExp(`\\[data-flow="${g}"\\]\\s*\\{([^}]*)\\}`).exec(css)[1];
    groups[g] = { x: Number(/--flow-x:\s*(-?[\d.]+)px/.exec(block)[1]), delay: Number(/animation-delay:\s*([\d.]+)s/.exec(block)?.[1] || 0) };
  }
  return { cycle, groups };
}

/** CSS ease-in-out, cubic-bezier(0.42, 0, 0.58, 1), solved for x by bisection. */
function easeInOut(x) {
  const b = (t, p1, p2) => 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3;
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (b(m, 0.42, 0.58) < x) lo = m; else hi = m; }
  return b((lo + hi) / 2, 0, 1);
}

/** A group's offset at time t (s): at rest through its delay, then out to its travel at 50 % and back, each half eased. */
function offset({ x, delay }, cycle, t) {
  if (t < delay) return 0;
  const p = ((t - delay) % cycle) / cycle;
  return p < 0.5 ? x * easeInOut(p * 2) : x * (1 - easeInOut(p * 2 - 1));
}

test("through the whole loop no hidden end shows (Review Focus 3)", async () => {
  const { cycle, groups } = flowLoop();
  const end = cycle + Math.max(...Object.values(groups).map((g) => g.delay));
  for (let t = 0; t <= end; t += cycle / 48) {
    const shift = Object.fromEntries(Object.entries(groups).map(([k, g]) => [k, Math.round(offset(g, cycle, t))]));
    const { body: b, lines: l } = shift;
    const out = await raster(planesFlowSvg({ tones: greys, shift }));
    const at = (x, y) => out[y * 1672 + x];
    const when = `t ${t.toFixed(2)} s, shift ${JSON.stringify(shift)}`;
    // The channel pair runs unbroken from its free start to the ribbon's leg, under which it ends (no gap before the leg).
    for (const y of [336, 359]) for (let x = 650 + l; x <= 985 + b; x += 2) assert.ok(at(x, y) > 165 && at(x, y) < 245, `${when}: the channel breaks at ${x},${y}`);
    // The trail pair starts under the mid band's leg: from that leg's edge it runs unbroken (no start, no gap, in view).
    for (const y of [531, 557]) for (let x = 1160 + b; x <= 1400; x += 2) assert.ok(at(x, y) > 165 && at(x, y) < 245, `${when}: the trail breaks at ${x},${y}`);
  }
});

test("the loop starts at rest and moves at once on load", () => {
  const { cycle, groups } = flowLoop();
  for (const g of Object.values(groups)) assert.ok(Math.abs(offset(g, cycle, 0)) < 0.01);
  assert.equal(groups.body.delay, 0, "the body starts with the page");
  assert.ok(Math.abs(offset(groups.body, cycle, 2)) >= 12, "two seconds in, the body has moved at least 12 px");
});
