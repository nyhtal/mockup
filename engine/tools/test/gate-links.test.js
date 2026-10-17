import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyLink } from "../gates/links.js";

const base = "http://127.0.0.1:4000", own = "https://example.com";

test("links on the served site and on the site's own origin are internal", () => {
  assert.equal(classifyLink("http://127.0.0.1:4000/en/", base, own), "internal");
  assert.equal(classifyLink("https://example.com/en/about/", base, own), "internal");
});

test("mailto, tel and sms links are not web requests and are neither internal nor external", () => {
  assert.equal(classifyLink("mailto:security@example.com", base, own), "scheme");
  assert.equal(classifyLink("tel:+442079460000", base, own), "scheme");
  assert.equal(classifyLink("sms:+442079460000", base, own), "scheme");
});

test("anything else is external", () => {
  assert.equal(classifyLink("https://fonts.googleapis.com/css", base, own), "external");
  assert.equal(classifyLink("https://example.org/", base, own), "external");
});
