import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { FLOW_GREYS, flowTones, planesFlowSvg } from "../lib/art-flow.js";

sharp.cache(false);
const grey = (g) => "#" + g.toString(16).padStart(2, "0").repeat(3);
const greys = FLOW_GREYS.map(grey);
const PARTS = ["lines", "trail", "ribbon", "corner", "reach", "joint", "base"];

test("the twin is deterministic, carries no style, and is built of parts the utility can assemble", () => {
  const a = planesFlowSvg({ tones: flowTones(250, 160), className: "x" });
  assert.equal(a, planesFlowSvg({ tones: flowTones(250, 160), className: "x" }));
  assert.doesNotMatch(a, /style/);
  assert.match(a, /^<svg [^>]*aria-hidden="true"/);
  assert.match(a, /^<svg [^>]*viewBox="0 0 1672 941"[^>]*preserveAspectRatio="xMidYMid slice"[^>]*class="x"/);
  assert.deepEqual([...a.matchAll(/data-part="([a-z]+)"/g)].map((m) => m[1]), PARTS, "parts in paint order");
  for (const run of ["in", "out"]) {
    const notches = new RegExp(`<g data-run="${run}">((?:<g opacity="0">(?:<rect [^>]*/>)+</g>)+)</g>`).exec(a);
    assert.ok(notches, `the ${run} notches are hidden at rest`);
    assert.equal(notches[1].match(/<g opacity="0">/g).length, 3, `three ${run} notches`);
  }
});

test("the twin takes the brand hues (Review Focus 1)", () => {
  assert.notDeepEqual(flowTones(250, 160), flowTones(25, 60));
  assert.equal(flowTones(250, 160).length, 6);
  assert.ok(flowTones(250, 160).every((t) => /^#[0-9a-f]{6}$/.test(t)));
});

test("at rest the twin matches the planes-flow raster", async () => {
  const src = await sharp("engine/art/planes-flow.webp").greyscale().raw().toBuffer();
  const { data: out } = await sharp(Buffer.from(planesFlowSvg({ tones: greys }))).resize(1672, 941).greyscale().raw().toBuffer({ resolveWithObject: true });
  let sum = 0, off = 0;
  for (let i = 0; i < src.length; i++) {
    const d = Math.abs(src[i] - out[i]);
    sum += d;
    if (d > 48) off++;
  }
  assert.ok(sum / src.length <= 4, `mean difference ${(sum / src.length).toFixed(2)} > 4`);
  assert.ok(off / src.length <= 0.02, `${((100 * off) / src.length).toFixed(2)} % of pixels differ by more than 48 levels`);
});

test("the assembly plays once, starts with the page and is over within 5 s, so it needs no pause (WCAG 2.2.2)", () => {
  const css = readFileSync("engine/theme/app.css", "utf8");
  const util = /@utility art-flow \{([\s\S]*?)\n\}/.exec(css)[1];
  const ms = (v) => (v.endsWith("ms") ? Number(v.slice(0, -2)) : Number(v.slice(0, -1)) * 1000);
  const token = (name) => /--animate-[a-z]+:\s*[a-z]+\s+(\d+m?s)\s+[^;]*;/.exec(css.match(new RegExp(`--animate-${name}:[^;]*;`))[0]);
  const assemble = ms(token("assemble")[1]), run = ms(token("run")[1]);
  assert.doesNotMatch(css.match(/--animate-(assemble|run):[^;]*;/g).join(" "), /infinite/, "nothing loops");
  const parts = [...util.matchAll(/animation-delay:\s*(\d+m?s)/g)].map((m) => ms(m[1]));
  assert.ok(parts.length >= 4, "the ribbon, the reach, the trail and the channels each have their moment");
  // Each run starts at its --art-at; its second and third notch follow by the calc() steps.
  const starts = [...util.matchAll(/--art-at:\s*(\d+m?s)/g)].map((m) => ms(m[1]));
  const steps = [...util.matchAll(/calc\(var\(--art-at\) \+ (\d+m?s)\)/g)].map((m) => ms(m[1]));
  assert.equal(starts.length, 2, "a run in and a run out");
  const last = Math.max(...starts) + Math.max(...steps) + run;
  assert.ok(Math.max(...parts) + assemble <= Math.min(...starts) + run, "the pipes are in place before the light has passed");
  assert.ok(last <= 5000, `the last notch ends at ${last} ms`);
  assert.ok(assemble <= 1200, "each part arrives on an entrance duration");
  assert.match(util, /& \[data-part\] \{\s*animation: var\(--animate-assemble\)/, "the base and the joint start with the page (no delay)");
  assert.match(util, /@media screen and \(prefers-reduced-motion: no-preference\)/, "motion only on screen and when allowed");
});
