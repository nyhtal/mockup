import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, copyFileSync, rmSync } from "node:fs";

function run(env = {}) {
  return execFileSync("node", ["engine/tools/build.js", "--site", "reference"], {
    env: { ...process.env, ...env },
    stdio: "pipe",
    encoding: "utf8",
  });
}

test("missing locale content fails the build naming the page", () => {
  copyFileSync("engine/i18n/en.json", "engine/i18n/de.json");
  try {
    assert.throws(() => run({ SITE_LOCALES_OVERRIDE: "en,de" }), (e) => {
      assert.match(e.stderr, /Locale "de" is missing page \/de\/index\.html/);
      return true;
    });
  } finally {
    rmSync("engine/i18n/de.json");
  }
});

test("build produces the reference home page and css", () => {
  run();
  assert.ok(existsSync("dist/reference/en/index.html"));
  assert.ok(existsSync("dist/reference/assets/app.css"));
  const html = readFileSync("dist/reference/en/index.html", "utf8");
  assert.match(html, /<html lang="en" dir="ltr">/);
  assert.match(html, /<link rel="stylesheet" href="\/assets\/app.css">/);
});
