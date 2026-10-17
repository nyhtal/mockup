import { readFileSync } from "node:fs";
import path from "node:path";

/** Load sites/<name>/site.json, applying the SITE_LOCALES_OVERRIDE test hook. */
export function loadSite(name) {
  const siteDir = path.join("sites", name);
  const site = JSON.parse(readFileSync(path.join(siteDir, "site.json"), "utf8"));
  if (process.env.SITE_LOCALES_OVERRIDE) site.locales = process.env.SITE_LOCALES_OVERRIDE.split(",");
  return { site, siteDir };
}
