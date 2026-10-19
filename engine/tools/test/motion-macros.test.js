import { test } from "node:test";
import assert from "node:assert/strict";
import nunjucks from "nunjucks";
import { flairFor } from "../lib/theme.js";

/** Render the shell's motion macros the way a section does, with the site's flair as global context (R-TOK-12, R-MOT-05, R-MOT-16). */
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader("engine/catalog"));
const render = (level, body) => {
  const flair = flairFor(level);
  return env.renderString(`{% from "sections/_shell.njk" import item, stagger, revealClasses, pop, depth with context %}${body}`, { flair, ctx: { reveal: true, flair } });
};

test("standard and expressive: a three-column grid arrives slide-in / rise / framed settle, ranges shifted 3 % per column and reset per row", () => {
  for (const level of ["standard", "expressive"]) {
    const html = render(level, "{% for i in [0,1,2,3] %}[{{ item(i, 3, ctx) }}]{% endfor %}");
    const cells = html.split("][").map((c) => c.replace(/[[\]]/g, ""));
    assert.match(cells[0], /animate-reveal-start rtl:motion-safe:sda:animate-reveal-end[^[]*cover_5%_cover_25%/, level);
    assert.match(cells[1], /animate-reveal motion-safe[^[]*cover_8%_cover_28%/, level);
    assert.match(cells[2], /animate-reveal-settle[^[]*cover_11%_cover_31%/, level);
    assert.match(cells[3], /animate-reveal-start[^[]*cover_5%_cover_25%/, `${level}: the second row starts over`);
  }
});

test("calm is rise only: no slides, settles, scales or pops, whatever the caller asks for (R-TOK-12)", () => {
  const html = render("calm", "{{ item(0, 3, ctx) }}|{{ item(2, 3, ctx, 'settle') }}|{{ stagger(1, 'start') }}|{{ revealClasses(true, 'scale') }}|{{ revealClasses(true, 'end') }}|{{ pop(ctx) }}");
  assert.doesNotMatch(html, /animate-reveal-(start|end|settle|scale)|animate-pop/);
  assert.equal((html.match(/motion-safe:sda:animate-reveal /g) || []).length, 5, "five rises");
});

test("expressive pops icons and the depth macro writes md:-only, mirrored drift (R-MOT-15)", () => {
  assert.match(render("expressive", "{{ pop(ctx) }}"), /motion-safe:sda:animate-pop/);
  assert.equal(render("standard", "{{ pop(ctx) }}").trim(), "");
  const drift = render("expressive", "{{ depth('drift', 'view()', 'cover_0%_cover_100%', 'before:') }}");
  assert.match(drift, /^ md:motion-safe:sda:before:animate-drift rtl:md:motion-safe:sda:before:animate-drift-end md:motion-safe:sda:before:\[animation-timeline:view\(\)\] md:motion-safe:sda:before:\[animation-range:cover_0%_cover_100%\]$/);
});
