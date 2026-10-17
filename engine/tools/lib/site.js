import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const readJson = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {});

/** Deep merge of plain objects: keys of b win, nested objects merge, arrays and scalars replace. */
export function deepMerge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) {
    out[k] = v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object" && !Array.isArray(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out;
}

/**
 * Load sites/<name>/site.json (applying the SITE_LOCALES_OVERRIDE test hook), the site's content data
 * per locale (data/<locale>/{entities,pages}.json) and its UI strings: engine/i18n/<locale>.json with the
 * site's i18n/<locale>.json merged over it (R-I18N-05). Missing files are empty objects.
 */
export function loadSite(name) {
  const siteDir = path.join("sites", name);
  const site = JSON.parse(readFileSync(path.join(siteDir, "site.json"), "utf8"));
  if (process.env.SITE_LOCALES_OVERRIDE) site.locales = process.env.SITE_LOCALES_OVERRIDE.split(",");
  const data = {};
  const i18n = {};
  for (const locale of site.locales) {
    data[locale] = { entities: readJson(path.join(siteDir, "data", locale, "entities.json")), pages: readJson(path.join(siteDir, "data", locale, "pages.json")) };
    i18n[locale] = deepMerge(readJson(path.join("engine", "i18n", `${locale}.json`)), readJson(path.join(siteDir, "i18n", `${locale}.json`)));
  }
  return { site, siteDir, data, i18n };
}
