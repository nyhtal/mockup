import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync, cpSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSite } from "./lib/site.js";
import { brandTokens } from "./lib/theme.js";
import { fontPlan, copyFonts } from "./build-fonts.js";
import { injectSprites } from "./build-icons.js";
import { generateImages } from "./build-images.js";

export function parseArgs(argv) {
  const i = argv.indexOf("--site");
  return { site: i >= 0 ? argv[i + 1] : "reference" };
}

function htmlPaths(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) out.push(...htmlPaths(p).map((x) => path.join(e, x)));
    else if (e.endsWith(".html")) out.push(e);
  }
  return out;
}

/** Every page in the default locale must exist in every other locale. */
export function checkLocaleCoverage(dist, site) {
  const base = new Set(htmlPaths(path.join(dist, site.defaultLocale)));
  for (const locale of site.locales) {
    if (locale === site.defaultLocale) continue;
    const have = new Set(htmlPaths(path.join(dist, locale)));
    for (const p of base) if (!have.has(p)) throw new Error(`Locale "${locale}" is missing page /${locale}/${p.replace(/\\/g, "/")}`);
  }
}

export async function build({ site }) {
  const dist = `dist/${site}`;
  rmSync(dist, { recursive: true, force: true });
  process.env.SITE = site;
  const { site: siteConfig } = loadSite(site);

  const { default: Eleventy } = await import("@11ty/eleventy");
  const eleventy = new Eleventy(undefined, undefined, { quietMode: true, configPath: "eleventy.config.js" });
  await eleventy.write();
  checkLocaleCoverage(dist, siteConfig);

  const fonts = fontPlan(siteConfig.brand || {}, siteConfig.locales);
  copyFonts(fonts, dist);
  // Sprites go in before Tailwind runs so the sprite's `hidden` class is part of the compiled CSS.
  injectSprites(dist);
  const css = readFileSync("engine/theme/app.css", "utf8")
    .replaceAll("__SITE__", site)
    .replace("/* @brand */", brandTokens(siteConfig.brand || {}))
    .replace("/* @fonts */", fonts.css);
  mkdirSync("engine/theme/.tmp", { recursive: true });
  writeFileSync("engine/theme/.tmp/app.css", css);
  mkdirSync(`${dist}/assets`, { recursive: true });
  const tailwind = path.join("node_modules", "@tailwindcss", "cli", "dist", "index.mjs");
  execFileSync(process.execPath, [tailwind, "-i", "engine/theme/.tmp/app.css", "-o", `${dist}/assets/app.css`, "--minify"], { stdio: "inherit" });

  await generateImages(dist, siteConfig.brand || {});

  for (const f of ["fonts", "images", "icons"]) {
    const src = `sites/${site}/assets/${f}`;
    if (existsSync(src)) cpSync(src, `${dist}/assets/${f}`, { recursive: true });
  }
  return dist;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  build(parseArgs(process.argv.slice(2))).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
