import { I18nPlugin } from "@11ty/eleventy";
import { readFileSync } from "node:fs";
import { loadSite } from "./engine/tools/lib/site.js";

export default function (eleventyConfig) {
  const siteName = process.env.SITE || "reference";
  const { site, siteDir } = loadSite(siteName);
  const strings = Object.fromEntries(
    site.locales.map((l) => [l, JSON.parse(readFileSync(`engine/i18n/${l}.json`, "utf8"))])
  );

  eleventyConfig.addPlugin(I18nPlugin, { defaultLanguage: site.defaultLocale, errorMode: "strict" });
  eleventyConfig.addGlobalData("site", site);
  eleventyConfig.addGlobalData("eleventyComputed", {
    locale: (data) => data.page.lang || site.defaultLocale,
    dir: (data) => ((site.rtl || []).includes(data.page.lang) ? "rtl" : "ltr"),
  });
  eleventyConfig.addFilter("t", function (key) {
    const lang = this.page?.lang || site.defaultLocale;
    const value = key.split(".").reduce((o, k) => (o == null ? o : o[k]), strings[lang]);
    if (value == null) throw new Error(`Missing i18n key "${key}" for locale "${lang}"`);
    return value;
  });
  eleventyConfig.addPassthroughCopy({ "engine/scripts/enhance.js": "assets/enhance.js" });

  return {
    dir: {
      input: `${siteDir}/content`,
      includes: "../../../engine/catalog",
      layouts: "../../../engine/catalog/templates",
      output: `dist/${siteName}`,
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
