import { test } from "node:test";
import assert from "node:assert/strict";
import { planSections } from "../lib/sections.js";

const samples = { byId: { hero: { id: "hero", type: "hero" }, grid: { id: "grid", type: "feature-grid" }, band: { id: "band", type: "cta-band" } } };
const opts = { locale: "en", pageUrl: "/en/about/", density: "comfortable", breadcrumbs: [{ name: "Home", url: "/en/" }, { name: "About", url: "/en/about/" }] };

test("ids resolve to samples and unknown ids fail loudly", () => {
  assert.equal(planSections(samples, ["hero"], opts)[0].s.type, "hero");
  assert.throws(() => planSections(samples, ["nope"], opts), /Unknown sample section id "nope"/);
});

test("surfaces alternate after non-media sections and reset after media sections; the first section never reveals", () => {
  const plan = planSections(samples, ["hero", "grid", { type: "feature-grid" }, "band", "grid"], opts);
  assert.deepEqual(plan.map((p) => p.ctx.surface), ["bg-surface", "bg-surface", "bg-surface-alt", "bg-surface", "bg-surface"]);
  assert.deepEqual(plan.map((p) => p.ctx.reveal), [false, true, true, false, true]);
});

test("every section's ctx carries the page's breadcrumbs, locale, url, density and demote flag", () => {
  const [step] = planSections(samples, ["grid"], { ...opts, demote: true });
  assert.deepEqual(step.ctx.breadcrumbs, opts.breadcrumbs);
  assert.equal(step.ctx.locale, "en");
  assert.equal(step.ctx.pageUrl, "/en/about/");
  assert.equal(step.ctx.demote, true);
});
