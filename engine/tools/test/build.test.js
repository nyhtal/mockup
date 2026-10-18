import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, copyFileSync, rmSync, statSync } from "node:fs";

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
  assert.match(html, /<html lang="en" dir="ltr" class="scheme-light-dark scroll-pt-20 motion-safe:scroll-smooth">/);
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

test("enhance.js ships under 3 KB and only does what bylaw 06 allows", () => {
  const js = readFileSync("dist/reference/assets/enhance.js", "utf8");
  assert.ok(Buffer.byteLength(js) <= 3072, `${Buffer.byteLength(js)} B`);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /commandfor/);
  assert.match(js, /data-count/, "count-up (R-MOT-10 behaviour 3)");
  assert.match(js, /prefers-reduced-motion/, "count-up respects reduced motion");
  assert.match(js, /data-sound/, "sound toggle (R-MOT-10 behaviour 4)");
  assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|localStorage|document\.cookie/);
});

test("the visual layer of 0.5.0: mark in header and favicon, proof strip and highlight in the home hero, counting figures below the fold only, tiles two across, sound toggle with a name", () => {
  const home = readFileSync("dist/reference/en/index.html", "utf8");
  assert.match(home, /<header[^>]*>[\s\S]*?data-component="logo"[\s\S]*?<\/header>/, "the header carries the logo lockup");
  assert.match(readFileSync("dist/reference/icon.svg", "utf8"), /V42L42 64H/, "the favicon is the cut-corner mark");
  const hero = /<section[^>]*data-component="hero"[\s\S]*?<\/section>/.exec(home)[0];
  assert.match(hero, /lg:grid-cols-12/);
  assert.match(hero, /xl:text-6xl/);
  assert.match(hero, /lines automated/, "proof strip");
  assert.match(hero, /less downtime/, "highlight card");
  assert.doesNotMatch(hero, /data-count/, "nothing counts above the fold (R-MOT-11)");
  const stats = /<section[^>]*data-component="stats"[\s\S]*?<\/section>/.exec(home)[0];
  assert.equal((stats.match(/data-count/g) || []).length, 4, "every stat on the band counts");
  assert.match(stats, /to-accent-200/, "numerals end in the evidence colour");
  const team = readFileSync("dist/reference/en/about/team/index.html", "utf8");
  assert.match(team, /<ul class="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4">/, "team tiles two across from 320 px");
  assert.match(home, /<button type="button" data-sound aria-pressed="false"[^>]*>[\s\S]*?Sound effects/, "sound toggle is a named toggle button, off by default");
  assert.match(readFileSync("dist/reference/de/index.html", "utf8"), /Soundeffekte/);
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
  assert.match(ar, /class="h-6 xl:h-7 fill-ink w-auto"/);
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
  assert.match(de, /<body id="top" class="[^"]*hyphens-auto[^"]*wrap-anywhere/);
  const ar = readFileSync("dist/reference/ar/blog/reading-generated-code/index.html", "utf8");
  assert.match(ar, /<body id="top" class="[^"]*\[&_h1\]:leading-snug[^"]*\[&_\*\]:tracking-normal/);
  assert.match(ar, /<div class="max-w-prose text-base leading-loose/);
  assert.match(readFileSync("dist/reference/ar/careers/safety-assessor/index.html", "utf8"), /<div class="max-w-prose text-base leading-loose/);
  assert.doesNotMatch(readFileSync("dist/reference/ar/services/index.html", "utf8"), /→/);
  assert.match(readFileSync("dist/reference/ar/services/index.html", "utf8"), /#i-arrow-right"[\s\S]{0,40}<\/svg>/);
  assert.match(readFileSync("dist/reference/en/services/index.html", "utf8"), /rtl:-scale-x-100 rtl:group-hover:-translate-x-0\.5"><use href="#i-arrow-right">/);
  // Plural forms (Important 6): Arabic reading time is not "1 دقائق".
  assert.doesNotMatch(ar, /1 دقائق/);
  assert.match(ar, /دقيقة واحدة للقراءة|دقيقتان للقراءة|دقائق قراءة|دقيقة قراءة/);
  assert.match(readFileSync("dist/reference/en/search/index.html", "utf8"), /3 results for/);
  // Header at lg (Critical 3): label only from xl, wordmark h-7 until xl, CTA never wraps.
  const en = readFileSync("dist/reference/en/index.html", "utf8");
  assert.match(en, /<span class="hidden xl:inline">English<\/span>/);
  assert.match(en, /class="h-6 xl:h-7 fill-ink w-auto"/);
  assert.match(en, /<a href="\/en\/demo\/" class="hidden min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md/);
});

test("motion: smooth scrolling, floating back-to-top under sda, staggered item reveals without opacity, overlay entrances with blurred backdrops", () => {
  const html = readFileSync("dist/reference/en/index.html", "utf8");
  assert.match(html, /<html [^>]*class="[^"]*motion-safe:scroll-smooth/);
  assert.match(html, /data-component="back-to-top" data-variant="float"/);
  assert.match(html, /motion-safe:sda:animate-rise-in[^"]*motion-safe:sda:\[animation-timeline:scroll\(\)\]/);
  // Grid items reveal with a shifted range; sections never hide (no opacity-0 on a section).
  assert.match(html, /<li class="[^"]*motion-safe:sda:animate-reveal[^"]*motion-safe:sda:\[animation-range:entry_5%_cover_35%\]/);
  assert.doesNotMatch(html, /<section class="[^"]*opacity-0/);
  // Header shadow fades in on scroll; feature rows slide from the inline edges.
  assert.match(html, /<header class="[^"]*motion-safe:sda:after:animate-fade[^"]*motion-safe:sda:after:\[animation-timeline:scroll\(\)\]/);
  assert.match(html, /motion-safe:sda:animate-reveal-start/);
  assert.match(html, /motion-safe:sda:animate-reveal-end/);
  const guide = readFileSync("dist/reference/en/style-guide/controls/index.html", "utf8");
  assert.match(guide, /<dialog [^>]*class="[^"]*motion-safe:starting:open:backdrop:opacity-0/);
  assert.match(guide, /id="drawer"[^>]*class="[^"]*motion-safe:translate-x-full[^"]*motion-safe:starting:open:translate-x-full/);
  const css = readFileSync("dist/reference/assets/app.css", "utf8");
  assert.match(css, /--reveal-distance: ?24px/);
  assert.match(css, /@keyframes rise-in/);
  assert.match(css, /@keyframes reveal-end/);
});

test("micro-interactions: primary buttons lift, press and nudge their arrow (mirrored in RTL); cards warm their border; disclosure chevrons rotate; nav links grow an underline", () => {
  const en = readFileSync("dist/reference/en/index.html", "utf8");
  const primary = /<a href="\/en\/demo\/" class="group inline-flex [^"]*"[^>]*data-variant="primary"[^>]*>[\s\S]*?<\/a>/.exec(en)[0];
  assert.match(primary, /motion-safe:hover:-translate-y-px/);
  assert.match(primary, /active:scale-\[0\.98\]/);
  assert.match(primary, /hover:shadow-md/);
  assert.match(primary, /class="size-5 shrink-0 motion-safe:transition-transform motion-safe:duration-150 group-hover:translate-x-0\.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0\.5"><use href="#i-arrow-right">/);
  const services = readFileSync("dist/reference/en/services/index.html", "utf8");
  assert.match(services, /<li class="group relative flex flex-col[^"]*hover:border-brand-300/);
  assert.match(services, /<span class="mb-4 inline-flex size-12[^"]*group-hover:scale-105/);
  const faq = readFileSync("dist/reference/en/faq/index.html", "utf8");
  assert.match(faq, /<summary class="[^"]*"[^>]*>[\s\S]*?group-open:rotate-180/);
  assert.match(en, /<a href="\/en\/customers\/" class="[^"]*after:scale-x-0 after:origin-left rtl:after:origin-right[^"]*hover:after:scale-x-100/);
});

test("visual layer: hero glow and framed media, eyebrow accent rule, inset CTA panel, logo cloud hover, footer hairline, testimonial quote mark", () => {
  const en = readFileSync("dist/reference/en/index.html", "utf8");
  assert.match(en, /<section class="relative isolate overflow-hidden [^"]*"[^>]*data-component="hero"/);
  assert.match(en, /data-component="hero"[^>]*>\n<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 bg-hero-backdrop"><\/div>/);
  const css = readFileSync("dist/reference/assets/app.css", "utf8");
  assert.ok(css.includes(".bg-hero-backdrop{background-image:radial-gradient(44rem 26rem at 18% 20%,light-dark("), "hero backdrop glows in the CSS");
  assert.ok(!css.includes("var(--color-line) 1px") && css.includes("mask-image:radial-gradient(#000 25%,#0000 78%)"), "hero backdrop has an edge mask and no dot texture (0.5.0)");
  const guide = readFileSync("dist/reference/en/style-guide/sections/index.html", "utf8");
  assert.match(guide, /data-variant="centered">[\s\S]*?<div class="mt-12 overflow-hidden rounded-2xl ring-1 ring-line shadow-xl shadow-ink\/10">/, "centered hero media in a framed rounded-2xl box");
  assert.match(en, /<p class="[^"]*before:h-0\.5 before:w-3 before:rounded-full before:bg-accent-600[^"]*">Why Northwind<\/p>/);
  assert.match(en, /data-component="cta-band"[\s\S]*?<div class="relative isolate overflow-hidden rounded-2xl bg-linear-to-br from-brand-700 via-brand-600 to-accent-600/);
  assert.match(en, /data-component="logo-cloud"[\s\S]*?<svg role="img" class="h-6 fill-ink-muted w-auto motion-safe:transition-colors motion-safe:duration-150 hover:fill-ink-brand"/);
  assert.match(en, /<footer class="bg-surface-alt" data-component="footer">\n<div class="h-px bg-linear-to-r from-brand-600 to-accent-600" aria-hidden="true"><\/div>/);
  const svc = readFileSync("dist/reference/en/services/line-automation/index.html", "utf8");
  assert.match(svc, /data-component="testimonial" data-variant="single">\n<span aria-hidden="true" class="block h-12 select-none text-7xl font-bold leading-none text-brand-200">“<\/span>/);
});

test("home hero carries the generated sample clip: native video, poster, preload none, captions per locale, both formats under 1.5 MB", () => {
  for (const [loc, title] of [["en", "Northwind in eight seconds"], ["de", "Northwind in acht Sekunden"], ["ar", "نورثويند في ثماني ثوانٍ"]]) {
    const html = readFileSync(`dist/reference/${loc}/index.html`, "utf8");
    assert.match(html, /data-component="hero" data-variant="video"/, `${loc} hero variant`);
    assert.match(html, /<video class="aspect-video w-full" controls playsinline preload="none" poster="\/assets\/video\/northwind-sample-poster\.webp" width="1280" height="720">\n<source src="\/assets\/video\/northwind-sample\.webm" type="video\/webm">\n<source src="\/assets\/video\/northwind-sample\.mp4" type="video\/mp4">/, `${loc} video element`);
    assert.match(html, new RegExp(`<track kind="captions" src="/assets/video/northwind-sample-${loc}\.vtt" srclang="${loc}" data-cue="[^"]+">`), `${loc} captions track`);
    assert.ok(html.includes(`<span class="font-medium text-ink">${title}</span><span class="tabular-nums text-ink-muted">0:08</span>`), `${loc} title and duration`);
    assert.match(readFileSync(`dist/reference/assets/video/northwind-sample-${loc}.vtt`, "utf8"), /^WEBVTT\n\n00:00\.000 --> 00:08\.000\n.+\n$/, `${loc} vtt`);
  }
  for (const f of ["northwind-sample.mp4", "northwind-sample.webm", "northwind-sample-poster.webp"]) {
    const size = statSync(`dist/reference/assets/video/${f}`).size;
    assert.ok(size > 0 && size <= 1.5 * 1024 * 1024, `${f} is ${size} B`);
  }
});

test("review fixes: transitions name translate and scale, feature rows clip and mirror their slide, the script fallback is scoped to browsers without scroll-driven animation, staggered items fill both", () => {
  const en = readFileSync("dist/reference/en/index.html", "utf8");
  const ar = readFileSync("dist/reference/ar/index.html", "utf8");
  const svc = readFileSync("dist/reference/en/services/index.html", "utf8");
  const guide = readFileSync("dist/reference/en/style-guide/controls/index.html", "utf8");
  for (const [name, html] of [["en", en], ["ar", ar], ["controls", guide]]) {
    const lists = [...html.matchAll(/transition-\[([^\]]+)\]/g)].map((m) => m[1]);
    assert.ok(lists.length > 0, `${name} has transition lists`);
    for (const l of lists) assert.doesNotMatch(l, /transform|box-shadow/, `${name}: transition list "${l}" names a property Tailwind 4 never sets (transform) or R-MOT-01 forbids (box-shadow)`);
  }
  assert.match(en, /motion-safe:transition-\[color,background-color,border-color,translate,scale\]/, "button and card list");
  assert.match(en, /motion-safe:transition-\[opacity,translate,scale,display,overlay\][^>]*data-component="mobile-drawer"/, "drawer list");
  assert.match(guide, /<dialog[^>]*motion-safe:transition-\[opacity,translate,scale,display,overlay\]/, "dialog list");
  assert.match(en, /<section class="[^"]*overflow-x-clip[^"]*"[^>]*data-component="feature-rows"/, "feature rows clip horizontal overflow while rows slide in");
  assert.match(ar, /motion-safe:sda:animate-reveal-end rtl:motion-safe:sda:animate-reveal-start/, "rows mirror their slide in RTL");
  assert.match(en, /motion-safe:nosda:js:not-data-revealed:translate-y-4 motion-safe:nosda:js:data-revealed:translate-y-0/, "script fallback scoped to browsers without scroll-driven animation");
  assert.doesNotMatch(en, /motion-safe:js:not-data-revealed/, "no unscoped fallback remains");
  const css = readFileSync("dist/reference/assets/app.css", "utf8");
  assert.ok(css.includes("@supports not (animation-timeline:view())"), "nosda variant in the CSS");
  assert.match(svc, /motion-safe:sda:\[animation-range:entry_5%_cover_35%\] motion-safe:sda:\[animation-fill-mode:both\]/, "staggered items fill both so they never jump at their range start");
});

test("gate fixes: the floating back-to-top lives inside the footer landmark and every body grid is on the rhythm scale", () => {
  const en = readFileSync("dist/reference/en/index.html", "utf8");
  assert.match(en, /<footer[^>]*>[\s\S]*data-component="back-to-top" data-variant="float"[\s\S]*<\/footer>/, "floating back-to-top inside the footer");
  assert.doesNotMatch(en, /<\/footer>[\s\S]*data-component="back-to-top" data-variant="float"/, "not after the footer");
  for (const page of ["en/resources/index.html", "en/products/northwind-studio/index.html", "en/style-guide/sections/index.html", "en/style-guide/sections-c/index.html", "en/style-guide/sections-d/index.html"]) {
    const html = readFileSync(`dist/reference/${page}`, "utf8");
    assert.doesNotMatch(html, /<ul class="grid gap-6 (?!md:gap-8)/, `${page}: bare gap-6 body grid`);
  }
});
