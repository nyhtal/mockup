import { test } from "node:test";
import assert from "node:assert/strict";
import nunjucks from "nunjucks";
import { flairFor } from "../lib/theme.js";

/** Render a catalog template at one motion level, the way a page does: the site's flair as global context and in ctx (D66, D67). */
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader("engine/catalog"));
env.addFilter("t", (k) => k);
const render = (level, body) => {
  const flair = flairFor(level);
  return env.renderString(body, { flair, locale: "en", ctx: { reveal: true, flair, locale: "en" } });
};
const band = (level) => render(level, `{% import "sections/cta-band.njk" as band with context %}{{ band.render({ title: "T", text: "X", primary: { label: "Book a demo", href: "/en/demo/" }, secondary: { label: "Talk", href: "/en/contact/" } }, ctx) }}`);
const button = (level, variant) => render(level, `{% from "primitives/button.njk" import button with context %}{{ button("Go", { href: "/x/", variant: "${variant}" }) }}`);
const timeline = (level) => render(level, `{% from "components/timeline.njk" import timeline with context %}{{ timeline([{ date: "2020", dateIso: "2020", title: "A", text: "B" }], { reveal: true, gesture: ctx.reveal and flair.gesture }) }}`);

test("calm writes no gesture at all; the CTA panel keeps its green layer, static, so it looks as it always did (D66 review focus 4)", () => {
  const html = band("calm") + button("calm", "primary") + timeline("calm");
  assert.doesNotMatch(html, /gesture-|pending:visible/);
  assert.match(band("calm"), /<span aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-transparent from-50% to-accent-600 origin-bottom-right"><\/span>/, "the green layer without a gesture class");
  assert.doesNotMatch(button("calm", "primary"), /overflow-clip/, "no sheen, so nothing to clip");
});

test("standard plays each gesture once: the glow without its pulses, the arrow's nudge, the hover sheen, no periodic sheen", () => {
  const html = band("standard");
  assert.match(html, /to-accent-600 origin-bottom-right gesture-glow"/, "glow once");
  assert.doesNotMatch(html, /gesture-glow-repeat|gesture-shine-rare/, "no repeats in standard");
  assert.match(html, /gesture-nudge/);
  assert.match(html, /pending:visible/, "the panel arms its gestures");
  assert.match(button("standard", "primary"), /relative overflow-clip[\s\S]*<span class="gesture-shine"><\/span>/, "filled CTAs shine on hover");
  assert.doesNotMatch(button("standard", "secondary"), /gesture-shine/, "only filled CTAs shine");
  assert.match(timeline("standard"), /gesture-trace/);
});

test("expressive adds the repeats: the glow's pulses and the closing CTA's periodic sheen", () => {
  const html = band("expressive");
  assert.match(html, /gesture-glow-repeat/);
  assert.match(html, /<span class="gesture-shine-rare"><span class="gesture-shine"><\/span><\/span>/);
});
