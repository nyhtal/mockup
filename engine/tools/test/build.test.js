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
  copyFileSync("engine/i18n/en.json", "engine/i18n/xx.json");
  try {
    assert.throws(() => run({ SITE_LOCALES_OVERRIDE: "en,de,ar,xx" }), (e) => {
      assert.match(e.stderr, /Locale "xx" is missing page \/xx\/[a-z/-]*index\.html/);
      return true;
    });
  } finally {
    rmSync("engine/i18n/xx.json");
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
  // Three locales: the switcher is present and names languages natively (R-I18N-08).
  assert.match(html, /popovertarget="locales"/);
  assert.match(html, /lang="de"[^>]*>Deutsch</);
  assert.match(html, /lang="ar"[^>]*>العربية</);
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

test("three locales: alternates pair the same slug per locale, Arabic pages preload the Arabic face, the style guide exists in the default locale only", () => {
  const html = readFileSync("dist/reference/de/about/team/mei-chen/index.html", "utf8");
  assert.match(html, /<link rel="alternate" hreflang="en" href="https:\/\/example\.com\/en\/about\/team\/mei-chen\/">/);
  assert.match(html, /<link rel="alternate" hreflang="ar" href="https:\/\/example\.com\/ar\/about\/team\/mei-chen\/">/);
  assert.doesNotMatch(html, /hreflang="en" href="https:\/\/example\.com\/en\/about\/team\/priya/);
  const ar = readFileSync("dist/reference/ar/index.html", "utf8");
  assert.match(ar, /<html lang="ar" dir="rtl"/);
  assert.match(ar, /<link rel="preload" href="\/assets\/fonts\/noto-sans-arabic-arabic-wght-normal\.woff2"/);
  assert.match(readFileSync("dist/reference/en/index.html", "utf8"), /<link rel="preload" href="\/assets\/fonts\/inter-latin-wght-normal\.woff2"/);
  // Language names in the switcher render in the system font so no page downloads another script's face for one word (R-PERF-01).
  assert.match(ar, /lang="de"[^>]*class="[^"]*font-system/);
  assert.ok(existsSync("dist/reference/en/style-guide/index.html"));
  assert.ok(!existsSync("dist/reference/de/style-guide/index.html"), "the style guide shows English sample data: one copy, in the default locale (R-PAGE-09)");
});

test("UI strings on German and Arabic pages come from their locale, inside imported macros too (R-I18N-05)", () => {
  const ar = readFileSync("dist/reference/ar/careers/senior-controls-engineer/index.html", "utf8");
  assert.match(ar, />الانتقال إلى المحتوى</, "skip link");
  assert.match(ar, />الفريق</, "job-detail label");
  assert.doesNotMatch(ar, />(Skip to content|Menu|Team|Location|Posted|Back to top)</);
  const de = readFileSync("dist/reference/de/index.html", "utf8");
  assert.match(de, />Zum Inhalt springen</);
  assert.doesNotMatch(de, />(Skip to content|Menu|Back to top)</);
  // The font stack carries the Arabic face so Arabic text is not set in the Latin fallback.
  assert.match(readFileSync("dist/reference/assets/app.css", "utf8"), /"Inter Variable", "Noto Sans Arabic Variable"/);
  // Below sm the header keeps only the wordmark and the menu button; search and languages sit in the drawer (R-LAY-05).
  assert.match(ar, /popovertarget="locales"[^>]*>[\s\S]*?<span class="hidden xl:inline">/);
  assert.match(ar, /data-component="locale-switcher" class="hidden sm:block"/);
  assert.match(ar, /<a href="\/ar\/search\/" class="hidden size-11 sm:inline-flex/);
  assert.match(ar, /id="drawer"[\s\S]*<a href="\/ar\/search\/" class="[^"]*sm:hidden"/);
  assert.match(ar, /class="h-7 xl:h-8 fill-ink-brand w-auto"/);
});

test("every indexable page is in sitemap.xml, every og:image file exists, and the last breadcrumb is the page title (paginated detail pages included)", () => {
  const sitemap = readFileSync("dist/reference/sitemap.xml", "utf8");
  const de = readFileSync("dist/reference/de/blog/reading-generated-code/index.html", "utf8");
  assert.match(sitemap, /<loc>https:\/\/example\.com\/de\/blog\/reading-generated-code\/<\/loc>/);
  const og = /property="og:image" content="https:\/\/example\.com([^"]+)"/.exec(de)[1];
  assert.ok(existsSync(`dist/reference${og}`), `${og} exists`);
  const crumbs = /data-component="breadcrumbs">([\s\S]*?)<\/nav>/.exec(de)[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  assert.match(crumbs, /Generierten SPS-Code an einem Nachmittag lesen$/);
});


test("review fixes: German hyphenation and wrapping, Arabic leading and tracking, mirrored card arrow, plural strings, lg header", () => {
  const de = readFileSync("dist/reference/de/resources/downloads/downtime-calculator/index.html", "utf8");
  assert.match(de, /<body class="[^"]*hyphens-auto[^"]*wrap-break-word/);
  const ar = readFileSync("dist/reference/ar/blog/reading-generated-code/index.html", "utf8");
  assert.match(ar, /<body class="[^"]*\[&_h1\]:leading-snug[^"]*\[&_\*\]:tracking-normal/);
  assert.match(ar, /<div class="max-w-prose text-base leading-loose/);
  assert.match(readFileSync("dist/reference/ar/careers/safety-assessor/index.html", "utf8"), /<div class="max-w-prose text-base leading-loose/);
  assert.doesNotMatch(readFileSync("dist/reference/ar/services/index.html", "utf8"), /→/);
  assert.match(readFileSync("dist/reference/ar/services/index.html", "utf8"), /#i-arrow-right"[\s\S]{0,40}<\/svg>/);
  assert.match(readFileSync("dist/reference/en/services/index.html", "utf8"), /rtl:-scale-x-100"><use href="#i-arrow-right">/);
  // Plural forms (Important 6): Arabic reading time is not "1 دقائق".
  assert.doesNotMatch(ar, /1 دقائق/);
  assert.match(ar, /دقيقة واحدة للقراءة|دقيقتان للقراءة|دقائق قراءة|دقيقة قراءة/);
  assert.match(readFileSync("dist/reference/en/search/index.html", "utf8"), /3 results for/);
  // Header at lg (Critical 3): label only from xl, wordmark h-7 until xl, CTA never wraps.
  const en = readFileSync("dist/reference/en/index.html", "utf8");
  assert.match(en, /<span class="hidden xl:inline">English<\/span>/);
  assert.match(en, /class="h-7 xl:h-8 fill-ink-brand w-auto"/);
  assert.match(en, /<a href="\/en\/demo\/" class="hidden min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md/);
});
