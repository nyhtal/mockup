import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { pagesFor, parse } from "../lib/html.js";

export const id = "i18n";
export const checks = ["keys", "lang-attr", "x-default", "hreflang-target", "hreflang-reciprocal"];

/** Dotted key paths of a nested object, sorted. */
export function flattenKeys(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...flattenKeys(v, key));
    else out.push(key);
  }
  return out.sort();
}

/** URL path of a built page: dist/x/en/about/index.html → /en/about/ */
function pagePath(distDir, file) {
  const rel = path.relative(distDir, file).replace(/\\/g, "/");
  return "/" + rel.replace(/index\.html$/, "");
}

function alternates(root) {
  const out = new Map();
  for (const l of root.querySelectorAll('link[rel="alternate"][hreflang]')) {
    const href = l.getAttribute("href") || "";
    out.set(l.getAttribute("hreflang"), href.replace(/^https?:\/\/[^/]+/, ""));
  }
  return out;
}

export async function run(ctx) {
  const findings = [];
  const site = ctx.site;
  const i18nDir = ctx.i18nDir || path.join("engine", "i18n");

  // 1. Every locale has exactly the default locale's keys.
  const keysOf = (l) => new Set(flattenKeys(JSON.parse(readFileSync(path.join(i18nDir, `${l}.json`), "utf8"))));
  const base = keysOf(site.defaultLocale);
  for (const locale of site.locales) {
    if (locale === site.defaultLocale) continue;
    const other = keysOf(locale);
    for (const k of base) if (!other.has(k)) findings.push({ file: `${i18nDir}/${locale}.json`, message: `key "${k}" is missing in ${locale}`, check: "i18n/keys" });
    for (const k of other) if (!base.has(k)) findings.push({ file: `${i18nDir}/${locale}.json`, message: `key "${k}" exists in ${locale} but is missing in ${site.defaultLocale}`, check: "i18n/keys" });
  }

  // 2. Per page: lang attribute, x-default, targets exist, targets link back.
  for (const file of pagesFor(ctx)) {
    const add = (check, message) => findings.push({ file, message, check: `i18n/${check}` });
    const { root } = parse(file);
    const own = pagePath(ctx.distDir, file);
    const seg = own.split("/")[1];
    const lang = root.querySelector("html")?.getAttribute("lang");
    if (site.locales.includes(seg) && lang !== seg) add("lang-attr", `<html lang="${lang}"> under /${seg}/`);

    const alts = alternates(root);
    if (alts.size === 0) continue;
    if (!alts.has("x-default")) add("x-default", "alternates present but no x-default");
    for (const [hreflang, target] of alts) {
      if (hreflang === "x-default" || target === own) continue;
      const targetFile = path.join(ctx.distDir, target, "index.html");
      if (!existsSync(targetFile)) { add("hreflang-target", `hreflang="${hreflang}" points at ${target}, which does not exist`); continue; }
      const back = [...alternates(parse(targetFile).root)].filter(([l]) => l !== "x-default").map(([, p]) => p);
      if (!back.includes(own)) add("hreflang-reciprocal", `${target} does not link back to ${own} with an explicit hreflang`);
    }
  }
  return { id, ok: findings.length === 0, findings };
}
