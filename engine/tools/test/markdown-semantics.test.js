import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../lib/markdown.js";

test("abbreviations: the definition line disappears and every whole-word use gets an <abbr title>", () => {
  const html = renderMarkdown("*[PLC]: programmable logic controller\n\nA PLC runs the line. PLCs and APLC stay as they are; so does PLC's? No: PLC.");
  assert.ok(!html.includes("*[PLC]"));
  assert.equal(html.match(/<abbr title="programmable logic controller">PLC<\/abbr>/g).length, 3);
  assert.match(html, /PLCs and APLC/);
});

test("sub, sup, kbd, var and q, with their text escaped", () => {
  const html = renderMarkdown('CO~2~ over 40 m^2^. Press [[Ctrl]]+[[G]] for $n$ stations. "Now they have <both>," said Jonas. „Jetzt“ «الآن»');
  assert.match(html, /CO<sub>2<\/sub> over 40 m<sup>2<\/sup>/);
  assert.match(html, /<kbd>Ctrl<\/kbd>\+<kbd>G<\/kbd> for <var>n<\/var> stations/);
  assert.match(html, /<q>Now they have &lt;both&gt;,<\/q> said Jonas\. <q>Jetzt<\/q> <q>الآن<\/q>/);
});

test("code stays code: nothing inside backticks or fences is rewritten", () => {
  const html = renderMarkdown('Use `$n$ and "x"`.\n\n```\nCO~2~ [[Ctrl]]\n```');
  assert.match(html, /<code>\$n\$ and &quot;x&quot;<\/code>/);
  assert.match(html, /<pre><code>CO~2~ \[\[Ctrl\]\]\n<\/code><\/pre>/);
});

test("```samp fences render as program output", () => {
  assert.equal(renderMarkdown("```samp\nGenerated 14 rungs <ok>\n```"), "<pre><samp>Generated 14 rungs &lt;ok&gt;\n</samp></pre>");
});

test("a quotation ending in an em-dash line becomes figure > blockquote + figcaption, the work in <cite>", () => {
  const html = renderMarkdown("> Describe the line, not the ladder.\n>\n> — Priya Natarajan, *Control Engineering Review*\n\nAfter.");
  assert.equal(html, "<figure>\n<blockquote>\n<p>Describe the line, not the ladder.</p>\n</blockquote>\n<figcaption>— Priya Natarajan, <cite>Control Engineering Review</cite></figcaption>\n</figure>\n<p>After.</p>");
  assert.equal(renderMarkdown("> Just a quote."), "<blockquote>\n<p>Just a quote.</p>\n</blockquote>", "no dash line: an ordinary blockquote");
});
