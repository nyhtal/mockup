import { I18nPlugin } from "@11ty/eleventy";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadSite } from "./engine/tools/lib/site.js";
import { themeColors } from "./engine/tools/lib/theme.js";
import { fontPlan } from "./engine/tools/build-fonts.js";
import { engineFiles } from "./engine/tools/lib/engine-files.js";

const OG_LOCALES = { en: "en_GB", de: "de_DE", ar: "ar_SA", fr: "fr_FR", es: "es_ES", it: "it_IT", nl: "nl_NL", pt: "pt_PT", ja: "ja_JP", zh: "zh_CN" };

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

/** /en/about/ → en-about, /en/ → en. Social image file name per page. */
export function ogSlug(url) {
  return url.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "root";
}

export default function (eleventyConfig) {
  const siteName = process.env.SITE || "reference";
  const { site, siteDir } = loadSite(siteName);
  const strings = Object.fromEntries(
    site.locales.map((l) => [l, JSON.parse(readFileSync(`engine/i18n/${l}.json`, "utf8"))])
  );
  const virtual = (name) => readFileSync(path.join("engine", "catalog", "virtual", name), "utf8");

  eleventyConfig.addPlugin(I18nPlugin, { defaultLanguage: site.defaultLocale, errorMode: "strict" });
  eleventyConfig.addGlobalData("site", site);
  eleventyConfig.addGlobalData("themeColors", themeColors(site.brand || {}));
  eleventyConfig.addGlobalData("fontPreload", fontPlan(site.brand || {}, site.locales).preload);
  eleventyConfig.addGlobalData("engineFiles", engineFiles(site));
  const samples = JSON.parse(readFileSync(path.join("engine", "catalog", "samples.json"), "utf8"));
  samples.byId = Object.fromEntries(samples.sections.map((s) => [s.id, s]));
  eleventyConfig.addGlobalData("samples", samples);
  // A Nunjucks global, not global data: Eleventy would call a function-valued global datum to compute its value.
  eleventyConfig.addNunjucksGlobal("unknownSection", (type) => { throw new Error(`Unknown section type "${type}" (R-SEC-12): add it to engine/catalog/sections and the dispatcher`); });
  // Resolve section ids, alternate surfaces (R-SEC-06) and mark reveal eligibility (R-SEC-10). Done in JS because
  // Nunjucks cannot carry state across loop iterations.
  const MEDIA = new Set(["hero", "cta-band", "page-header", "article-meta", "pagination", "filter-bar", "was-this-helpful"]);
  const STATIC = new Set(["search-box", "search-results", "person-bio", "download-detail", "event-detail", "job-detail", "prose", "confirmation", "error-state"]);
  eleventyConfig.addFilter("sectionsPlan", (sections, locale, pageUrl, density, demote = false) => {
    let surface = "bg-surface";
    return (sections || []).map((item, i) => {
      const s = typeof item === "string" ? samples.byId[item] : item;
      if (!s) throw new Error(`Unknown sample section id "${item}"`);
      const reveal = i > 0 && !MEDIA.has(s.type) && !STATIC.has(s.type);
      const step = { s, ctx: { locale, pageUrl, density: density || "comfortable", surface, reveal, index: i, demote: !!demote } };
      if (MEDIA.has(s.type)) surface = "bg-surface";
      else if (!s.surface) surface = surface === "bg-surface" ? "bg-surface-alt" : "bg-surface";
      return step;
    });
  });

  eleventyConfig.addGlobalData("eleventyComputed", {
    locale: (data) => data.page.lang || site.defaultLocale,
    dir: (data) => ((site.rtl || []).includes(data.page.lang) ? "rtl" : "ltr"),
    canonical: (data) => site.url + data.page.url,
    schemaJson: (data) => schemaJson(site, data),
    ogImage: (data) => `/assets/og/${ogSlug(data.page.url)}.png`,
  });

  eleventyConfig.addFilter("t", function (key) {
    const lang = this.page?.lang || site.defaultLocale;
    const value = key.split(".").reduce((o, k) => (o == null ? o : o[k]), strings[lang]);
    if (value == null) throw new Error(`Missing i18n key "${key}" for locale "${lang}"`);
    return value;
  });
  eleventyConfig.addFilter("ogLocale", (lang) => OG_LOCALES[lang] || `${lang}_${lang.toUpperCase()}`);
  // Native language names for switchers (R-I18N-08): never flags, never translated.
  eleventyConfig.addFilter("nativeName", (lang) => {
    try { return new Intl.DisplayNames([lang], { type: "language" }).of(lang) || lang; } catch { return lang; }
  });
  eleventyConfig.addFilter("ogSlug", ogSlug);
  // Shallow merge for passing section data into components without mutating it.
  eleventyConfig.addFilter("merge", (a, b) => ({ ...(a || {}), ...(b || {}) }));
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("htmlPages", (all) => all.filter((p) => p.url && p.url.endsWith("/") && p.data.pageType));
  eleventyConfig.addFilter("sitemapPages", (all) => all.filter((p) => p.url && p.url.endsWith("/") && p.data.pageType && !p.data.noindex));
  // Every locale version of a page including itself, in site.locales order (R-I18N-04).
  // Render-time only: the plugin's locale map is built after computed data runs.
  eleventyConfig.addFilter("allAlternates", function (url) {
    const lang = (url || "").split("/")[1];
    if (!site.locales.includes(lang)) return [];
    const others = eleventyConfig.getFilter("locale_links").call({ page: { url, lang } }, url) || [];
    const all = [{ lang, url }, ...others.map((o) => ({ lang: o.lang, url: o.url }))];
    return site.locales.map((l) => all.find((a) => a.lang === l)).filter(Boolean);
  });
  eleventyConfig.addFilter("xDefaultUrl", (url) => url.replace(/^\/[^/]+\//, `/${site.defaultLocale}/`));

  eleventyConfig.addPassthroughCopy({ "engine/scripts/enhance.js": "assets/enhance.js" });

  // Engine-owned pages every site ships (R-PAGE-07, R-PAGE-08, R-DEPLOY-04, R-DEPLOY-06, R-SEO-07).
  eleventyConfig.addTemplate("_engine/root.njk", virtual("root.njk"));
  eleventyConfig.addTemplate("_engine/sitemap.njk", virtual("sitemap.njk"));
  eleventyConfig.addTemplate("_engine/og-manifest.njk", virtual("og-manifest.njk"));
  eleventyConfig.addTemplate("_engine/files.njk", virtual("files.njk"));
  // Style guide (R-COMP-16, R-PAGE-09): one page per catalog layer, per locale, noindex.
  for (const locale of site.locales) {
    for (const [name, slug, title] of [["style-guide-foundations.njk", "", "Style guide: foundations"], ["style-guide-primitives.njk", "primitives/", "Style guide: primitives"], ["style-guide-components.njk", "components/", "Style guide: content components"], ["style-guide-controls.njk", "controls/", "Style guide: navigation, overlays and states"]]) {
      eleventyConfig.addTemplate(`${locale}/_engine/${name}`, virtual(name), { lang: locale, title, description: `Tokens, primitives, components and sections of ${site.name}, exactly as the catalog renders them.`, permalink: `/${locale}/style-guide/${slug}index.html` });
    }
    // Every sample section, split into four pages so each stays within the HTML budget (R-PERF-01).
    const ids = samples.sections.map((s) => s.id);
    const per = Math.ceil(ids.length / 4);
    ["a", "b", "c", "d"].forEach((letter, i) => {
      const slug = i === 0 ? "sections/" : `sections-${letter}/`;
      eleventyConfig.addTemplate(`${locale}/_engine/style-guide-sections-${letter}.njk`, virtual("style-guide-sections.njk"), { lang: locale, title: `Style guide: sections ${letter.toUpperCase()}`, description: `Every section of the ${site.name} catalog rendered with sample data, part ${letter.toUpperCase()}.`, permalink: `/${locale}/style-guide/${slug}index.html`, sections: ids.slice(i * per, (i + 1) * per) });
    });
  }
  for (const [code, key] of [["404", "notFound"], ["500", "server"]]) {
    for (const locale of site.locales) {
      const s = strings[locale].error[key];
      const t = (k) => k.split(".").reduce((o, x) => (o == null ? o : o[x]), strings[locale]);
      const links = [{ href: `/${locale}/`, label: t("nav.home") }, ...(site.errorLinks || []).map((l) => ({ href: `/${locale}${l.href}`, label: t(l.key) }))];
      const data = { errorCode: code, title: s.title, description: s.text, lang: locale, links };
      eleventyConfig.addTemplate(`${locale}/_engine/${code}.njk`, virtual("error.njk"), { ...data, permalink: `/${locale}/${code}/index.html` });
      if (locale === site.defaultLocale) eleventyConfig.addTemplate(`${locale}/_engine/${code}-root.njk`, virtual("error.njk"), { ...data, permalink: `/${code}.html` });
    }
  }

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
