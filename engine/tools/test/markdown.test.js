import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown, tocOf, wordCount } from "../lib/markdown.js";

const md = "Intro paragraph.\n\n## Why it matters\n\nText.\n\n### A sub-point: details & more\n\nMore.\n\n## Next steps\n\nEnd.";

test("headings get stable slug ids and the toc lists h2 and h3 only", () => {
  const html = renderMarkdown(md);
  assert.match(html, /<h2 id="why-it-matters">Why it matters<\/h2>/);
  assert.match(html, /<h3 id="a-sub-point-details-more">A sub-point: details &amp; more<\/h3>/);
  assert.deepEqual(tocOf(md), [
    { id: "why-it-matters", text: "Why it matters", level: 2 },
    { id: "a-sub-point-details-more", text: "A sub-point: details & more", level: 3 },
    { id: "next-steps", text: "Next steps", level: 2 },
  ]);
});

test("duplicate headings get numbered ids and non-Latin headings keep their letters", () => {
  const html = renderMarkdown("## Setup\n\n## Setup\n\n## لماذا نحن");
  assert.match(html, /id="setup"[\s\S]*id="setup-2"/);
  assert.match(html, /<h2 id="لماذا-نحن">/);
});

test("wordCount counts words across scripts, ignoring markup", () => {
  assert.equal(wordCount("## Title\n\nOne two **three** four.\n\n- five\n- six"), 7);
  assert.equal(wordCount("هذا نص عربي قصير"), 4);
});
