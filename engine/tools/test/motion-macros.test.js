import { test } from "node:test";
import assert from "node:assert/strict";
import nunjucks from "nunjucks";
import { flairFor } from "../lib/theme.js";

/** Render the shell's motion macros the way a section does, with the site's flair as global context (R-TOK-12, R-MOT-05, R-MOT-16). */
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader("engine/catalog"));
const render = (level, body) => {
  const flair = flairFor(level);
  return env.renderString(`{% from "sections/_shell.njk" import item, stagger, revealClasses, pop, zoom, depth with context %}${body}`, { flair, ctx: { reveal: true, flair } });
};
const cells = (html) => html.split("|");

test("standard and expressive: a three-column grid arrives slide-in / rise / framed settle, 90 ms apart, and every row starts over", () => {
  for (const level of ["standard", "expressive"]) {
    const [a, b, c, d] = cells(render(level, "{{ item(0, 3, ctx) }}|{{ item(1, 3, ctx) }}|{{ item(2, 3, ctx) }}|{{ item(3, 3, ctx) }}"));
    assert.match(a, /pending:-translate-x-\(--reveal-distance\) rtl:pending:translate-x-\(--reveal-distance\)/, level);
    assert.doesNotMatch(a, /delay-/, `${level}: the first column starts at once`);
    assert.match(b, /pending:translate-y-\(--reveal-distance\)(?! pending:scale)[^|]*delay-90/, level);
    assert.match(c, /pending:scale-94[^|]*delay-180/, level);
    assert.doesNotMatch(d, /delay-/, `${level}: the second row starts over`);
    for (const x of [a, b, c]) assert.match(x, /^ pending:opacity-0 .* motion-safe:data-revealed:transition-\[opacity,translate,scale\] motion-safe:data-revealed:duration-\(--reveal-duration\) motion-safe:data-revealed:ease-reveal/, "fade, move, and a transition that exists only once revealed");
  }
  const [s1, s2] = cells(render("standard", "{{ item(0, 4, ctx) }}|{{ item(3, 4, ctx) }}"));
  assert.match(s1, /pending:-translate-x-/);
  assert.match(s2, /pending:translate-x-\(--reveal-distance\) rtl:pending:-translate-x-[^|]*delay-270/, "four columns end with a slide from the end, 270 ms in");
});

test("calm is rise only: no slides, settles, scales or pops, whatever the caller asks for (R-TOK-12)", () => {
  const html = render("calm", "{{ item(0, 3, ctx) }}|{{ item(2, 3, ctx, 'settle') }}|{{ stagger(1, 'start') }}|{{ revealClasses(true, 'scale') }}|{{ revealClasses(true, 'end') }}|{{ pop(ctx) }}|{{ zoom(ctx) }}");
  assert.doesNotMatch(html, /translate-x|scale-9|scale-7|scale-115/);
  assert.equal((html.match(/pending:translate-y-\(--reveal-distance\)/g) || []).length, 5, "five rises");
});

test("lists cascade 70 ms per item and stop growing after eight; expressive pops icons 180 ms after their item; depth stays md-only and mirrored (R-MOT-03, R-MOT-15)", () => {
  assert.match(render("standard", "{{ stagger(3) }}"), /delay-210/);
  assert.match(render("standard", "{{ stagger(12) }}"), /delay-490/);
  assert.match(render("expressive", "{{ pop(ctx, 90) }}"), /pending:scale-70 pending:opacity-0 motion-safe:data-revealed:transition-\[opacity,scale\] [^|]*ease-spring motion-safe:data-revealed:delay-270/);
  assert.equal(render("standard", "{{ pop(ctx) }}").trim(), "", "no pop below expressive");
  assert.match(render("standard", "{{ zoom(ctx) }}"), /pending:scale-115 motion-safe:data-revealed:transition-\[scale\] motion-safe:data-revealed:duration-1200/);
  const drift = render("expressive", "{{ depth('drift', 'view()', 'cover_0%_cover_100%', 'before:') }}");
  assert.match(drift, /^ md:motion-safe:sda:before:animate-drift rtl:md:motion-safe:sda:before:animate-drift-end md:motion-safe:sda:before:\[animation-timeline:view\(\)\] md:motion-safe:sda:before:\[animation-range:cover_0%_cover_100%\]$/);
});
