import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run, classesInCss } from "../gates/consistency.js";

const CSS =
  ".mt-4{margin-top:1rem}.md\\:ps-4{padding-inline-start:1rem}.\\[animation-timeline\\:view\\(\\)\\]{animation-timeline:view()}" +
  ".motion-safe\\:sda\\:animate-reveal{animation:var(--animate-reveal)}.text-lg{font-size:1.125rem}" +
  ".\\32 xl\\:px-8{padding-inline:2rem}.\\31 \\/2{width:50%}" +
  ".pl-4{padding-left:1rem}.text-left{text-align:left}.animate-fade{animation:fade 1s}.transition{transition-property:all}" +
  ".motion-safe\\:animate-fade{animation:fade 1s}.motion-safe\\:transition{transition-property:all}.p-\\[13px\\]{padding:13px}";

const DESC = "A description between one hundred and twenty and one hundred and fifty-five characters long, as bylaw R-HTML-03 asks for every page.";
const page = (body) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>t</title><meta name="description" content="${DESC}"></head><body>${body}</body></html>`;

const FIXTURES = {
  "ok.html": page('<h1 class="mt-4">A</h1><h2 class="text-lg">B</h2><div data-component="hero-split"></div>'),
  "physical-props.html": page('<h1 class="mt-4 pl-4 text-left">A</h1>'),
  "unsafe-motion.html": page('<h1 class="mt-4 animate-fade transition">A</h1>'),
  "safe-motion.html": page('<h1 class="mt-4 motion-safe:animate-fade motion-safe:transition">A</h1>'),
  "arbitrary-length.html": page('<h1 class="mt-4 p-[13px] [animation-timeline:view()]">A</h1>'),
  "hash-link.html": page('<h1>A</h1><a href="#">x</a><a href="javascript:void(0)">y</a>'),
  "img-attrs.html": page('<h1>A</h1><img src="/assets/images/a-16x9-480.webp" alt=""><img src="/b.webp" width="1" height="1" alt="" fetchpriority="high" loading="lazy"><img src="/c.webp" width="1" height="1" alt="">'),
  "img-ok.html": page('<h1>A</h1><img src="/a.webp" width="1" height="1" alt="" loading="lazy" decoding="async"><img src="/b.webp" width="1" height="1" alt="" fetchpriority="high" decoding="async">'),
  "meta-length.html": `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${"x".repeat(70)}</title><meta name="description" content="short"></head><body><h1>A</h1></body></html>`,
  "head-order.html": `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/app.css"><meta name="viewport" content="width=device-width"><title>t</title><meta name="description" content="${DESC}"><link rel="canonical" href="https://example.com/"></head><body><h1>A</h1></body></html>`,
  "escaped-classes.html": page('<h1 class="mt-4 md:ps-4 [animation-timeline:view()] motion-safe:sda:animate-reveal 2xl:px-8 1/2">A</h1>'),
  "noop-classes.html": page('<h1 class="group peer group/card">A</h1>'),
  "inline-style.html": page('<h1 style="color:red">A</h1>'),
  "two-h1.html": page("<h1>A</h1><h1>B</h1>"),
  "skip-heading.html": page("<h1>A</h1><h3>C</h3>"),
  "dup-id.html": page('<h1 id="x">A</h1><p id="x">B</p>'),
  "unknown-class.html": page('<h1 class="mt-4 nope-9">A</h1>'),
  "unknown-component.html": page('<h1>A</h1><div data-component="mystery"></div>'),
};

let dir;
before(() => {
  dir = mkdtempSync(path.join(tmpdir(), "consistency-"));
  writeFileSync(path.join(dir, "app.css"), CSS);
  for (const [name, html] of Object.entries(FIXTURES)) writeFileSync(path.join(dir, name), html);
});
after(() => rmSync(dir, { recursive: true, force: true }));

const ctx = (file) => ({ distDir: dir, only: [file], cssFile: path.join(dir, "app.css"), components: ["hero-split"] });
const checks = (r) => r.findings.map((f) => f.check);

test("classesInCss unescapes Tailwind selectors", () => {
  const set = classesInCss(CSS);
  assert.ok(set.has("md:ps-4"));
  assert.ok(set.has("[animation-timeline:view()]"));
  assert.ok(set.has("motion-safe:sda:animate-reveal"));
  assert.ok(set.has("2xl:px-8"), "hex escape \\32 followed by a space decodes to the digit 2");
  assert.ok(set.has("1/2"), "hex escape \\31 decodes to the digit 1");
});

test("a clean page passes", async () => {
  const r = await run(ctx("ok.html"));
  assert.equal(r.id, "consistency");
  assert.deepEqual(r.findings, []);
});

test("escaped variant and arbitrary classes are recognised in the built CSS", async () => {
  assert.deepEqual((await run(ctx("escaped-classes.html"))).findings, []);
});

test("group and peer marker classes are allowed", async () => {
  assert.deepEqual((await run(ctx("noop-classes.html"))).findings, []);
});

test("safe motion and arbitrary properties pass the new checks", async () => {
  assert.deepEqual((await run(ctx("safe-motion.html"))).findings, []);
});

test("img-attrs flags missing width/height, lazy on a priority image, and a non-priority image that is not lazy", async () => {
  const r = await run(ctx("img-attrs.html"));
  assert.deepEqual(checks(r), ["consistency/img-attrs", "consistency/img-attrs", "consistency/img-attrs", "consistency/img-attrs"]);
  assert.match(r.findings[3].message, /loading="lazy"/);
  assert.deepEqual((await run(ctx("img-ok.html"))).findings, []);
});

test("head-order reports the first tag out of order and meta-length reports the title and the description", async () => {
  assert.deepEqual(checks(await run(ctx("head-order.html"))), ["consistency/head-order"]);
  const r = await run(ctx("meta-length.html"));
  assert.deepEqual(checks(r).sort(), ["consistency/meta-length", "consistency/meta-length"]);
});

for (const [file, check] of [
  ["physical-props.html", "consistency/logical-props"],
  ["unsafe-motion.html", "consistency/motion-safe"],
  ["arbitrary-length.html", "consistency/no-arbitrary-lengths"],
  ["hash-link.html", "consistency/no-hash-links"],
  ["inline-style.html", "consistency/inline-style"],
  ["two-h1.html", "consistency/single-h1"],
  ["skip-heading.html", "consistency/heading-order"],
  ["dup-id.html", "consistency/dup-id"],
  ["unknown-class.html", "consistency/class-exists"],
  ["unknown-component.html", "consistency/component-known"],
]) {
  test(`${file} reports ${check}`, async () => {
    const r = await run(ctx(file));
    assert.equal(r.ok, false);
    assert.deepEqual([...new Set(checks(r))], [check]);
    assert.equal(r.findings[0].file, path.join(dir, file));
  });
}

test("rhythm: sections need an allowed padding pair, a heading group needs mt-12 md:mt-16 before the body, and body grids an allowed gap", async () => {
  const { rhythmFindings } = await import("../gates/consistency.js");
  const { parse: parseHtml } = await import("node-html-parser");
  const ok = parseHtml('<section class="py-16 md:py-24 bg-surface" data-component="x"><div class="mx-auto"><div class="max-w-3xl"><h2>T</h2></div><div class="mt-12 md:mt-16"><ul class="grid gap-6 md:gap-8"><li>a</li></ul></div></div></section><section class="border-y py-6 bg-surface" data-component="article-meta"><div></div></section>');
  assert.deepEqual(rhythmFindings(ok), []);
  const bad = parseHtml('<section class="py-14 bg-surface" data-component="x"><div class="mx-auto"><div class="max-w-3xl"><h2>T</h2></div><div class="mt-8"><div class="grid gap-5"><p>a</p></div></div></div></section>');
  const msgs = rhythmFindings(bad);
  assert.equal(msgs.length, 3, msgs.join(" | "));
  assert.match(msgs[0], /section "x" padding "py-14"/);
  assert.match(msgs[1], /heading group of "x" is followed by "mt-8"/);
  assert.match(msgs[2], /grid in "x" uses "gap-5"/);
});

test("rhythm: off-scale extra breakpoints, hero padding outside heroes, strip padding outside strips and unlisted gaps are findings", async () => {
  const { rhythmFindings } = await import("../gates/consistency.js");
  const { parse: parseHtml } = await import("node-html-parser");
  const sec = (cls, name = "x", grid = "grid gap-6 md:gap-8") => parseHtml(`<section class="${cls} bg-surface" data-component="${name}"><div class="mx-auto"><div class="${grid}"><p>a</p></div></div></section>`);
  for (const [cls, name] of [["py-6 md:py-24", "x"], ["py-16 md:py-24 lg:py-40", "x"], ["py-16 md:py-28", "faq"], ["py-12 md:py-16", "hero"], ["py-6", "faq"], ["py-16 md:py-24", "pagination"]]) {
    const m = rhythmFindings(sec(cls, name));
    assert.equal(m.length, 1, `${name} "${cls}": ${m.join(" | ") || "no finding"}`);
    assert.match(m[0], /padding/);
  }
  for (const grid of ["grid gap-6 md:gap-10", "grid gap-8 md:gap-2", "grid gap-6"]) {
    const m = rhythmFindings(sec("py-16 md:py-24", "x", grid));
    assert.equal(m.length, 1, `"${grid}": ${m.join(" | ") || "no finding"}`);
    assert.match(m[0], /grid in "x"/);
  }
  assert.deepEqual(rhythmFindings(sec("py-16 md:py-28", "hero")), []);
  assert.deepEqual(rhythmFindings(sec("py-12 md:py-20", "hero")), []);
  assert.deepEqual(rhythmFindings(sec("py-12 md:py-16", "page-header")), []);
  assert.deepEqual(rhythmFindings(sec("py-6", "pagination")), []);
  assert.deepEqual(rhythmFindings(sec("py-16 md:py-24", "resource-tabs")), [], "resource-tabs is a full section, not a strip");
  assert.deepEqual(rhythmFindings(sec("py-16 md:py-24", "x", "grid gap-12")), []);
});
