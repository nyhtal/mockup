import { I18nPlugin } from "@11ty/eleventy";
import { readFileSync } from "node:fs";
import { loadSite } from "./engine/tools/lib/site.js";
import { themeColors } from "./engine/tools/lib/theme.js";
import { fontPlan } from "./engine/tools/build-fonts.js";

/** One JSON-LD @graph per page: shared #organization and #website nodes plus the page node. */
export function schemaJson(site, data) {
  const org = `${site.url}/#organization`;
  const web = `${site.url}/#website`;
  const lang = data.page.lang || site.defaultLocale;
  const graph = [
    { "@type": "Organization", "@id": org, name: site.name, url: `${site.url}/` },
    { "@type": "WebSite", "@id": web, url: `${site.url}/`, name: site.name, publisher: { "@id": org }, inLanguage: lang },
    {
      "@type": "WebPage",
      "@id": site.url + data.page.url,
      url: site.url + data.page.url,
      name: data.title,
      description: data.description,
      isPartOf: { "@id": web },
      inLanguage: lang,
    },
  ];
  // Escape the three characters that could end the script element or start markup inside it.
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/[<>&]/g, (c) => ({ "<": "\\u003c", ">": "\\u003e", "&": "\\u0026" }[c]));
}

export default function (eleventyConfig) {
  const siteName = process.env.SITE || "reference";
  const { site, siteDir } = loadSite(siteName);
  const strings = Object.fromEntries(
    site.locales.map((l) => [l, JSON.parse(readFileSync(`engine/i18n/${l}.json`, "utf8"))])
  );

  eleventyConfig.addPlugin(I18nPlugin, { defaultLanguage: site.defaultLocale, errorMode: "strict" });
  eleventyConfig.addGlobalData("site", site);
  eleventyConfig.addGlobalData("themeColors", themeColors(site.brand || {}));
  eleventyConfig.addGlobalData("fontPreload", fontPlan(site.brand || {}, site.locales).preload);
  eleventyConfig.addGlobalData("eleventyComputed", {
    locale: (data) => data.page.lang || site.defaultLocale,
    dir: (data) => ((site.rtl || []).includes(data.page.lang) ? "rtl" : "ltr"),
    canonical: (data) => site.url + data.page.url,
    schemaJson: (data) => schemaJson(site, data),
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
