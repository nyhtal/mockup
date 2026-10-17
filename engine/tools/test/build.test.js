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
      assert.match(e.stderr, /Locale "de" is missing page \/de\/[a-z/-]*index\.html/);
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
  assert.match(html, /<html lang="en" dir="ltr" class="scheme-light-dark scroll-pt-20">/);
  assert.match(html, /<link rel="stylesheet" href="\/assets\/app.css">/);
});

test("the head follows the fixed order of R-HTML-02", () => {
  const html = readFileSync("dist/reference/en/index.html", "utf8");
  const head = html.slice(html.indexOf("<head>"), html.indexOf("</head>"));
  const order = [
    /<meta charset/, /<meta name="viewport"/, /<title>/, /<meta name="description"/, /<link rel="canonical"/,
    /<link rel="alternate" hreflang="en"/, /<link rel="alternate" hreflang="x-default"/,
    /<meta name="theme-color"[^>]*light/, /<meta name="theme-color"[^>]*dark/,
    /<link rel="icon" href="\/favicon\.ico"/, /<link rel="icon" href="\/icon\.svg"/, /<link rel="apple-touch-icon"/,
    /<link rel="preload"[^>]*as="font"/, /<link rel="stylesheet"/,
    /<meta property="og:type"/, /<meta property="og:image"/, /<meta name="twitter:card"/, /<script type="application\/ld\+json">/,
  ];
  let pos = 0;
  for (const re of order) {
    const m = head.slice(pos).search(re);
    assert.ok(m >= 0, `${re} present after position ${pos}`);
    pos += m + 1;
  }
  assert.doesNotMatch(head, /<meta name="robots"/, "the home page is indexable");
});

test("engine-owned files and pages are generated", () => {
  for (const f of ["index.html", "404.html", "500.html", "en/404/index.html", "en/500/index.html", "sitemap.xml", "robots.txt", ".well-known/security.txt", "_headers", "headers.json", "_redirects", "redirects.json", "favicon.ico", "icon.svg", "apple-touch-icon.png", "icon-192.png", "assets/og/en.png"]) {
    assert.ok(existsSync(`dist/reference/${f}`), f);
  }
  assert.ok(!existsSync("dist/reference/og-manifest.json"), "the OG manifest is consumed and removed");
  assert.match(readFileSync("dist/reference/404.html", "utf8"), /<meta name="robots" content="noindex">/);
  assert.match(readFileSync("dist/reference/sitemap.xml", "utf8"), /<loc>https:\/\/example\.com\/en\/<\/loc>/);
  assert.doesNotMatch(readFileSync("dist/reference/sitemap.xml", "utf8"), /\/404\//);
  assert.match(readFileSync("dist/reference/index.html", "utf8"), /http-equiv="refresh" content="0; url=\/en\/"/);
});

test("the shell has one header with labelled navigation, a drawer trigger, one main and one footer", () => {
  const html = readFileSync("dist/reference/en/index.html", "utf8");
  assert.equal((html.match(/<header/g) || []).length, 1);
  assert.equal((html.match(/<main/g) || []).length, 1);
  assert.equal((html.match(/<footer/g) || []).length, 1);
  assert.match(html, /<nav aria-label="Main navigation"/);
  assert.match(html, /<nav aria-label="Footer navigation"/);
  assert.match(html, /<button[^>]*popovertarget="drawer"/);
  assert.match(html, /<div[^>]*popover[^>]*id="drawer"/);
  // A single-locale site has nothing to switch to; the switcher appears only with two or more locales (phase 4 covers it).
  assert.doesNotMatch(html, /popovertarget="locales"/);
  // The current page is marked in the primary navigation (R-A11Y-12): Customers is a plain nav link.
  assert.match(readFileSync("dist/reference/en/customers/index.html", "utf8"), /<a href="\/en\/customers\/"[^>]*aria-current="page"/);
});

test("enhance.js ships under 2 KB and only does what bylaw 06 allows", () => {
  const js = readFileSync("dist/reference/assets/enhance.js", "utf8");
  assert.ok(Buffer.byteLength(js) <= 2048, `${Buffer.byteLength(js)} B`);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /commandfor/);
  assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|localStorage|document\.cookie/);
});

test("the stylesheet is compiled from the built pages only, not from docs or bylaws", () => {
  const css = readFileSync("dist/reference/assets/app.css", "utf8");
  // `p-[13px]` appears in bylaw 02 as a forbidden example and nowhere in any page.
  assert.doesNotMatch(css, /p-\\\[13px\\\]/);
  assert.match(css, /\.text-4xl\{/, "classes used on the page are present");
});
