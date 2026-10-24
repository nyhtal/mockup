import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, copyFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";

function run(env = {}) {
  return execFileSync("node", ["engine/tools/build.js", "--site", "reference"], {
    env: { ...process.env, ...env },
    stdio: "pipe",
    encoding: "utf8",
  });
}

test("missing locale content fails the build naming the page", () => {
  copyFileSync("engine/i18n/en.json", "engine/i18n/xx.json");
  // Every locale the site has, plus one with no content: dropping one would leave its pages without their section data.
  const { locales } = JSON.parse(readFileSync("sites/reference/site.json", "utf8"));
  try {
    assert.throws(() => run({ SITE_LOCALES_OVERRIDE: [...locales, "xx"].join(",") }), (e) => {
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
  assert.match(html, /<html lang="en" dir="ltr" class="scheme-light-dark data-\[theme=light\]:scheme-light data-\[theme=dark\]:scheme-dark scroll-pt-20 motion-safe:scroll-smooth \[interpolate-size:allow-keywords\]">/);
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
  assert.match(readFileSync("dist/reference/sitemap.xml", "utf8"), /<loc>https:\/\/northwind-dynamics\.com\/en\/<\/loc>/);
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

test("enhance.js ships under 5 KB (D55) and only does what bylaw 06 allows", () => {
  const js = readFileSync("dist/reference/assets/enhance.js", "utf8");
  assert.ok(Buffer.byteLength(js) <= 5120, `${Buffer.byteLength(js)} B`);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /pending:/, "entrances are triggered by the script, once, as each element crosses 88 % of the viewport (R-MOT-10 behaviour 1)");
  assert.match(js, /innerHeight\*\.88/, "elements already in view at load are revealed before the pending: state can apply (R-MOT-11)");
  assert.doesNotMatch(js, /getBoundingClientRect/, "positions at load come from the observer's first report, never a forced layout: that layout was a 170 ms long task on the home page (Lighthouse mobile TBT, 2026-10-22)");
  assert.match(js, /boundingClientRect\.top<innerHeight\*\.88/, "the first report marks what is in view or above it");
  assert.match(js, /^const [^\n]*;\nh\.dataset\.js="";/, "data-js is set synchronously, so js: controls are there at first paint and shift nothing");
  assert.match(js, /h\.dataset\.entrances=""/, "data-entrances is set after the first report");
  assert.match(js, /commandfor/);
  assert.match(js, /data-count/, "count-up (R-MOT-10 behaviour 3)");
  assert.match(js, /dataset\.decimals/, "precision comes from the build, not from parsing text");
  assert.match(js, /prefers-reduced-motion/, "count-up respects reduced motion");
  assert.match(js, /data-sound/, "sound toggle (R-MOT-10 behaviour 4)");
  assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|document\.cookie/);
  assert.deepEqual([...new Set(js.match(/localStorage\.\w+\("[^"]*"/g).map((x) => x.replace(/localStorage\.\w+\(/, "")))], ['"theme"'], "localStorage holds the theme choice and nothing else (D54)");
});

test("light/dark switch: the head script applies a saved choice before first paint, the CSP allows exactly that script, toggles sit in the header, drawer and footer (D54)", async () => {
  const { THEME_SCRIPT, THEME_SCRIPT_HASH } = await import("../lib/theme-script.js");
  const home = readFileSync("dist/reference/en/index.html", "utf8");
  assert.ok(home.includes(`<meta name="viewport" content="width=device-width, initial-scale=1">\n<script>${THEME_SCRIPT}</script>`), "inline theme script right after the viewport");
  assert.equal((home.match(/<script>/g) || []).length, 1, "one inline script");
  assert.ok(readFileSync("dist/reference/_headers", "utf8").includes(`script-src 'self' ${THEME_SCRIPT_HASH};`), "the CSP allows it by hash");
  assert.match(home, /<html [^>]*class="scheme-light-dark data-\[theme=light\]:scheme-light data-\[theme=dark\]:scheme-dark /);
  assert.equal((home.match(/data-component="theme-toggle"/g) || []).length, 3, "header, drawer, footer");
  assert.match(home, /<button type="button" data-theme-toggle aria-pressed="false" class="group hidden xl:js:inline-flex size-11[^"]*"[^>]*>[\s\S]*?Dark theme/);
  assert.match(readFileSync("dist/reference/de/index.html", "utf8"), /Dunkles Design/);
});

test("the visual layer of 0.5.0: mark in header and favicon, a proof strip in the home hero and a highlight in the split hero, counting figures below the fold only, tiles two across, sound toggle with a name", () => {
  const home = readFileSync("dist/reference/en/index.html", "utf8");
  assert.match(home, /<header[^>]*>[\s\S]*?data-component="logo"[\s\S]*?<\/header>/, "the header carries the logo lockup");
  assert.match(readFileSync("dist/reference/icon.svg", "utf8"), /V42L42 64H/, "the favicon is the cut-corner mark");
  // Since 0.11.0 the home page opens on a backdrop hero: text over the art, no highlight card (R-SEC-07).
  const hero = /<section[^>]*data-component="hero"[\s\S]*?<\/section>/.exec(home)[0];
  assert.match(hero, /data-variant="backdrop"/);
  assert.match(hero, /lg:min-h-144/);
  assert.match(hero, /xl:text-6xl xl:\[&amp;:lang\(de\)\]:text-5xl|xl:text-6xl xl:\[&:lang\(de\)\]:text-5xl/);
  assert.match(hero, /lines automated/, "proof strip");
  assert.doesNotMatch(hero, /less downtime/, "a backdrop hero has no highlight card");
  assert.doesNotMatch(hero, /data-count/, "nothing counts above the fold (R-MOT-11)");
  // The split hero keeps the twelve columns, the proof strip and the highlight card; the style guide shows it.
  const heroes = readFileSync("dist/reference/sys/style-guide/sections/heroes/index.html", "utf8");
  const split = /<section[^>]*id="section-hero-split"[\s\S]*?<\/section>/.exec(heroes)[0];
  assert.match(split, /lg:grid-cols-12/);
  assert.match(split, /lines automated/, "proof strip");
  assert.match(split, /less downtime/, "highlight card");
  assert.doesNotMatch(split, /data-count/, "nothing counts in a hero (R-MOT-11)");
  const stats = /<section[^>]*data-component="stats"[\s\S]*?<\/section>/.exec(home)[0];
  assert.equal((stats.match(/data-count="/g) || []).length, 4, "every stat on the band counts");
  assert.match(stats, /<span class="inline-grid"><span class="invisible \[grid-area:1\/1\]" aria-hidden="true">99\.98%<\/span><span class="\[grid-area:1\/1\] whitespace-nowrap motion-safe:data-counted:animate-settle" aria-hidden="true" data-count="99.98" data-decimals="2" data-nu="latn">99\.98%<\/span><span class="sr-only">99\.98%<\/span><\/span>/, "the counting triple: sizing copy, animated copy with build-time attributes, screen-reader copy (R-MOT-10)");
  assert.match(readFileSync("dist/reference/de/index.html", "utf8"), /data-count="99.98" data-decimals="2" data-nu="latn">99,98/, "German figures parse with the decimal comma");
  // Depth (R-MOT-15): md+ only, scroll(root) in the hero, the element's own view() elsewhere, drift mirrored in RTL, nothing on hero text.
  assert.match(hero, /<img[^>]*fetchpriority="high"[^>]*class="absolute inset-0 size-full object-cover md:motion-safe:sda:scale-115 md:motion-safe:sda:translate-y-4 md:motion-safe:sda:animate-parallax-md md:motion-safe:sda:\[animation-timeline:scroll\(root\)\] md:motion-safe:sda:\[animation-range:0_80vh\]"/, "the backdrop art sinks on scroll(root), overscanned, at identity at rest");
  assert.doesNotMatch(/<div class="max-w-2xl lg:w-7\/12[\s\S]*?<\/ul>/.exec(hero)?.[0] || "", /parallax|drift/, "no depth on the hero's text column");
  assert.match(split, /md:motion-safe:sda:animate-parallax-sm md:motion-safe:sda:\[animation-timeline:scroll\(root\)\] md:motion-safe:sda:\[animation-range:0_80vh\][^"]*bg-hero-backdrop/, "the split hero's glows sink on scroll(root)");
  assert.doesNotMatch(/<div class="lg:col-span-7[\s\S]*?<\/ul>/.exec(split)?.[0] || "", /parallax|drift/, "no depth on the split hero's text column");
  assert.match(split, /<img[^>]*class="aspect-\[4\/3\] w-full object-cover md:motion-safe:sda:scale-115 md:motion-safe:sda:translate-y-4 md:motion-safe:sda:animate-parallax-md md:motion-safe:sda:\[animation-timeline:scroll\(root\)\]/, "the split hero picture sinks, overscanned, at identity at rest");
  assert.match(home, /<img[^>]*class="aspect-\[4\/3\] w-full object-cover md:motion-safe:sda:scale-110 md:motion-safe:sda:animate-parallax-md md:motion-safe:sda:\[animation-timeline:view\(\)\] md:motion-safe:sda:\[animation-range:cover_0%_cover_100%\] pending:scale-115 motion-safe:data-revealed:transition-\[scale\] motion-safe:data-revealed:duration-1200 motion-safe:data-revealed:ease-reveal"/, "media-row pictures settle from 115 % as they enter, then sit deeper on their own passage");
  assert.match(stats, /before:to-accent-600\/25 md:motion-safe:sda:before:animate-parallax-sm/, "the stats backdrop moves slower than the band");
  assert.match(home, /before:blur-3xl md:motion-safe:sda:before:animate-drift rtl:md:motion-safe:sda:before:animate-drift-end/, "the CTA highlight drifts and mirrors");
  assert.match(home, /gap-y-8 reveal-items md:motion-safe:sda:animate-drift rtl:md:motion-safe:sda:animate-drift-end/, "the logo cloud drifts");
  assert.doesNotMatch(home, /(?<!md:)motion-safe:sda:(?:before:)?animate-(?:parallax|drift)/, "no depth below md");
  // Accents (Task 5): the reading-progress hairline on every page's header. About's story has been a feature spotlight since 0.12.0, so no reference page shows the sticky editorial row any more.
  assert.match(home, /<header class="\[anchor-name:--header\] sticky top-0[^"]*before:-bottom-px before:hidden before:h-px before:origin-left rtl:before:origin-right before:bg-linear-to-r before:from-brand-600 before:to-accent-600 motion-safe:sda:before:block motion-safe:sda:before:animate-progress motion-safe:sda:before:\[animation-timeline:scroll\(root\)\]/, "progress hairline under the header (R-MOT-08)");
  const about = readFileSync("dist/reference/en/about/index.html", "utf8");
  assert.match(about, /data-component="feature-spotlight"/, "About's story is a spotlight (0.12.0)");
  assert.match(stats, /to-accent-200/, "numerals end in the evidence colour");
  const team = readFileSync("dist/reference/en/about/team/index.html", "utf8");
  assert.match(team, /<ul class="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4 reveal-items">/, "team tiles two across from 320 px, on the item distance");
  assert.match(home, /<button type="button" data-sound aria-pressed="false"[^>]*>[\s\S]*?Sound effects/, "sound toggle is a named toggle button, off by default");
  assert.match(readFileSync("dist/reference/de/index.html", "utf8"), /Soundeffekte/);
});

test("every disclosure opens and closes smoothly: details content animates height and opacity, html interpolates to auto (R-MOT-06)", () => {
  const faq = readFileSync("dist/reference/en/faq/index.html", "utf8");
  assert.match(faq, /<html [^>]*class="[^"]*\[interpolate-size:allow-keywords\]/);
  const details = faq.match(/<details [^>]*>/g) || [];
  assert.ok(details.length > 5, "the FAQ has disclosures");
  for (const d of details) assert.match(d, /class="[^"]*\bdisclosure(-tabs)?\b/, `every details animates: ${d.slice(0, 80)}`);
  const resources = readFileSync("dist/reference/en/resources/index.html", "utf8");
  assert.match(resources, /<details class="group md:contents[^"]* disclosure-tabs"/, "tabs use the tab variant: height below md, fade only at md and up");
  const css = readFileSync("dist/reference/assets/app.css", "utf8");
  assert.ok(css.includes("interpolate-size:allow-keywords"));
  assert.match(css, /\.disclosure::details-content\{[^}]*block-size:0/, "the disclosure utility closes to height 0");
  assert.match(css, /content-visibility \.3s var\(--ease-reveal\) allow-discrete/, "closing plays before hiding");
});

test("locale switcher: the panel is anchored under its own button, with the viewport-fixed placement only as a fallback", () => {
  const en = readFileSync("dist/reference/en/index.html", "utf8");
  const sw = /<div data-component="locale-switcher"[^>]*>[\s\S]*?<div popover id="locales"[^>]*>/.exec(en)[0];
  assert.match(sw, /<button type="button" popovertarget="locales" class="\[anchor-name:--locales\] /);
  assert.match(sw, /<div popover id="locales" class="fixed top-16 end-4 start-auto bottom-auto m-0 w-56 [^"]*supports-\[position-area:block-end\]:inset-auto[^"]*\[position-anchor:--locales\][^"]*\[position-area:block-end_span-inline-end\][^"]*\[position-try-fallbacks:flip-inline\]/);
});

test("opening group (R-LAY-02): a page header joins a plain first section at 48/64 px; strips and brand bands keep the full header padding; no page misses a join", () => {
  const read = (u) => readFileSync(`dist/reference${u}index.html`, "utf8");
  const pair = (u) => {
    const m = /<(section|header) class="([^"]*)" data-component="page-header"[^>]*>[\s\S]*?<\/\1>\s*<section class="([^"]*)"[^>]*data-component="([a-z-]+)"/.exec(read(u));
    assert.ok(m, `${u}: page header followed by a section`);
    const pad = (c) => c.split(/\s+/).filter((t) => /^(md:)?p[ytb]-/.test(t)).join(" ");
    return { tag: m[1], header: pad(m[2]), next: m[4], nextPad: pad(m[3]) };
  };
  assert.deepEqual(pair("/en/about/"), { tag: "section", header: "pt-12 md:pt-16", next: "feature-spotlight", nextPad: "pt-12 md:pt-16 pb-16 md:pb-24" }, "a split header joins like a plain one");
  assert.deepEqual(pair("/en/services/"), { tag: "section", header: "py-16 md:py-24", next: "service-cards", nextPad: "py-16 md:py-24" }, "a banner header is a band of its own (0.11.0)");
  assert.deepEqual(pair("/en/careers/"), { tag: "section", header: "py-12 md:py-16", next: "feature-grid", nextPad: "py-16 md:py-24" }, "a band header keeps its padding under its picture (0.11.0)");
  assert.deepEqual(pair("/ar/about/"), { tag: "section", header: "pt-12 md:pt-16", next: "feature-spotlight", nextPad: "pt-12 md:pt-16 pb-16 md:pb-24" });
  assert.deepEqual(pair("/en/legal/privacy/"), { tag: "header", header: "pt-12 md:pt-16", next: "prose", nextPad: "pt-12 md:pt-16 pb-16 md:pb-24" }, "an article without a byline joins its header to the prose");
  assert.deepEqual(pair("/en/blog/reading-generated-code/"), { tag: "header", header: "py-12 md:py-16", next: "article-meta", nextPad: "py-6" }, "the byline strip sits between header and prose");
  assert.deepEqual(pair("/en/customers/alder-foods/"), { tag: "header", header: "py-12 md:py-16", next: "stats", nextPad: "py-16 md:py-24" }, "a brand band after the header");
  const missed = [];
  // The element right after the header's own closing tag (a page header holds no nested section or header) is a plain section with full padding.
  const unjoined = (html) => {
    const m = /<(section|header) class="[^"]*" data-component="page-header">/.exec(html);
    if (!m) return false;
    const end = html.indexOf(`</${m[1]}>`, m.index) + m[1].length + 3;
    return /^\s*<section class="py-1[26] md:py-(?:24|16) bg-surface[ "]/.test(html.slice(end));
  };
  const walk = (dir) => { for (const e of readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else if (e.name === "index.html" && unjoined(readFileSync(p, "utf8"))) missed.push(p); } };
  walk("dist/reference");
  assert.deepEqual(missed, [], "every page header above a plain section on the page surface is joined to it");
});

test("top navigation: wide menus put every link on one row; Company is a compact single-column dropdown anchored to its button and lists the culture page", () => {
  const en = readFileSync("dist/reference/en/careers/culture/index.html", "utf8");
  const nav = /<nav [^>]*data-component="nav-menu">[\s\S]*?<\/nav>/.exec(en)[0];
  assert.match(nav, /<div popover id="menu-1"[^>]*>\n<ul class="mx-auto grid [^"]*grid-cols-4">/, "Services: four links, four columns");
  // The wide panels hang from the header itself, not from the window's top edge, so they open below the links even while the announcement bar pushes the header down (owner, 2026-10-21).
  assert.match(en, /<header class="\[anchor-name:--header\] sticky top-0 /);
  assert.match(nav, /<div popover id="menu-1" class="fixed inset-x-0 top-16 bottom-auto m-0 w-full max-w-none [^"]*supports-\[position-area:block-end\]:\[top:anchor\(--header_bottom\)\]/);
  assert.match(nav, /<button type="button" popovertarget="menu-4" class="\[anchor-name:--menu-4\] /);
  assert.match(nav, /<div popover id="menu-4" class="fixed top-16 end-4 start-auto bottom-auto m-0 w-72 [^"]*\[position-anchor:--menu-4\][^"]*\[position-area:block-end_span-inline-end\]/);
  assert.match(nav, /href="\/en\/careers\/culture\/"[^>]*aria-current="page"><span class="block text-sm font-medium">Life at Northwind<\/span>/, "the culture page is in the Company list and marked current on itself");
});

test("photo galleries open in a lightbox: thumbnails are named buttons with invoker commands, each image has a labelled dialog with its large picture, n of N, previous/next and close (to-do 3)", () => {
  const culture = readFileSync("dist/reference/en/careers/culture/index.html", "utf8");
  const g = /<div data-component="image-gallery">[\s\S]*?<\/dialog>\n<\/div>/.exec(culture)[0];
  assert.equal((g.match(/<button type="button" command="show-modal" commandfor="gallery-\d+-\d"/g) || []).length, 6, "six thumbnails");
  assert.equal((g.match(/<dialog id="gallery-\d+-\d" closedby="any" aria-label="[^"]+" data-lightbox/g) || []).length, 6, "six lightboxes");
  assert.match(g, /<span class="sr-only">Open image: The floor in Manchester<\/span>/);
  assert.match(g, /-1200\.avif 1200w/, "the lightbox loads the large picture");
  assert.match(g, />2 of 6</);
  assert.match(g, /data-lb="gallery-\d+-6"[^>]*>[\s\S]*?Previous/, "the first image's previous wraps to the last");
  const office = readFileSync("dist/reference/de/about/locations/hamburg/index.html", "utf8");
  assert.match(office, /<h2[^>]*>Einblicke ins Büro<\/h2>[\s\S]*?Bild öffnen: Die Fläche in Hamburg/, "office pages carry a gallery, in their language");
  const js = readFileSync("dist/reference/assets/enhance.js", "utf8");
  assert.match(js, /data-lightbox/, "arrow keys move between images");
});

test("search: results from the site's own content, filters that work without script, real paging with rel prev/next, the query in <mark> (to-do 4)", () => {
  const p1 = readFileSync("dist/reference/en/search/index.html", "utf8");
  const w = /<div data-component="search-results" class="([^"]*)">[\s\S]*?<\/ol>/.exec(p1);
  assert.ok(w, "results render");
  assert.match(w[1], /\[&:has\(#sf\d-jobs:checked\)_li\[data-group\]:not\(\[data-group=jobs\]\)\]:hidden/, "the filter classes reach the HTML unescaped, so Tailwind compiles them");
  assert.ok(readFileSync("dist/reference/assets/app.css", "utf8").includes(":has(#sf"), "and the CSS has the rules");
  assert.match(p1, /31 results for “<bdi>safety<\/bdi>” · Page 1 of 3/);
  assert.match(p1, /<fieldset>\n<legend[^>]*>Show<\/legend>/);
  // 0.13.0: the search box is the page's header, so the title and lede appear once, and the field shows the query.
  assert.equal((p1.match(/>Search<\/h[12]>/g) || []).length, 1, "one search title");
  assert.equal(p1.split("Pages, guides, events and press releases.").length - 1, 1, "one search lede");
  assert.doesNotMatch(p1, /data-component="page-header"/, "no page header above the search header");
  assert.match(p1, /data-component="search-box" data-variant="header">[\s\S]*?<h1[^>]*>Search<\/h1>[\s\S]*?<input type="search" id="q-page" name="q"[^>]* value="safety"/);
  assert.match(p1, /<a href="\/en\/search\/\?q=audit%20trail" class="[^"]*">audit trail<\/a>/, "popular searches are links");
  const help = readFileSync("dist/reference/en/help/index.html", "utf8");
  assert.equal((help.match(/<h1[^>]*>Help centre<\/h1>/g) || []).length, 1);
  assert.doesNotMatch(help, />Search<\/h2>/, "the help page no longer repeats a search title under its header");
  // The card view: a radio chip turns the list into a grid of cards, no script.
  assert.match(p1, /<input type="radio" name="sf\d-view" id="sf\d-cards" value="cards" class="sr-only">/);
  assert.match(w[1], /\[&:has\(\[value=cards\]:checked\)_ol\]:grid/);
  assert.match(w[1], /lg:\[&:has\(\[value=cards\]:checked\)_ol\]:grid-cols-3/);
  assert.ok(readFileSync("dist/reference/assets/app.css", "utf8").includes(":has([value=cards]:checked) ol{display:grid}"), "the card rules are compiled, once for every instance");
  assert.match(p1, /<input type="radio" name="sf\d" id="sf\d-all" value="all" class="sr-only" checked>/);
  assert.equal((w[0].match(/<li data-group=/g) || []).length, 12);
  assert.match(w[0], /<mark class="rounded-sm bg-accent-100 px-0\.5 text-ink">[Ss]afety<\/mark>/);
  assert.match(p1, /<a href="\/en\/search\/page\/2\/" rel="next"/);
  const p3 = readFileSync("dist/reference/de/search/page/3/index.html", "utf8");
  assert.match(p3, /<a href="\/de\/search\/page\/2\/" rel="prev"/);
  assert.match(p3, /Seite 3 von 3/);
  assert.match(readFileSync("dist/reference/ar/search/index.html", "utf8"), /<mark[^>]*>السلامة<\/mark>/, "Arabic matches are marked (all four are on page 1)");
});

test("in-page links: legal pages carry a table of contents whose links land on heading ids; the FAQ jumps to its groups (to-do 5)", () => {
  for (const [l, f] of [["en", "privacy"], ["de", "imprint"], ["ar", "terms"]]) {
    const html = readFileSync(`dist/reference/${l}/legal/${f}/index.html`, "utf8");
    const links = [...html.matchAll(/<nav aria-label="[^"]+" class="lg:sticky lg:top-20" data-component="toc">[\s\S]*?<\/nav>/g)].flatMap((m) => [...m[0].matchAll(/href="#([^"]+)"/g)].map((x) => x[1]));
    assert.ok(links.length >= 3, `${l}/${f}: a table of contents`);
    for (const id of links) assert.ok(html.includes(`id="${id}"`), `${l}/${f}: #${id} exists`);
  }
  const faq = readFileSync("dist/reference/en/faq/index.html", "utf8");
  const jumps = [...faq.matchAll(/<a href="#(faq-\d+-\d+)"/g)].map((m) => m[1]);
  assert.ok(jumps.length >= 2, "FAQ jump links");
  for (const id of jumps) assert.match(faq, new RegExp(`<h3 id="${id}"`));
});

test("link types and files: tel, sms, mailto with a subject, geo, and downloads that resolve to generated files (to-do 5)", () => {
  const office = readFileSync("dist/reference/de/about/locations/hamburg/index.html", "utf8");
  assert.match(office, /href="tel:\+4940123456"/);
  assert.match(office, /href="sms:\+4940123456"/);
  assert.match(office, /href="mailto:hamburg@northwind-dynamics\.com\?subject=Besuch%20im%20B%C3%BCro%20Hamburg"/);
  assert.match(office, /href="geo:53\.5438,9\.9861"/);
  assert.match(office, /href="\/assets\/files\/de\/hamburg\.vcf" download type="text\/vcard"/);
  const event = readFileSync("dist/reference/ar/events/safety-plcs-webinar/index.html", "utf8");
  assert.match(event, /href="\/assets\/files\/ar\/safety-plcs-webinar\.ics"[^>]* download="" type="text\/calendar"/);
  const gated = readFileSync("dist/reference/de/resources/downloads/commissioning-checklist/index.html", "utf8");
  assert.match(gated, /href="\/assets\/files\/commissioning-checklist\.pdf" download type="application\/pdf" hreflang="en"/);
  const open = readFileSync("dist/reference/en/resources/downloads/downtime-calculator/index.html", "utf8");
  assert.match(open, /href="\/assets\/files\/downtime-calculator\.csv"[^>]* download="" type="text\/csv">/);
  // Every /assets/files/ link on every page points at a file the build wrote.
  const hrefs = new Set();
  for (const f of readdirSync("dist/reference", { recursive: true })) if (String(f).endsWith(".html")) for (const m of readFileSync(`dist/reference/${f}`, "utf8").matchAll(/href="(\/assets\/files\/[^"]+)"/g)) hrefs.add(m[1]);
  assert.ok(hrefs.size >= 3 * 6 + 3, `${hrefs.size} file links`);
  for (const h of hrefs) assert.ok(existsSync(`dist/reference${h}`), `${h} exists`);
  assert.match(readFileSync("dist/reference/assets/files/en/northwind-at-automation-fair.ics", "utf8"), /BEGIN:VEVENT\r\nUID:northwind-at-automation-fair@northwind-dynamics\.com/);
  assert.match(readFileSync("dist/reference/assets/files/ar/riyadh.vcf", "utf8"), /GEO:geo:24\.7136,46\.6753/);
  assert.ok(readFileSync("dist/reference/assets/files/safety-evidence-guide.pdf", "latin1").startsWith("%PDF-1.4"));
});

test("rel values: tag and author on an article, bookmark on article cards, privacy-policy and terms-of-service in the footer, a visible feed link on the blog (to-do 5)", () => {
  const post = readFileSync("dist/reference/en/blog/reading-generated-code/index.html", "utf8");
  assert.match(post, /<a href="[^"]+" rel="tag"/);
  assert.match(post, /<a href="[^"]+" rel="author"/);
  assert.match(post, /<a href="\/en\/legal\/privacy\/" rel="privacy-policy"/);
  assert.match(post, /<a href="\/en\/legal\/terms\/" rel="terms-of-service"/);
  assert.match(readFileSync("dist/reference/de/news/media-kit/index.html", "utf8"), /<a href="\/de\/legal\/terms\/" rel="license"/);
  const a11y = readFileSync("dist/reference/ar/legal/accessibility/index.html", "utf8");
  assert.match(a11y, /<a href="https:\/\/www\.w3\.org\/TR\/WCAG22\/" target="_blank" rel="noopener noreferrer" hreflang="en">[\s\S]*?<span class="sr-only">/);
  for (const l of ["en", "de", "ar"]) {
    const blog = readFileSync(`dist/reference/${l}/blog/index.html`, "utf8");
    assert.match(blog, /<article class="group relative[^"]*"[\s\S]*?<a href="[^"]+" rel="bookmark"/, `${l}: article cards`);
    assert.match(blog, new RegExp(`<a href="/${l}/feed\\.xml" rel="alternate" type="application/atom\\+xml"`), `${l}: feed link`);
  }
});

test("element semantics (to-do 6a): hgroup, menu, small, dfn, data, meter, s, colgroup and tfoot, optgroup, datalist, bdi", () => {
  const read = (p) => readFileSync(`dist/reference/${p}/index.html`, "utf8");
  const about = read("en/about");
  assert.match(about, /<hgroup class="max-w-3xl[^"]*"><p[^>]*>[^<]+<\/p><h1/, "page header: eyebrow and h1 in an hgroup");
  assert.match(about, /<hgroup class="[^"]*"[^>]*>[\s\S]{0,600}?<h2/, "section heading groups are hgroups");
  assert.match(read("en/blog/reading-generated-code"), /<menu class="flex gap-2">/, "the share toolbar is a menu");
  assert.match(about, /<p><small class="text-sm">© /, "the copyright line is small print");
  assert.match(read("en/glossary"), /<dt [^>]*id="term-[^"]+"><dfn class="not-italic">/, "glossary terms are defined with dfn");
  const sus = read("en/sustainability");
  assert.match(sus, /<data value="33">/);
  assert.match(sus, /<data value="0\.667">/, "a ratio's data value is the ratio");
  assert.match(sus, /<meter min="0" max="3" value="2" optimum="3"/);
  const pricing = read("de/pricing");
  assert.match(pricing, /<s class="[^"]*"><span class="sr-only">Bisher <\/span>2\.200 €<\/s><data value="1900"/);
  assert.match(pricing, /<colgroup><col class="w-1\/3"><col span="3"><\/colgroup>/);
  assert.match(pricing, /<tfoot[\s\S]*?<th scope="row"[^>]*>Preis<\/th>/);
  assert.match(read("de/careers"), /<optgroup label="Standorte">/);
  const search = read("ar/search");
  assert.match(search, /<input type="search" id="q-page" name="q" list="q-page-suggestions"/);
  assert.match(search, /<datalist id="q-page-suggestions"><option value="PLC"><\/option>/);
  assert.match(read("ar/customers"), /، <bdi>[A-Za-z][^<]*<\/bdi>/, "a Latin company name in an Arabic byline is isolated");
});

test("element semantics in content (to-do 6b): abbr, q, figure with figcaption and cite, kbd, var, samp, pre and code, sub, sup, hr, strong, em", () => {
  const read = (p) => readFileSync(`dist/reference/${p}/index.html`, "utf8");
  assert.match(read("de/blog/sensor-logic-at-the-edge"), /<abbr title="speicherprogrammierbare Steuerung">SPS<\/abbr>/);
  assert.match(read("de/news/riyadh-office"), /<q>Werke in der Region[^<]*<\/q>/, "German quotation marks become <q>");
  const post = read("ar/blog/reading-generated-code");
  assert.match(post, /<hr>/);
  assert.match(post, /<figure>\n<blockquote>\n<p>[^<]+<\/p>\n<\/blockquote>\n<figcaption>— بريا ناتاراجان، <cite>Control Engineering Review<\/cite><\/figcaption>\n<\/figure>/);
  assert.match(post, /<strong>[^<]+<\/strong>[\s\S]*<em>[^<]+<\/em>/);
  const doc = read("en/help/describe-your-first-line");
  assert.match(doc, /<kbd>Ctrl<\/kbd>\+<kbd>Shift<\/kbd>\+<kbd>R<\/kbd>/);
  assert.match(doc, /<var>n<\/var> stations and <var>r<\/var> rules/);
  assert.match(doc, /<code>DB10\.DBX0\.0<\/code>/);
  assert.match(doc, /<pre><samp>Checked 6 stations/);
  assert.match(doc, /<pre><code>rule &quot;guard-open&quot;/);
  assert.match(read("en/customers/alder-foods"), /CO<sub>2<\/sub>[\s\S]*40 m<sup>2<\/sup>/);
  for (const f of readdirSync("dist/reference", { recursive: true })) {
    if (!/\.(html|xml|json)$/.test(String(f))) continue;
    assert.doesNotMatch(readFileSync(`dist/reference/${f}`, "utf8"), /\*\[(PLC|SPS|HMI)\]:|\[\[Ctrl\]\]|CO~2~/, `${f}: no Markdown semantics syntax leaks`);
  }
});

test("element semantics in pages (to-do 6c): article with its header, wbr, ins and del, h5 and h6, a range input with an output", () => {
  const read = (p) => readFileSync(`dist/reference/${p}/index.html`, "utf8");
  const post = read("en/blog/reading-generated-code");
  assert.match(post, /<article>\n+<header class="py-12 md:py-16[^"]*" data-component="page-header">[\s\S]*?<h1[\s\S]*?data-component="author-box"[\s\S]*?<\/article>/, "a post is one article: header, byline, body, author box");
  assert.doesNotMatch(post.slice(post.indexOf("</article>")), /data-component="author-box"/);
  const job = read("de/careers/senior-controls-engineer");
  assert.match(job, /<article>\n+<header [^>]*data-component="page-header">[\s\S]*?data-component="job-detail"[\s\S]*?<\/article>/);
  assert.ok(job.indexOf('data-component="apply-form"') > job.indexOf("</article>"), "the application form follows the article");
  assert.match(read("de/blog"), /Produktions<wbr>fläche/);
  const terms = read("en/legal/terms");
  assert.match(terms, /<del datetime="2026-09-01"><span class="sr-only">Removed: <\/span>99\.5%<\/del> <ins datetime="2026-09-01"><span class="sr-only">Added: <\/span>99\.9%<\/ins>/);
  const privacy = read("ar/legal/privacy");
  assert.match(privacy, /<h4 [^>]*>[\s\S]*<h5 [^>]*>[\s\S]*<h6 [^>]*>/, "the privacy annex nests to h6 without skipping a level");
  const pricing = read("de/pricing");
  assert.match(pricing, /<label for="estimate-1"[^>]*>[^<]+<\/label>\n<input type="range" id="estimate-1" min="1" max="20" step="1" value="4" data-estimate="\{n\} × Starter: \{total\} € im Monat" data-amount="490"/);
  assert.match(pricing, /<output for="estimate-1" class="[^"]*">4 × Starter: 1\.960 € im Monat<\/output>/);
  assert.match(readFileSync("dist/reference/assets/enhance.js", "utf8"), /data-estimate|dataset\.estimate/, "enhance.js keeps the output current");
});

test("new pages (to-do 7a): a changelog of release articles, a podcast episode with audio, captions and a transcript", () => {
  const read = (p) => readFileSync(`dist/reference/${p}/index.html`, "utf8");
  const cl = read("en/changelog");
  assert.equal((cl.match(/<article id="v\d+-\d+-\d+"/g) || []).length, 4, "one article per release");
  assert.match(cl, /<a href="#v2-4-0"[^>]*>Studio 2\.4<\/a>/, "jump links to each release");
  assert.match(cl, /<article id="v2-4-0"[^>]*>\n<header[^>]*>\n<h3[^>]*><data value="2\.4\.0">Studio 2\.4<\/data><\/h3>\n<p[^>]*><time datetime="2026-10-06">/);
  assert.match(cl, /<code>limits\.yaml<\/code>/);
  assert.match(cl, /<kbd>Ctrl<\/kbd>\+<kbd>Z<\/kbd>/);
  const pod = read("ar/resources/podcast");
  assert.match(pod, /<audio controls preload="none"[^>]*>\n<source src="\/assets\/files\/line-notes-12\.wav" type="audio\/wav">\n<track kind="captions" src="\/assets\/files\/ar\/line-notes-12\.vtt" srclang="ar" label="العربية" default>/);
  assert.match(pod, /<time datetime="PT6S">0:06<\/time>/);
  assert.match(pod, /<p[^>]*><b class="[^"]*">مي تشين:<\/b> /, "speaker names in <b>");
  assert.match(pod, /<i lang="en" dir="ltr">factory acceptance test<\/i>/);
  assert.match(pod, /<abbr title="اختبار القبول في المصنع">FAT<\/abbr>/);
  assert.ok(readFileSync("dist/reference/assets/files/line-notes-12.wav").subarray(0, 4).toString() === "RIFF");
  assert.match(readFileSync("dist/reference/assets/files/de/line-notes-12.vtt", "utf8"), /^WEBVTT\n\n1\n00:00\.000 --> 00:06\.000\n\[Signalton\]/);
  const footer = read("de/trust");
  assert.match(footer, /<a href="\/de\/changelog\/"[^>]*>Neuigkeiten<\/a>/);
  assert.match(footer, /<a href="\/de\/resources\/podcast\/"[^>]*>Podcast<\/a>/);
});

test("locations (0.17.0): image tiles instead of a map; the office map is gone from the catalog (0.19.0); the style guide's image map uses an art picture the site already has", () => {
  // The locations page shows the offices as image tiles, two across; the map is gone from the site (owner: "too data specific").
  for (const l of ["en", "ar"]) {
    const loc = readFileSync(`dist/reference/${l}/about/locations/index.html`, "utf8");
    assert.doesNotMatch(loc, /data-component="office-map"/, `${l}: no map`);
    const tiles = [...loc.matchAll(/data-component="card" data-variant="office">[\s\S]*?<img src="\/assets\/images\/office-[a-z]+-card-16x9-480\.webp"[^>]*data-tone="dark"/g)];
    assert.equal(tiles.length, 4, `${l}: four office tiles, each with a dark-tone library picture`);
    assert.match(loc, /data-component="office-cards"[\s\S]*?<ul class="grid gap-6 md:gap-8 md:grid-cols-2[ "]/, `${l}: two across`);
    // Each detail page opens with the tile's picture (same slug and tone, so the same artwork) in a split header (0.17.1).
    for (const o of ["manchester", "tokyo"]) {
      const detail = readFileSync(`dist/reference/${l}/about/locations/${o}/index.html`, "utf8");
      assert.match(detail, new RegExp(`data-component="page-header" data-variant="split">[\\s\\S]*?<img src="/assets/images/office-${o}-card-4x3-480\\.webp"[^>]*data-tone="dark"`), `${l}/${o}: the tile's picture heads its page`);
    }
  }
  // The office map is gone (owner, 2026-10-23: "we dont use that map image anymore"): no section, no picture file, no link to one.
  const company = readFileSync("dist/reference/sys/style-guide/sections/company/index.html", "utf8");
  assert.doesNotMatch(company, /data-component="office-map"/);
  for (const l of ["en", "de", "ar", "ja"]) {
    assert.ok(!existsSync(`dist/reference/assets/files/${l}/office-map.svg`), `${l}: no office map picture`);
    assert.doesNotMatch(readFileSync(`dist/reference/${l}/sys/index.html`, "utf8"), /office-map/, `${l}: the system page lists no map`);
  }
  // The native image map (map, area) stays demonstrated, on the home page's art picture: three rectangles, each a link to a real page.
  const guide = readFileSync("dist/reference/sys/style-guide/components/index.html", "utf8");
  assert.match(guide, /<img src="\/assets\/images\/home-backdrop-16x9-768\.webp" usemap="#sg-image-map" width="768" height="432"/);
  assert.ok(existsSync("dist/reference/assets/images/home-backdrop-16x9-768.webp"));
  const areas = [...guide.matchAll(/<area shape="rect" coords="(\d+),0,(\d+),432" href="([^"]+)" alt="([^"]+)">/g)];
  assert.equal(areas.length, 3);
  for (const [, , , href] of areas) assert.ok(existsSync(`dist/reference${href}index.html`), `${href} exists`);
});

test("frames and objects (to-do 7c): a same-origin iframe of a newsletter issue, PDF previews in object and embed, a CSP that allows only the site itself", () => {
  const read = (p) => readFileSync(`dist/reference/${p}/index.html`, "utf8");
  assert.match(read("de/newsletter"), /<iframe src="\/de\/newsletter\/preview\/" title="Die Oktober-Ausgabe 2026 von Line Notes" loading="lazy" sandbox="allow-same-origin allow-top-navigation-by-user-activation"/);
  const issue = read("de/newsletter/preview");
  assert.match(issue, /<meta name="robots" content="noindex">/);
  assert.match(issue, /<a href="\/de\/blog\/reading-generated-code\/" target="_top"/);
  assert.doesNotMatch(readFileSync("dist/reference/sitemap.xml", "utf8"), /newsletter\/preview/, "the issue stays out of the sitemap");
  assert.match(read("en/resources/downloads/commissioning-checklist"), /<object data="\/assets\/files\/commissioning-checklist\.pdf" type="application\/pdf" title="[^"]+"[^>]*><p[^>]*><a href="\/assets\/files\/commissioning-checklist\.pdf" download/);
  assert.match(read("ar/resources/downloads/safety-evidence-guide"), /<embed src="\/assets\/files\/safety-evidence-guide\.pdf" type="application\/pdf" title="معاينة الصفحة النموذجية \(PDF\)"/);
  const headers = readFileSync("dist/reference/_headers", "utf8");
  assert.match(headers, /frame-src 'self'; object-src 'self';[^\n]*frame-ancestors 'self';/);
});

test("widgets (to-do 7b, part one): a billing toggle without script, a tooltip on pricing, star ratings, an avatar stack", () => {
  const read = (p) => readFileSync(`dist/reference/${p}/index.html`, "utf8");
  const pricing = read("de/pricing");
  assert.match(pricing, /<div class="group\/billing">\n<fieldset[^>]*>\n<legend class="sr-only">Abrechnung<\/legend>\n<label[^>]*><input type="radio" name="billing-\d+" value="monthly" checked class="sr-only">Monatlich<\/label>\n<label[^>]*><input type="radio" name="billing-\d+" value="annual" class="sr-only">Jährlich, 2 Monate gratis<\/label>/);
  assert.match(pricing, /<span class="hidden group-has-\[\[value=annual\]:checked\]\/billing:inline"><data value="1583"[^>]*>1\.583 €<\/data><\/span>/);
  assert.match(readFileSync("dist/reference/assets/app.css", "utf8"), /:has\(\[value=annual\]:checked\)/);
  assert.match(pricing, /<button type="button" popovertarget="tip-\d+"[\s\S]*?<span popover="hint" id="tip-\d+"[^>]*>/, "a tooltip explains what counts as a line");
  const home = read("ar");
  assert.match(home, /<span class="sr-only">التقييم [45] من 5<\/span><span aria-hidden="true"[^>]*>★+/);
  assert.match(read("en/blog"), /<div class="flex -space-x-2">(<svg aria-hidden="true"[^>]*ring-2[^>]*>[\s\S]*?<\/svg>\s*){4}<\/div>\n<p class="text-sm text-ink-muted">Read by 1,400 engineers every month<\/p>/);
});

test("widgets (to-do 7b, part two): copy and share buttons report into a live toast; the home page's notice can be dismissed for the session", () => {
  const read = (p) => readFileSync(`dist/reference/${p}/index.html`, "utf8");
  const office = read("de/about/locations/hamburg");
  assert.match(office, /<button type="button" data-copy="Speicherstadt 12, 20457 Hamburg, Deutschland" data-copied="Adresse kopiert" class="hidden js:inline-flex/);
  assert.match(office, /<div role="status" aria-live="polite" class="[^"]*" data-component="toast" data-variant="live" data-toast><div hidden/);
  const post = read("en/blog/reading-generated-code");
  assert.match(post, /data-copy="https:\/\/northwind-dynamics\.com\/en\/blog\/reading-generated-code\/" data-copied="Link copied"><svg[^>]*><use href="#i-link">/);
  assert.match(post, /data-copied="Link copied" data-share><svg[^>]*><use href="#i-share-2">/);
  assert.doesNotMatch(post, /data-component="announcement-bar"/, "the notice is on the home page only");
  const home = read("ar");
  assert.match(home, /<div role="region" aria-label="إعلان" class="relative bg-brand-700[^"]*in-data-\[notice=off\]:hidden" data-component="announcement-bar">[\s\S]*?<button type="button" data-dismiss[^>]*>[\s\S]*?<span class="sr-only">إغلاق<\/span>/);
  const js = readFileSync("dist/reference/assets/enhance.js", "utf8");
  assert.match(js, /data-copy/);
  assert.match(js, /sessionStorage\.notice=1/);
  assert.ok(Buffer.byteLength(js) <= 5120, "enhance.js within 5 KB (D55)");
});

test("widgets (to-do 7b, part three): a carousel, a sticky phone CTA, a contact launcher, a before/after slider", () => {
  const read = (p) => readFileSync(`dist/reference/${p}/index.html`, "utf8");
  assert.match(read("de/customers"), /<ul class="carousel" tabindex="0" aria-label="[^"]+" data-prev="[^"]+" data-next="[^"]+">/);
  const css = readFileSync("dist/reference/assets/app.css", "utf8");
  assert.match(css, /::scroll-button\(inline-start\)/);
  assert.match(css, /::scroll-marker/);
  assert.match(css, /\.carousel\{[^}]*scrollbar-width:none/, "the carousel shows no scrollbar: the peeking next card and the markers show there is more (owner, 2026-10-21)");
  const home = read("en");
  const sticky = /<div class="sticky bottom-0[^"]*sda:flex[^"]*lg:hidden[^"]*\[animation-range:0_60vh\][^"]*" data-component="sticky-cta"><p class="text-sm text-ink-muted">See your line described in thirty minutes\.<\/p><a href="\/en\/demo\/" class="[^"]*min-h-9/.exec(home);
  assert.ok(sticky, "a sticky CTA on the home page: a line of text and a small button, not a full-width bar");
  assert.ok(home.indexOf('data-component="sticky-cta"') < home.indexOf("</main>"), "inside main, so it stops above the footer");
  assert.doesNotMatch(read("en/about"), /data-component="sticky-cta"/);
  const pricing = read("ar/pricing");
  assert.match(pricing, /<button type="button" popovertarget="contact-launcher"[^>]*>[\s\S]*?<div popover id="contact-launcher" role="dialog" aria-labelledby="contact-launcher-title"/);
  assert.match(pricing, /<a href="tel:\+442079460000">[\s\S]*?<a href="mailto:hello@northwind-dynamics\.com">[\s\S]*?<a href="\/ar\/contact\/">/);
  assert.doesNotMatch(read("en/products/northwind-studio"), /contact-launcher/);
  const cs = read("de/customers/brightline-pharma");
  assert.match(cs, /<div class="relative overflow-hidden rounded-xl \[--pos:50%\]" data-ba-frame>/);
  assert.match(cs, /brightline-pharma-hmi-before[\s\S]*?brightline-pharma-hmi-after|brightline-pharma-hmi-after[\s\S]*?brightline-pharma-hmi-before/);
  assert.match(cs, /<label class="mt-4 hidden js:block"><span class="sr-only">Vorher und nachher vergleichen<\/span><input type="range" min="0" max="100" value="50" data-ba/);
  assert.match(readFileSync("dist/reference/assets/enhance.js", "utf8"), /setProperty\("--pos"/);
});

test("widgets (to-do 7b, part four): native date, time and range inputs; progress on the application; a skeleton behind the newsletter frame", () => {
  const read = (p) => readFileSync(`dist/reference/${p}/index.html`, "utf8");
  const demo = read("de/demo");
  assert.match(demo, /<input type="date" id="d-day" [^>]*min="2026-10-20"/);
  assert.match(demo, /<input type="time" id="d-time" [^>]*min="08:00" max="17:00" step="1800"/);
  assert.match(demo, /<input type="range" id="d-lines" [^>]*min="1" max="40"[^>]* value="4" data-estimate="\{n\}"><output for="d-lines"[^>]*>4<\/output>/);
  assert.match(read("en/careers/technical-writer"), /<div class="mb-8">\s*<div data-component="progress">[\s\S]*?<progress value="1" max="3"/);
  const nl = read("ar/newsletter");
  assert.match(nl, /<div class="relative">\n<div class="absolute inset-0[^"]*">\s*<div aria-hidden="true" class="motion-safe:animate-pulse" data-component="skeleton"[\s\S]*?<iframe /);
});

test("selects draw their own chevron clear of the end edge (owner, 2026-10-21): appearance-none, end padding for it, the sprite icon after the control", () => {
  for (const u of ["/en/demo/", "/ar/demo/", "/en/careers/"]) {
    const html = readFileSync(`dist/reference${u}index.html`, "utf8");
    const m = /<div class="relative"><select id="[^"]+" class="([^"]*)"[^>]*>[\s\S]*?<\/select><svg aria-hidden="true" class="pointer-events-none absolute end-3 top-1\/2 size-4 -translate-y-1\/2 text-ink-muted"><use href="#i-chevron-down"><\/use><\/svg><\/div>/.exec(html);
    assert.ok(m, `${u}: select wrapped with its chevron`);
    assert.match(m[1], /\bappearance-none\b/);
    assert.match(m[1], /\bpe-10\b/);
    assert.doesNotMatch(m[1], /\bpx-3\b/, "the end padding replaces the symmetric one");
    assert.match(m[1], /\bps-3\b/);
    assert.match(html, /<symbol id="i-chevron-down"/, "the sprite carries the chevron");
  }
});

test("the widgets test page is gone and the HTML element reference lives under /sys/ (owner, 2026-10-21): old URLs are not redirected (2026-10-23), the style guide nav and the system page link the new one", () => {
  assert.ok(!existsSync("dist/reference/en/qa"), "no /en/qa/ pages");
  assert.ok(existsSync("dist/reference/sys/html/index.html"));
  assert.ok(!existsSync("dist/reference/sys/style-guide/widgets"));
  assert.equal(readFileSync("dist/reference/_redirects", "utf8").trim(), "/  /en/  301", "only the root redirects (R-DEPLOY-05)");
  assert.deepEqual(JSON.parse(readFileSync("dist/reference/redirects.json", "utf8")), [{ from: "/", to: "/en/", status: 301 }]);
  const guide = readFileSync("dist/reference/sys/style-guide/index.html", "utf8");
  assert.match(guide, /href="\/sys\/html\/"/);
  assert.doesNotMatch(guide, /widgets/i);
  assert.match(readFileSync("dist/reference/sys/index.html", "utf8"), /<a href="\/sys\/html\/" class="font-medium [^"]*">HTML element reference<\/a>/, "the system hub lists the reference");
  assert.match(readFileSync("dist/reference/en/sys/index.html", "utf8"), /<a href="\/sys\/" /, "the English system page points to the hub for it");
});

test("the style guide's entrance demo replays on demand (owner, 2026-10-21): a button the script shows, wired to the demo row", () => {
  const page = readFileSync("dist/reference/sys/style-guide/index.html", "utf8");
  assert.match(page, /<div id="motion-demo" class="mt-4 grid grid-cols-2 gap-6 overflow-x-clip sm:grid-cols-5">/);
  assert.match(page, /<button type="button" data-replay aria-controls="motion-demo" class="hidden js:inline-flex [^"]*">[\s\S]*?Play again<\/button>/);
  const js = readFileSync("dist/reference/assets/enhance.js", "utf8");
  assert.match(js, /\[data-replay\]/);
  assert.ok(js.length <= 5120, `enhance.js is ${js.length} B`);
});

test("HTML element reference (to-do 8): every element of the standard is listed, each linked page really uses it, and every element appears on the site", () => {
  const list = JSON.parse(readFileSync("engine/catalog/html-elements.json", "utf8"));
  assert.ok(list.length >= 110, `${list.length} elements`);
  const ref = readFileSync("dist/reference/sys/html/index.html", "utf8");
  assert.match(ref, /<base href="\/sys\/html\/" target="_self">/);
  const has = (html, el) => new RegExp(`<${el}[\\s>/]`).test(html);
  for (const e of list) {
    assert.ok(ref.includes(`<tr id="el-${e.el}"`), `${e.el} is listed`);
    if (e.href) assert.ok(has(readFileSync(`dist/reference${e.href}index.html`, "utf8"), e.el), `${e.href} uses <${e.el}>`);
    else assert.ok(has(ref, e.el) && ref.includes(`id="live-${e.el}"`), `<${e.el}> is shown live on the reference page`);
  }
});

test("system pages (D56, D59): /sys/ links each language's system page, the style guide and the HTML element reference; each language's page lists only its own hidden pages, points to /sys/ for the rest and carries the language switcher; all hidden", () => {
  const read = (u) => readFileSync(`dist/reference${u}index.html`, "utf8");
  const links = (html) => new Set([...html.matchAll(/<a href="([^"#]+)" class="(?:font-medium|mt-10|block)/g)].map((m) => m[1]));
  const { locales } = JSON.parse(readFileSync("sites/reference/site.json", "utf8"));
  const names = { en: "English", de: "German", ar: "Arabic", ja: "Japanese" };
  const sys = Object.fromEntries(locales.map((l) => [l, read(`/${l}/sys/`)]));
  const hub = read("/sys/");
  for (const l of locales) assert.ok(links(hub).has(`/${l}/sys/`), `/sys/ links the ${l} system page`);
  // Since 0.9.0 the style guide and the HTML reference live outside any locale, and the hub lists them (D59).
  for (const u of ["/sys/style-guide/", "/sys/html/"]) assert.ok(links(hub).has(u), `/sys/ links ${u}`);
  // Each language's page lists only its own pages and points to /sys/ for the style guide and the HTML reference; the language switcher pairs the system pages (owner, 2026-10-20).
  for (const [l, html] of Object.entries(sys)) {
    assert.match(html, new RegExp(`<h1[^>]*>${names[l]} system pages</h1>`));
    const foreign = [...links(html)].filter((u) => /^\/[a-z]{2}\//.test(u) && !u.startsWith(`/${l}/`));
    assert.deepEqual(foreign, [], `/${l}/sys/ lists no other language's pages`);
    assert.match(html, /<a href="\/sys\/" /, `/${l}/sys/ points to the hub`);
    assert.doesNotMatch(html, /href="\/(?:[a-z]{2}\/)?sys\/(?:html|style-guide)\//, `/${l}/sys/ leaves the style guide and the HTML reference to the hub`);
    assert.ok(links(html).has(`/${l}/search/`), `/${l}/sys/ lists its own hidden pages`);
    assert.ok(links(html).has(`/${l}/feed.xml`), `/${l}/sys/ lists its own files`);
    assert.match(html, /data-component="locale-switcher"/, `/${l}/sys/ has the language switcher`);
    for (const o of locales) assert.match(html, new RegExp(`<link rel="alternate" hreflang="${o}" href="[^"]*/${o}/sys/"`), `/${l}/sys/ names /${o}/sys/ as its ${o} alternate`);
  }
  for (const html of [hub, ...Object.values(sys)]) assert.match(html, /<meta name="robots" content="noindex/);
  assert.doesNotMatch(hub, /hreflang="[a-z]{2}"|data-component="locale-switcher"/, "the hub exists in one place only: no language links");
  const listed = new Set([...links(hub), ...Object.values(sys).flatMap((html) => [...links(html)])]);
  const pages = [];
  const walk = (dir) => { for (const e of readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith(".html")) pages.push(p); } };
  walk("dist/reference");
  for (const p of pages) {
    const html = readFileSync(p, "utf8");
    const url = "/" + path.relative("dist/reference", p).split(path.sep).join("/").replace(/index\.html$/, "");
    if (/data-page="(redirect|sys)"/.test(html)) continue;
    if (/<meta name="robots" content="noindex/.test(html)) assert.ok(listed.has(url), `${url} is reachable from /sys/`);
    else assert.doesNotMatch(html, /href="\/(en\/)?(sys|qa)\//, `${url}: no public page links to a system page`);
  }
  const sitemap = readFileSync("dist/reference/sitemap.xml", "utf8");
  assert.doesNotMatch(sitemap, /\/sys\//);
  for (const u of ["/sitemap.xml", "/robots.txt"]) assert.ok(links(hub).has(u) && existsSync(`dist/reference${u}`));
});
test("no page shows escaped markup: HTML meant to render never reaches a template as text", () => {
  const offenders = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, name.name);
      if (name.isDirectory()) walk(p);
      else if (name.name.endsWith(".html") && !p.replace(/\\/g, "/").includes("sys/html/") && /&lt;\/?(?:p|strong|em|ul|ol|li|h[1-6]|br)\b|&lt;a href/.test(readFileSync(p, "utf8"))) offenders.push(p);
    }
  };
  walk("dist/reference");
  assert.deepEqual(offenders, []);
  const post = readFileSync("dist/reference/en/news/thousandth-line/index.html", "utf8");
  assert.match(post, /data-component="author-box"[\s\S]*?<p class="mt-2 text-sm leading-relaxed">Sofia handles press, the newsletter and the words on this site\.<\/p>/, "the author box shows the bio's first paragraph as text");
});

test("the stylesheet is compiled from the built pages only, not from docs or bylaws", () => {
  const css = readFileSync("dist/reference/assets/app.css", "utf8");
  // `p-[13px]` appears in bylaw 02 as a forbidden example and nowhere in any page.
  assert.doesNotMatch(css, /p-\\\[13px\\\]/);
  assert.match(css, /\.text-4xl\{/, "classes used on the page are present");
});

test("three locales: alternates pair the same slug per locale, Arabic pages preload the Arabic face and then the Latin one, the style guide exists in the default locale only", () => {
  const html = readFileSync("dist/reference/de/about/team/mei-chen/index.html", "utf8");
  assert.match(html, /<link rel="alternate" hreflang="en" href="https:\/\/northwind-dynamics\.com\/en\/about\/team\/mei-chen\/">/);
  assert.match(html, /<link rel="alternate" hreflang="ar" href="https:\/\/northwind-dynamics\.com\/ar\/about\/team\/mei-chen\/">/);
  assert.doesNotMatch(html, /hreflang="en" href="https:\/\/northwind-dynamics\.com\/en\/about\/team\/priya/);
  const ar = readFileSync("dist/reference/ar/index.html", "utf8");
  assert.match(ar, /<html lang="ar" dir="rtl"/);
  assert.match(ar, /<link rel="preload" href="\/assets\/fonts\/noto-sans-arabic-arabic-wght-normal\.woff2" as="font" type="font\/woff2" crossorigin>\n<link rel="preload" href="\/assets\/fonts\/inter-latin-wght-normal\.woff2"/);
  const en = readFileSync("dist/reference/en/index.html", "utf8");
  assert.match(en, /<link rel="preload" href="\/assets\/fonts\/inter-latin-wght-normal\.woff2"/);
  assert.equal(en.match(/rel="preload"[^>]*as="font"/g).length, 1, "a Latin page preloads one font");
  // Language names in the switcher render in the system font so no page downloads another script's face for one word (R-PERF-01).
  assert.match(ar, /lang="de"[^>]*class="[^"]*font-system/);
  assert.ok(existsSync("dist/reference/sys/style-guide/index.html"));
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
  assert.match(sitemap, /<loc>https:\/\/northwind-dynamics\.com\/de\/blog\/reading-generated-code\/<\/loc>/);
  const og = /property="og:image" content="https:\/\/northwind-dynamics\.com([^"]+)"/.exec(de)[1];
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
  assert.match(readFileSync("dist/reference/en/search/index.html", "utf8"), /31 results for/);
  // Header at lg (Critical 3): label only from xl, wordmark h-7 until xl, CTA never wraps.
  const en = readFileSync("dist/reference/en/index.html", "utf8");
  assert.match(en, /<span class="hidden xl:inline">English<\/span>/);
  assert.match(en, /class="h-6 xl:h-7 fill-ink w-auto"/);
  assert.match(en, /<a href="\/en\/demo\/" class="hidden min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md/);
});

test("motion: smooth scrolling, floating back-to-top under sda, time-based item entrances by column, overlay entrances with blurred backdrops", () => {
  const html = readFileSync("dist/reference/en/index.html", "utf8");
  assert.match(html, /<html [^>]*class="[^"]*motion-safe:scroll-smooth/);
  assert.match(html, /data-component="back-to-top" data-variant="float"/);
  assert.match(html, /motion-safe:sda:animate-rise-in[^"]*motion-safe:sda:\[animation-timeline:scroll\(\)\]/);
  // Grid items are time-based entrances (R-MOT-05, R-MOT-16): a from-state under pending:, a transition that exists only once revealed, a delay by column.
  // The home features became a bento in 0.12.0; the careers page keeps a three-column feature grid.
  const feat = /data-component="feature-grid"[\s\S]*?<\/section>/.exec(readFileSync("dist/reference/en/careers/index.html", "utf8"))[0];
  assert.match(feat, /<li class=" pending:opacity-0 pending:-translate-x-\(--reveal-distance\) rtl:pending:translate-x-\(--reveal-distance\) motion-safe:data-revealed:transition-\[opacity,translate,scale\] motion-safe:data-revealed:duration-\(--reveal-duration\) motion-safe:data-revealed:ease-reveal">/, "the first column slides in at once");
  assert.match(feat, /<li class=" pending:opacity-0 pending:translate-y-\(--reveal-distance\) motion-safe:data-revealed:transition-\[opacity,translate,scale\][^"]*motion-safe:data-revealed:delay-90">/, "the second column rises 90 ms later");
  assert.match(feat, /<li class=" pending:opacity-0 pending:translate-y-\(--reveal-distance\) pending:scale-94 [^"]*motion-safe:data-revealed:delay-180">/, "the third column settles 180 ms later");
  assert.doesNotMatch(html, /<section class="(?:[^"]*\s)?opacity-0[\s"]/, "no section is hidden outright: opacity-0 only ever comes with pending:");
  assert.doesNotMatch(html, /motion-safe:js:transition-\[opacity/, "entrance transitions exist only once revealed, so the script starting never fades anything out");
  assert.doesNotMatch(html, /animate-reveal|animation-range:cover_5%|animation-range:entry_/, "no entrance is tied to the scroll any more");
  // Header shadow fades in on scroll; feature rows slide from the inline edges.
  assert.match(html, /<header class="[^"]*motion-safe:sda:after:animate-fade[^"]*motion-safe:sda:after:\[animation-timeline:scroll\(\)\]/);
  assert.match(html, /pending:-translate-x-\(--reveal-distance\)/);
  assert.match(html, /pending:translate-x-\(--reveal-distance\) rtl:pending:-translate-x-\(--reveal-distance\)/);
  const guide = readFileSync("dist/reference/sys/style-guide/controls/index.html", "utf8");
  assert.match(guide, /<dialog [^>]*class="[^"]*motion-safe:starting:open:backdrop:opacity-0/);
  assert.match(guide, /id="drawer"[^>]*class="[^"]*motion-safe:translate-x-full[^"]*motion-safe:starting:open:translate-x-full/);
  const css = readFileSync("dist/reference/assets/app.css", "utf8");
  assert.match(css, /--reveal-distance: ?40px/);
  assert.match(css, /--reveal-distance-item: ?56px/);
  assert.match(css, /--reveal-duration: ?(800ms|.8s)/);
  assert.match(css, /@keyframes rise-in/);
  assert.doesNotMatch(css, /@keyframes reveal/, "entrances are transitions; no entrance keyframes remain (R-TOK-13)");
});

test("micro-interactions: primary buttons lift, press and nudge their arrow (mirrored in RTL); cards warm their border; disclosure chevrons rotate; nav links grow an underline", () => {
  const en = readFileSync("dist/reference/en/index.html", "utf8");
  // The home and landing heroes sit on art or video with inverse buttons since 0.11.0 and 0.14.0; the style guide's centered hero carries a primary one.
  const sg = readFileSync("dist/reference/sys/style-guide/sections/heroes/index.html", "utf8");
  const primary = /<a href="\/sys\/style-guide\/" class="group inline-flex [^"]*"[^>]*data-variant="primary"[^>]*>[\s\S]*?<\/a>/.exec(sg.slice(sg.indexOf('data-component="hero"')))[0];
  assert.match(primary, /motion-safe:hover:-translate-y-px/);
  assert.match(primary, /active:scale-\[0\.98\]/);
  assert.match(primary, /hover:shadow-md/);
  assert.match(primary, /class="size-5 shrink-0 motion-safe:transition-transform motion-safe:duration-150 group-hover:translate-x-0\.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0\.5"><use href="#i-arrow-right">/);
  const services = readFileSync("dist/reference/en/services/index.html", "utf8");
  assert.match(services, /<div class="group relative flex w-full flex-col[^"]*hover:border-brand-300/);
  assert.match(services, /<span class="mb-4 inline-flex self-start"><span class="inline-flex size-12[^"]*group-hover:scale-105/, "the hover scale sits on the inner tile, the arrival pop on its wrapper");
  const faq = readFileSync("dist/reference/en/faq/index.html", "utf8");
  assert.match(faq, /<summary class="[^"]*"[^>]*>[\s\S]*?group-open:rotate-180/);
  assert.match(en, /<a href="\/en\/customers\/" class="[^"]*after:scale-x-0 after:origin-left rtl:after:origin-right[^"]*hover:after:scale-x-100/);
});

test("visual layer: hero glow and framed media, eyebrow accent rule, inset CTA panel, logo cloud hover, footer hairline, testimonial quote mark", () => {
  const en = readFileSync("dist/reference/en/index.html", "utf8");
  // The glow belongs to the centered, split, video, form and stats heroes; the style guide shows them (the site's home and landing heroes sit on art and video since 0.11.0 and 0.14.0).
  const glowHero = readFileSync("dist/reference/sys/style-guide/sections/heroes/index.html", "utf8");
  assert.match(glowHero, /<section class="relative isolate overflow-hidden [^"]*"[^>]*data-component="hero"/);
  assert.match(glowHero, /data-component="hero"[^>]*>\s*<div aria-hidden="true" class="pointer-events-none absolute [^"]*bg-hero-backdrop"><\/div>/);
  assert.match(en, /data-component="hero" data-variant="backdrop">[\s\S]*?class="absolute inset-0 -z-10 bg-art-scrim rtl:-scale-x-100"/, "the home hero sits on the art behind the scrim (0.11.0)");
  const css = readFileSync("dist/reference/assets/app.css", "utf8");
  assert.ok(css.includes(".bg-hero-backdrop{background-image:radial-gradient(44rem 26rem at 18% 20%,light-dark("), "hero backdrop glows in the CSS");
  assert.ok(!css.includes("var(--color-line) 1px") && css.includes("mask-image:radial-gradient(#000 25%,#0000 78%)"), "hero backdrop has an edge mask and no dot texture (0.5.0)");
  const guide = readFileSync("dist/reference/sys/style-guide/sections/heroes/index.html", "utf8");
  assert.match(guide, /data-variant="centered">[\s\S]*?<div class="mt-12 overflow-hidden rounded-2xl ring-1 ring-line shadow-xl shadow-ink\/10">/, "centered hero media in a framed rounded-2xl box");
  assert.match(en, /<p class="[^"]*before:h-0\.5 before:w-6 before:rounded-full before:bg-accent-600[^"]*">Why Northwind<\/p>/);
  assert.match(en, /data-component="cta-band"[\s\S]*?<div class="relative isolate overflow-clip rounded-2xl bg-linear-to-br from-brand-700 via-brand-600 to-accent-600/);
  assert.match(en, /data-component="logo-cloud"[\s\S]*?<svg role="img" class="h-6 fill-ink-muted w-auto motion-safe:transition-colors motion-safe:duration-150 hover:fill-ink-brand"/);
  assert.match(en, /<footer class="bg-surface-alt" data-component="footer">\n<div class="h-px bg-linear-to-r from-brand-600 to-accent-600" aria-hidden="true"><\/div>/);
  const svc = readFileSync("dist/reference/en/services/line-automation/index.html", "utf8");
  assert.match(svc, /data-component="testimonial" data-variant="single">\n<span aria-hidden="true" class="block h-12 select-none text-7xl font-bold leading-none text-brand-200">“<\/span>/);
});

test("the landing hero plays the generated sample clip in place (cinema, 0.14.0; the home hero until 0.11.0): native video under the play button, poster, preload none, captions per locale, both formats under 1.5 MB", () => {
  for (const [loc, title] of [["en", "Northwind in eight seconds"], ["de", "Northwind in acht Sekunden"], ["ar", "نورثويند في ثماني ثوانٍ"]]) {
    const html = readFileSync(`dist/reference/${loc}/lp/line-automation-2026/index.html`, "utf8");
    assert.match(html, /data-component="hero" data-variant="cinema"/, `${loc} hero variant`);
    assert.match(html, /<video class="absolute inset-0 -z-10 size-full bg-brand-950 object-cover" controls playsinline preload="none" poster="\/assets\/video\/northwind-sample-poster\.webp" width="1280" height="720" data-cinema>\n<source src="\/assets\/video\/northwind-sample\.webm" type="video\/webm">\n<source src="\/assets\/video\/northwind-sample\.mp4" type="video\/mp4">/, `${loc} video element, with native controls until the script takes over`);
    assert.match(html, new RegExp(`<track kind="captions" src="/assets/video/northwind-sample-${loc}\.vtt" srclang="${loc}" data-cue="[^"]+">`), `${loc} captions track`);
    assert.match(html, new RegExp(`<button type="button" data-play [^>]*>[\\s\\S]*?<span class="sr-only">[^<]*${title}[^<]*0:08[^<]*</span></button>`), `${loc} the play button names the clip and its length`);
    assert.match(html, /group-data-playing\/cinema:invisible/, `${loc} the words step aside while it plays`);
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
  const guide = readFileSync("dist/reference/sys/style-guide/controls/index.html", "utf8");
  for (const [name, html] of [["en", en], ["ar", ar], ["controls", guide]]) {
    const lists = [...html.matchAll(/transition-\[([^\]]+)\]/g)].map((m) => m[1]);
    assert.ok(lists.length > 0, `${name} has transition lists`);
    for (const l of lists) assert.doesNotMatch(l, /transform|box-shadow/, `${name}: transition list "${l}" names a property Tailwind 4 never sets (transform) or R-MOT-01 forbids (box-shadow)`);
  }
  assert.match(en, /motion-safe:transition-\[color,background-color,border-color,translate,scale\]/, "button and card list");
  assert.match(en, /motion-safe:transition-\[opacity,translate,scale,display,overlay\][^>]*data-component="mobile-drawer"/, "drawer list");
  assert.match(guide, /<dialog[^>]*motion-safe:transition-\[opacity,translate,scale,display,overlay\]/, "dialog list");
  assert.match(en, /<section class="[^"]*overflow-x-clip[^"]*"[^>]*data-component="feature-rows"/, "feature rows clip horizontal overflow while rows slide in");
  assert.match(ar, /pending:translate-x-\(--reveal-distance\) rtl:pending:-translate-x-\(--reveal-distance\)/, "rows mirror their slide in RTL");
  const css = readFileSync("dist/reference/assets/app.css", "utf8");
  assert.ok(css.includes(":where([data-entrances] *):not([data-revealed])"), "the pending: variant: only once the observer has marked what is in view (data-entrances), only until revealed");
  assert.ok(/@media screen and \(prefers-reduced-motion:\s?no-preference\)/.test(css), "the pending: variant: only on screen and only with motion allowed");
  assert.ok(!css.includes("@supports not (animation-timeline:view())"), "the nosda fallback is gone: entrances work the same in every browser");
  assert.match(svc, /<li class="flex pending:opacity-0[^"]*motion-safe:data-revealed:delay-90"[^>]*>\n<div class="group relative[^"]*motion-safe:hover:-translate-y-0\.5/, "entrance and column delay on the wrapper, hover on the inner card (R-MOT-05)");
});

test("gate fixes: the floating back-to-top lives inside the footer landmark and every body grid is on the rhythm scale", () => {
  const en = readFileSync("dist/reference/en/index.html", "utf8");
  assert.match(en, /<footer[^>]*>[\s\S]*data-component="back-to-top" data-variant="float"[\s\S]*<\/footer>/, "floating back-to-top inside the footer");
  assert.doesNotMatch(en, /<\/footer>[\s\S]*data-component="back-to-top" data-variant="float"/, "not after the footer");
  // The style guide's section pages, one per group since 0.9.0 (D59).
  const groups = JSON.parse(readFileSync("engine/catalog/style-guide-sections.json", "utf8")).map((g) => `sys/style-guide/sections/${g.slug}/index.html`);
  for (const page of ["en/resources/index.html", "en/products/northwind-studio/index.html", "sys/style-guide/sections/index.html", ...groups]) {
    const html = readFileSync(`dist/reference/${page}`, "utf8");
    assert.doesNotMatch(html, /<ul class="grid gap-6 (?!md:gap-8)/, `${page}: bare gap-6 body grid`);
  }
});

test("brand version and light backdrop (0.18.0): tone-brand re-points the role colours; Industries, Careers and Trust show the header, bar and contained forms; the light backdrop holds the light scheme", () => {
  const css = readFileSync("dist/reference/assets/app.css", "utf8");
  // The minifier splits the utility into blocks, each color-mix() declaration after a hex fallback for browsers without it.
  const body = [...css.matchAll(/\.tone-brand\{([^}]*)\}/g)].map((m) => m[1]).join(";");
  assert.ok(body, "the tone-brand utility is compiled");
  for (const v of ["--color-ink:", "--color-ink-muted:", "--color-line:", "--color-surface-raised:", "--color-ink-brand:", "background-color:"]) assert.ok(body.includes(v), `tone-brand sets ${v}`);
  assert.match(readFileSync("dist/reference/en/industries/index.html", "utf8"), /<section class="py-12 md:py-16 tone-brand" data-component="page-header" data-variant="brand">/);
  assert.match(readFileSync("dist/reference/de/careers/index.html", "utf8"), /<section class="py-16 md:py-24 tone-brand[^"]*" data-component="feature-grid"/, "a full-width brand bar");
  assert.match(readFileSync("dist/reference/ar/trust/index.html", "utf8"), /data-component="feature-index"[^>]*>\n<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"><div class="rounded-3xl tone-brand /, "a contained brand panel");
  const guide = readFileSync("dist/reference/sys/style-guide/sections/heroes/index.html", "utf8");
  assert.match(guide, /<section class="relative isolate overflow-hidden py-16 md:py-28 bg-surface text-ink scheme-light" data-component="hero" data-variant="backdrop"[^>]*>[\s\S]*?data-tone="light"[\s\S]*?bg-art-scrim-light/, "the light backdrop: light art, light scrim, light scheme");
});
