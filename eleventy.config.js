import { I18nPlugin } from "@11ty/eleventy";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadSite } from "./engine/tools/lib/site.js";
import { themeColors, flairFor, motionLevels } from "./engine/tools/lib/theme.js";
import { fontPlan } from "./engine/tools/build-fonts.js";
import { engineFiles } from "./engine/tools/lib/engine-files.js";
import { planSections, fillPlaceholders } from "./engine/tools/lib/sections.js";
import { renderMarkdown, tocOf, wordCount } from "./engine/tools/lib/markdown.js";
import { ENTITY_INDEX, entityUrl, entityNode, pageEntities } from "./engine/tools/lib/entities.js";
import { parseFigure } from "./engine/tools/lib/figures.js";
import { THEME_SCRIPT } from "./engine/tools/lib/theme-script.js";
import { searchIndex, searchPage } from "./engine/tools/lib/search-index.js";

const OG_LOCALES = { en: "en_GB", de: "de_DE", ar: "ar_SA", fr: "fr_FR", es: "es_ES", it: "it_IT", nl: "nl_NL", pt: "pt_PT", ja: "ja_JP", zh: "zh_CN" };

/** Page type → WebPage subtype (R-SCH-03). */
export const PAGE_TYPES = {
  about: "AboutPage", history: "AboutPage", values: "AboutPage", culture: "AboutPage", sustainability: "AboutPage", trust: "AboutPage",
  contact: "ContactPage", demo: "ContactPage",
  person: "ProfilePage", author: "ProfilePage",
  search: "SearchResultsPage",
  faq: "FAQPage",
  collection: "CollectionPage", team: "CollectionPage", locations: "CollectionPage", services: "CollectionPage", products: "CollectionPage",
  industries: "CollectionPage", partners: "CollectionPage", customers: "CollectionPage", resources: "CollectionPage", blog: "CollectionPage", "media-kit": "CollectionPage",
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
  const organization = { "@type": "Organization", "@id": org, name: site.name, url: `${site.url}/`, logo: { "@type": "ImageObject", url: `${site.url}/icon-192.png` } };
  if (site.contact?.email || site.contact?.phone) organization.contactPoint = { "@type": "ContactPoint", contactType: "customer support", email: site.contact.email, telephone: site.contact.phone, availableLanguage: site.locales };
  const graph = [organization, website, pageNode];
  if (data.breadcrumbs && data.breadcrumbs.length) {
    const id = `${canonical}#breadcrumb`;
    graph.push({ "@type": "BreadcrumbList", "@id": id, itemListElement: data.breadcrumbs.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, item: absolute(site, b.url) })) });
    pageNode.breadcrumb = { "@id": id };
  }
  const entityType = ENTITY_TYPES[pageType];
  const list = data.entities || (data.entity ? [data.entity] : []);
  list.forEach((e, i) => {
    const { schemaNodes = [], ...node } = e;
    const id = node["@id"] || `${canonical}#entity${list.length > 1 ? `-${i + 1}` : ""}`;
    graph.push({ "@type": node["@type"] || entityType || "Thing", ...absolutise(site, node), "@id": id });
    for (const extra of schemaNodes) graph.push(absolutise(site, extra));
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
  segments.forEach((seg, i) => {
    acc += `${seg}/`;
    const title = lookup(acc);
    // An intermediate segment with no page of its own (blog/tag/, legal/) gets no crumb: nothing may link to a 404.
    if (!title && i < segments.length - 1) return;
    trail.push({ name: title || seg.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()), url: acc });
  });
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
  const { site, siteDir, data: siteData, i18n: strings } = loadSite(siteName);
  const lookupString = (locale, key) => key.split(".").reduce((o, k) => (o == null ? o : o[k]), strings[locale]);
  // Plural strings are objects of CLDR forms (one, two, few, many, other); every locale lists every form so the keys gate stays exact.
  const t = (locale, key, n) => {
    const v = lookupString(locale, key);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const form = n == null ? "other" : new Intl.PluralRules(locale).select(Number(n));
      return (v[form] ?? v.other ?? "").replace(/\{(n|count)\}/g, String(n ?? ""));
    }
    return v;
  };
  const virtual = (name) => readFileSync(path.join("engine", "catalog", "virtual", name), "utf8");
  const fonts = fontPlan(site.brand || {}, site.locales);
  const fmtFor = (locale) => ({ date: (iso) => formatDate(iso, locale, site) });
  const entityCtx = (locale) => ({ locale, site, entities: siteData[locale]?.entities || {}, fmt: fmtFor(locale) });
  const detailRecipes = (locale) => siteData[locale]?.pages?.detail || {};
  // The site search covers the entities of each locale (to-do 4): sections read it as `from: "searchIndex"`.
  for (const l of site.locales) if (siteData[l]?.entities) siteData[l].entities.searchIndex = searchIndex(siteData[l].entities, entityCtx(l));

  eleventyConfig.addPlugin(I18nPlugin, { defaultLanguage: site.defaultLocale, errorMode: "strict" });
  eleventyConfig.addGlobalData("site", site);
  eleventyConfig.addGlobalData("themeColors", themeColors(site.brand || {}));
  // The flair dial's booleans for chrome outside the section planner (header hairline), and the level table for the style guide (R-TOK-12).
  eleventyConfig.addGlobalData("flair", flairFor(site.brand?.motion));
  eleventyConfig.addGlobalData("motionLevels", motionLevels());
  // The inline theme script of R-PERF-03; its hash is in the CSP (engine-files.js).
  eleventyConfig.addGlobalData("themeScript", THEME_SCRIPT);
  eleventyConfig.addGlobalData("engineFiles", engineFiles(site));
  eleventyConfig.addGlobalData("buildYear", String(new Date().getUTCFullYear()));
  eleventyConfig.addGlobalData("siteData", siteData);
  const samples = JSON.parse(readFileSync(path.join("engine", "catalog", "samples.json"), "utf8"));
  samples.byId = Object.fromEntries(samples.sections.map((s) => [s.id, s]));
  eleventyConfig.addGlobalData("samples", samples);
  // A Nunjucks global, not global data: Eleventy would call a function-valued global datum to compute its value.
  eleventyConfig.addNunjucksGlobal("unknownSection", (type) => { throw new Error(`Unknown section type "${type}" (R-SEC-12): add it to engine/catalog/sections and the dispatcher`); });

  // Section ids → render steps with alternating surfaces, reveal flags and the page context (see lib/sections.js).
  // Site sections (pages.json `sections`) and entities come from the page's locale; `e` is the page's entity when it has one.
  eleventyConfig.addFilter("sectionsPlan", function (sections, locale, pageUrl, density, demote = false, breadcrumbs = [], header = null) {
    const lang = locale || site.defaultLocale;
    return planSections(samples, sections, {
      locale: lang, pageUrl, density, motion: site.brand?.motion, demote, breadcrumbs, header: header || undefined,
      siteSections: siteData[lang]?.pages?.sections || {}, defaultSiteSections: lang === site.defaultLocale ? undefined : siteData[site.defaultLocale]?.pages?.sections || {}, entities: siteData[lang]?.entities || {}, entity: this.ctx?.e,
      site, fmt: fmtFor(lang), md: renderMarkdown, toc: tocOf,
    });
  });

  eleventyConfig.addGlobalData("eleventyComputed", {
    locale: (data) => data.page.lang || site.defaultLocale,
    dir: (data) => ((site.rtl || []).includes(data.page.lang) ? "rtl" : "ltr"),
    canonical: (data) => site.url + data.page.url,
    ogImage: (data) => `/assets/og/${ogSlug(data.page.url)}.png`,
    // Only the page's own script is preloaded (R-I18N-11).
    fontPreload: (data) => fonts.preloadFor(data.page.lang || site.defaultLocale),
    feedUrl: (data) => {
      const lang = data.page.lang || site.defaultLocale;
      return ["blog", "post", "archive", "author"].includes(data.pageType) && (siteData[lang]?.entities?.posts || []).length ? `/${lang}/feed.xml` : undefined;
    },
    // Entity pages: title and meta come from the entity unless the recipe says otherwise; "{e.x}" placeholders are filled.
    title: (data) => fillPlaceholders(data.title, data.e) || data.e?.title || data.e?.name || data.e?.city,
    description: (data) => fillPlaceholders(data.description, data.e) || data.e?.description,
    eyebrow: (data) => fillPlaceholders(data.eyebrow, data.e) || data.e?.eyebrow,
    lede: (data) => fillPlaceholders(data.lede, data.e) || data.e?.lede,
    ogType: (data) => data.ogType || (["post", "press-release", "case-study", "doc"].includes(data.pageType) ? "article" : undefined),
    published: (data) => data.published || data.e?.date,
    readingTime: (data) => {
      if (data.readingTime || !data.e?.body || data.layout !== "article.njk") return data.readingTime;
      const lang = data.page.lang || site.defaultLocale;
      return t(lang, "ui.readingTime", Math.max(1, Math.round(wordCount(data.e.body) / 200)));
    },
    author: (data) => {
      if (data.author || !data.e?.author) return data.author;
      const lang = data.page.lang || site.defaultLocale;
      const person = (siteData[lang]?.entities?.people || []).find((p) => p.slug === data.e.author);
      if (!person) throw new Error(`${data.page.url}: author "${data.e.author}" is not in data/${lang}/entities.json people`);
      const recipe = detailRecipes(lang).author;
      const hasPage = recipe && (!recipe.where || Object.entries(recipe.where).every(([k, v]) => person[k] === v));
      // The author box takes a short plain-text bio (≤ 40 words, R-SEC-04): the first paragraph of the person's Markdown bio, which the profile page renders in full.
      return { name: person.name, role: person.role, bio: person.bio ? person.bio.split(/\n\s*\n/)[0].trim() : undefined, href: hasPage ? entityUrl("authors", person.slug, lang) : undefined };
    },
    tags: (data) => {
      if (data.tags || !data.e?.tags) return data.tags;
      const lang = data.page.lang || site.defaultLocale;
      const all = siteData[lang]?.entities?.tags || [];
      return data.e.tags.map((slug) => {
        const tag = all.find((x) => x.slug === slug);
        if (!tag) throw new Error(`${data.page.url}: tag "${slug}" is not in data/${lang}/entities.json tags`);
        return { label: tag.label, href: detailRecipes(lang).archive ? entityUrl("tags", slug, lang) : undefined };
      });
    },
    toc: (data) => (data.toc === true && data.e?.body ? tocOf(data.e.body) : data.toc === true ? undefined : data.toc),
    // Breadcrumbs from the URL; names come from sibling pages' titles when they exist (R-SEO-11, R-SCH-12).
    breadcrumbs: (data) => {
      if (data.breadcrumbs) return data.breadcrumbs;
      if (!data.pageType || data.pageType === "home" || data.pageType === "error" || data.pageType === "redirect") return [];
      const lang = data.page.lang || site.defaultLocale;
      const all = data.collections?.all || [];
      // The page's own crumb is its title; other crumbs come from the pages at those URLs (every paginated page is in the collection).
      const lookup = (url) => (url === data.page.url ? data.title : all.find((p) => p.url === url)?.data?.title);
      return breadcrumbTrail(data.page.url, lang, lookup, t(lang, "nav.home") || "Home");
    },
    // Schema entities: the page's entity (recipe pages) or the list the page type implies (team, locations, …).
    entity: (data) => {
      if (data.entity || !data.e || !data.entityKind) return data.entity;
      return entityNode(data.entityKind, data.e, entityCtx(data.page.lang || site.defaultLocale));
    },
    entities: (data) => {
      if (data.entities || data.e) return data.entities;
      const lang = data.page.lang || site.defaultLocale;
      const pricing = (data.sections || []).map((s) => (typeof s === "string" ? siteData[lang]?.pages?.sections?.[s] || samples.byId[s] : s)).find((s) => s?.type === "pricing");
      const tiers = pricing?.tiers?.map((x) => ({ name: x.name, price: x.amount ?? null, currency: x.currency }));
      return pageEntities(data.pageType, { url: data.page.url, title: data.title, description: data.description, tiers }, entityCtx(lang));
    },
    schemaJson: (data) => schemaJson(site, data),
  });

  eleventyConfig.addFilter("t", function (key, n) {
    const lang = this.ctx?.page?.lang || site.defaultLocale;
    const value = t(lang, key, n);
    if (value == null) throw new Error(`Missing i18n key "${key}" for locale "${lang}"`);
    return value;
  });
  eleventyConfig.addFilter("md", renderMarkdown);
  // The tagline in the page's language: the site's string overlay (site.tagline) or site.json's tagline.
  const tagline = (lang) => t(lang || site.defaultLocale, "site.tagline") || site.tagline;
  eleventyConfig.addFilter("tagline", tagline);
  eleventyConfig.addFilter("ogLocale", (lang) => OG_LOCALES[lang] || `${lang}_${lang.toUpperCase()}`);
  // Native language names for switchers (R-I18N-08): never flags, never translated.
  eleventyConfig.addFilter("nativeName", (lang) => {
    try { return new Intl.DisplayNames([lang], { type: "language" }).of(lang) || lang; } catch { return lang; }
  });
  eleventyConfig.addFilter("ogSlug", ogSlug);
  // Shallow merge for passing section data into components without mutating it.
  eleventyConfig.addFilter("merge", (a, b) => ({ ...(a || {}), ...(b || {}) }));
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("formatDate", function (iso, style) { return formatDate(iso, this.ctx?.page?.lang || site.defaultLocale, site, style); });
  // One page of search results, matches first, with <mark> around the query (to-do 4).
  eleventyConfig.addFilter("searchPage", (index, query, page, perPage) => searchPage(index || [], query, page || 1, perPage || 12));
  eleventyConfig.addFilter("formatNumber", function (n) { return formatNumber(n, this.ctx?.page?.lang || site.defaultLocale, site); });
  // A formatted figure → { number, decimals, nu, prefix, suffix } for the count-up (R-MOT-10); null when it holds no digit.
  eleventyConfig.addFilter("figure", function (value) { return parseFigure(value, fmtLocale(this.ctx?.page?.lang || site.defaultLocale, site)); });
  eleventyConfig.addFilter("formatCurrency", function (n, code) { return formatCurrency(n, this.ctx?.page?.lang || site.defaultLocale, code, site); });
  eleventyConfig.addFilter("htmlPages", (all) => all.filter((p) => p.url && p.url.endsWith("/") && p.data.pageType));
  eleventyConfig.addFilter("sitemapPages", (all) => all.filter((p) => p.url && p.url.endsWith("/") && p.data.pageType && !p.data.noindex));
  // Every locale version of a page including itself, in site.locales order (R-I18N-04).
  // Render-time only: the plugin's locale map is built after computed data runs.
  const allAlternates = (url) => {
    const lang = (url || "").split("/")[1];
    if (!site.locales.includes(lang)) return [];
    // The plugin groups paginated pages by template, so pick the entry whose path is this page's path in the other locale (shared slugs, R-PAGE-02).
    const others = eleventyConfig.getFilter("locale_links").call({ page: { url, lang } }, url) || [];
    const rest = url.slice(lang.length + 1);
    const all = [{ lang, url }, ...others.filter((o) => o.url === `/${o.lang}${rest}`).map((o) => ({ lang: o.lang, url: o.url }))];
    return site.locales.map((l) => all.find((a) => a.lang === l)).filter(Boolean);
  };
  eleventyConfig.addFilter("allAlternates", allAlternates);
  // x-default is the default-locale version when it exists; a locale-only page (R-I18N-13) is its own x-default.
  eleventyConfig.addFilter("xDefaultUrl", (url) => allAlternates(url).find((a) => a.lang === site.defaultLocale)?.url || url);
  // HTML site map groups: one per top-level section with two or more pages, titled by its index page; single pages join the home group.
  eleventyConfig.addFilter("sitemapGroups", (all, locale) => {
    const pages = all.filter((p) => p.url && p.url.startsWith(`/${locale}/`) && p.url.endsWith("/") && p.data.pageType && !p.data.noindex);
    const bySeg = new Map();
    for (const p of pages) {
      const seg = p.url.slice(locale.length + 2).split("/")[0] || "";
      if (!bySeg.has(seg)) bySeg.set(seg, []);
      bySeg.get(seg).push({ label: p.data.title, href: p.url, depth: p.url.split("/").length });
    }
    const home = [];
    const groups = [];
    for (const [seg, links] of bySeg) {
      links.sort((a, b) => a.depth - b.depth || a.href.localeCompare(b.href));
      const index = pages.find((p) => p.url === `/${locale}/${seg}/`);
      if (seg === "" || links.length < 2) home.push(...links);
      else groups.push({ title: t(locale, `sitemap.${seg}`) || index?.data.title || seg.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()), links: links.map(({ label, href }) => ({ label, href })) });
    }
    home.sort((a, b) => a.depth - b.depth || a.href.localeCompare(b.href));
    return [{ title: t(locale, "nav.home") || "Home", links: home.map(({ label, href }) => ({ label, href })) }, ...groups];
  });

  eleventyConfig.addPassthroughCopy({ "engine/scripts/enhance.js": "assets/enhance.js" });

  // Engine-owned pages every site ships (R-PAGE-07, R-PAGE-08, R-DEPLOY-04, R-DEPLOY-06, R-SEO-07).
  eleventyConfig.addTemplate("_engine/root.njk", virtual("root.njk"));
  eleventyConfig.addTemplate("_engine/sitemap.njk", virtual("sitemap.njk"));
  eleventyConfig.addTemplate("_engine/og-manifest.njk", virtual("og-manifest.njk"));
  eleventyConfig.addTemplate("_engine/files.njk", virtual("files.njk"));
  // Style guide (R-COMP-16, R-PAGE-09): one page per catalog layer, noindex, in the default locale only (its sample data is English).
  for (const locale of [site.defaultLocale]) {
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

  // Data-driven pages per locale from sites/<name>/data/<locale>/{entities,pages}.json.
  const matches = (item, where) => Object.entries(where).every(([k, v]) => (Array.isArray(item[k]) ? item[k].includes(v) : item[k] === v));
  for (const locale of site.locales) {
    const { entities = {}, pages = {} } = siteData[locale] || {};
    // Detail pages: one per entity of the recipe's kind (bylaw 09 detail rows; R-SEC-12 data only).
    for (const [pageType, r] of Object.entries(pages.detail || {})) {
      const kind = r.kind || r.each;
      const items = (entities[r.each] || []).filter((e) => !r.where || matches(e, r.where));
      if (!items.length) continue;
      eleventyConfig.addTemplate(`${locale}/_engine/detail-${pageType}.njk`, virtual("entity.njk"), {
        lang: locale, pageType, entityKind: kind, layout: r.layout === "article" ? "article.njk" : "page.njk",
        entityList: items, pagination: { data: "entityList", size: 1, alias: "e", addAllPagesToCollections: true },
        permalink: `/${locale}/${ENTITY_INDEX[kind]}/{{ e.slug }}/index.html`,
        title: r.title, description: r.description, eyebrow: r.eyebrow, lede: r.lede, sections: r.sections || [],
        toc: r.toc, noindex: r.noindex, conversion: r.conversion,
      });
    }
    // Thank-you pages, one per form (R-PAGE-10): keyed by the form page's path.
    for (const [form, ty] of Object.entries(pages.thankYou || {})) {
      eleventyConfig.addTemplate(`${locale}/_engine/thank-you-${form.replace(/\//g, "-")}.njk`, virtual("thank-you.njk"), {
        lang: locale, title: ty.title, description: ty.description, permalink: `/${locale}/${form}/thank-you/index.html`,
        sections: [{ type: "page-header", eyebrow: ty.eyebrow, title: ty.title, lede: ty.lede }, { type: "confirmation", title: ty.heading, text: ty.text, next: ty.next, cta: ty.cta }],
      });
    }
    if (pages.sitemap) {
      eleventyConfig.addTemplate(`${locale}/_engine/sitemap-page.njk`, virtual("sitemap-page.njk"), { lang: locale, ...pages.sitemap, permalink: `/${locale}/sitemap/index.html` });
    }
    // Atom feed of the blog (R-SEO-08).
    const posts = [...(entities.posts || [])].sort((a, b) => (a.date < b.date ? 1 : -1)).map((p) => ({ ...p, authorName: (entities.people || []).find((x) => x.slug === p.author)?.name }));
    if (posts.length) {
      eleventyConfig.addTemplate(`${locale}/_engine/feed.njk`, virtual("feed.njk"), { lang: locale, posts, feedTitle: pages.feedTitle || tagline(locale) || site.name, permalink: `/${locale}/feed.xml` });
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
