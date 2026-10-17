import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run, classesInCss } from "../gates/consistency.js";

const CSS =
  ".mt-4{margin-top:1rem}.md\\:ps-4{padding-inline-start:1rem}.\\[animation-timeline\\:view\\(\\)\\]{animation-timeline:view()}" +
  ".sda\\:animate-reveal{animation:var(--animate-reveal)}.text-lg{font-size:1.125rem}" +
  ".\\32 xl\\:px-8{padding-inline:2rem}.\\31 \\/2{width:50%}";

const page = (body) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>t</title></head><body>${body}</body></html>`;

const FIXTURES = {
  "ok.html": page('<h1 class="mt-4">A</h1><h2 class="text-lg">B</h2><div data-component="hero-split"></div>'),
  "escaped-classes.html": page('<h1 class="mt-4 md:ps-4 [animation-timeline:view()] sda:animate-reveal 2xl:px-8 1/2">A</h1>'),
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
  assert.ok(set.has("sda:animate-reveal"));
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

for (const [file, check] of [
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
    assert.deepEqual(checks(r), [check]);
    assert.equal(r.findings[0].file, path.join(dir, file));
  });
}
