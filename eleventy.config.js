import { I18nPlugin } from "@11ty/eleventy";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadSite } from "./engine/tools/lib/site.js";
import { themeColors } from "./engine/tools/lib/theme.js";
import { fontPlan } from "./engine/tools/build-fonts.js";
import { engineFiles } from "./engine/tools/lib/engine-files.js";

const OG_LOCALES = { en: "en_GB", de: "de_DE", ar: "ar_SA", fr: "fr_FR", es: "es_ES", it: "it_IT", nl: "nl_NL", pt: "pt_PT", ja: "ja_JP", zh: "zh_CN" };

/** Page type → WebPage subtype (R-SCH-03). */
export const PAGE_TYPES = {
  about: "AboutPage", history: "AboutPage", values: "AboutPage", culture: "AboutPage", sustainability: "AboutPage", trust: "AboutPage",
  contact: "ContactPage", demo: "ContactPage",
  person: "ProfilePage", author: "ProfilePage",
  search: "SearchResultsPage",
  faq: "FAQPage",
  collection: "CollectionPage", team: "CollectionPage", locations: "CollectionPage", services: "CollectionPage", products: "CollectionPage",
  industries: "CollectionPage", partners: "CollectionPage", customers: "CollectionPage", resources: "CollectionPage", blog: "CollectionPage",
  archive: "CollectionPage", downloads: "CollectionPage", events: "CollectionPage", glossary: "CollectionPage", help: "CollectionPage",
  news: "CollectionPage", careers: "CollectionPage", investors: "CollectionPage",
};

/** Page type → the @type of its main entity when front matter supplies `entity` / `entities` (R-SCH-07). */
export const ENTITY_TYPES = {
  service: "Service", industry: "Service", product: "Product", pricing: "Product",
  "case-study": "Article", article: "Article", download: "Article", doc: "Article",
  post: "BlogPosting", "press-release": "NewsArticle",
  job: "JobPosting", event: "Event", person: "Person", author: "Person", team: "Person", speakers: "Person",
  office: "Place", locations: "Place", contact: "ContactPoint",
};

const absolute = (site, v) => (typeof v === "string" && v.startsWith("/") ? site.url + v : v);
const URL_KEYS = new Set(["url", "image", "logo", "sameAs", "contentUrl", "thumbnailUrl", "item", "embedUrl"]);
function absolutise(site, node) {
  if (Array.isArray(node)) return node.map((n) => absolutise(site, n));
  if (node && typeof node === "object") return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, URL_KEYS.has(k) ? absolute(site, v) : absolutise(site, v)]));
  return node;
}

/** One JSON-LD @graph per page: shared nodes, the typed page node, breadcrumbs and the page's entity (bylaw 13). */
export function schemaJson(site, data) {
  const org = `${site.url}/#organization`;
  const web = `${site.url}/#website`;
  const lang = data.page.lang || site.defaultLocale;
  const canonical = site.url + data.page.url;
  const pageType = data.pageType || "generic";
  const website = { "@type": "WebSite", "@id": web, url: `${site.url}/`, name: site.name, publisher: { "@id": org }, inLanguage: lang };
  if (site.hasSearch) {
    website.potentialAction = { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${site.url}/${lang}/search/?q={search_term_string}` }, "query-input": "required name=search_term_string" };
  }
  const pageNode = {
    "@type": PAGE_TYPES[pageType] || "WebPage",
    "@id": canonical,
    url: canonical,
    name: data.title,
    description: data.description,
    isPartOf: { "@id": web },
    inLanguage: lang,
  };
  const graph = [{ "@type": "Organization", "@id": org, name: site.name, url: `${site.url}/` }, website, pageNode];
  if (data.breadcrumbs && data.breadcrumbs.length) {
    const id = `${canonical}#breadcrumb`;
    graph.push({ "@type": "BreadcrumbList", "@id": id, itemListElement: data.breadcrumbs.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, item: absolute(site, b.url) })) });
    pageNode.breadcrumb = { "@id": id };
  }
  const entityType = ENTITY_TYPES[pageType];
  const list = data.entities || (data.entity ? [data.entity] : []);
  list.forEach((e, i) => {
    const id = `${canonical}#entity${list.length > 1 ? `-${i + 1}` : ""}`;
    graph.push({ "@type": e["@type"] || entityType || "Thing", "@id": id, ...absolutise(site, e) });
    if (list.length === 1) pageNode.mainEntity = { "@id": id };
  });
  // Escape the three characters that could end the script element or start markup inside it.
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/[<>&]/g, (c) => ({ "<": "\\u003c", ">": "\\u003e", "&": "\\u0026" }[c]));
}

/** /en/about/team/ → [Home, About us, Team] using page titles where known, else the slug in sentence case (R-SEO-11). */
export function breadcrumbTrail(url, locale, lookup, homeLabel) {
  const prefix = `/${locale}/`;
  if (!url || !url.startsWith(prefix) || url === prefix) return [];
  const segments = url.slice(prefix.length).split("/").filter(Boolean);
  const trail = [{ name: homeLabel, url: prefix }];
  let acc = prefix;
  for (const seg of segments) {
    acc += `${seg}/`;
    const name = lookup(acc) || seg.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
    trail.push({ name, url: acc });
  }
  return trail;
}

/** /en/about/ → en-about, /en/ → en. Social image file name per page. */
export function ogSlug(url) {
  return url.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "root";
}

/** Locale-aware formatting at build time (R-I18N-07). Latin digits unless the site asks otherwise; bare "en" is British, like og:locale. */
const FORMAT_LOCALES = { en: "en-GB" };
const fmtLocale = (locale, site) => `${site?.formatLocales?.[locale] || FORMAT_LOCALES[locale] || locale}-u-nu-${site?.numberingSystem?.[locale] || "latn"}`;
export function formatDate(iso, locale, site = {}, style = "long") {
  return new Intl.DateTimeFormat(fmtLocale(locale, site), { dateStyle: style, timeZone: "UTC" }).format(new Date(iso));
}
export function formatNumber(n, locale, site = {}) {
  return new Intl.NumberFormat(fmtLocale(locale, site)).format(n);
}
export function formatCurrency(n, locale, code, site = {}) {
  return new Intl.NumberFormat(fmtLocale(locale, site), { style: "currency", currency: code }).format(n);
}

export default function (eleventyConfig) {
  const siteName = process.env.SITE || "reference";
  const { site, siteDir } = loadSite(siteName);
  const strings = Object.fromEntries(
    site.locales.map((l) => [l, JSON.parse(readFileSync(`engine/i18n/${l}.json`, "utf8"))])
  );
  const t = (locale, key) => key.split(".").reduce((o, k) => (o == null ? o : o[k]), strings[locale]);
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
    ogImage: (data) => `/assets/og/${ogSlug(data.page.url)}.png`,
    // Breadcrumbs from the URL; names come from sibling pages' titles when they exist (R-SEO-11, R-SCH-12).
    breadcrumbs: (data) => {
      if (data.breadcrumbs) return data.breadcrumbs;
      if (!data.pageType || data.pageType === "home" || data.pageType === "error" || data.pageType === "redirect") return [];
      const lang = data.page.lang || site.defaultLocale;
      const all = data.collections?.all || [];
      const lookup = (url) => all.find((p) => p.url === url)?.data?.title;
      return breadcrumbTrail(data.page.url, lang, lookup, t(lang, "nav.home") || "Home");
    },
    schemaJson: (data) => schemaJson(site, data),
  });

  eleventyConfig.addFilter("t", function (key) {
    const lang = this.page?.lang || site.defaultLocale;
    const value = t(lang, key);
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
  eleventyConfig.addFilter("formatDate", function (iso, style) { return formatDate(iso, this.page?.lang || site.defaultLocale, site, style); });
  eleventyConfig.addFilter("formatNumber", function (n) { return formatNumber(n, this.page?.lang || site.defaultLocale, site); });
  eleventyConfig.addFilter("formatCurrency", function (n, code) { return formatCurrency(n, this.page?.lang || site.defaultLocale, code, site); });
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
      eleventyConfig.addTemplate(`${locale}/_engine/${name}`, virtual(name), { lang: locale, title, description: `Tokens, primitives, components and sections of ${site.name}, rendered exactly as the catalog produces them, with every variant and state on display.`, permalink: `/${locale}/style-guide/${slug}index.html` });
    }
    // Every sample section, split into four pages so each stays within the HTML budget (R-PERF-01).
    const ids = samples.sections.map((s) => s.id);
    const per = Math.ceil(ids.length / 4);
    ["a", "b", "c", "d"].forEach((letter, i) => {
      const slug = i === 0 ? "sections/" : `sections-${letter}/`;
      eleventyConfig.addTemplate(`${locale}/_engine/style-guide-sections-${letter}.njk`, virtual("style-guide-sections.njk"), { lang: locale, title: `Style guide: sections ${letter.toUpperCase()}`, description: `Every section in the ${site.name} catalog, rendered from its sample data exactly as a page would show it. Part ${letter.toUpperCase()} of four.`, permalink: `/${locale}/style-guide/${slug}index.html`, sections: ids.slice(i * per, (i + 1) * per) });
    });
  }
  for (const [code, key] of [["404", "notFound"], ["500", "server"]]) {
    for (const locale of site.locales) {
      const s = strings[locale].error[key];
      const links = [{ href: `/${locale}/`, label: t(locale, "nav.home") }, ...(site.errorLinks || []).map((l) => ({ href: `/${locale}${l.href}`, label: t(locale, l.key) }))];
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
