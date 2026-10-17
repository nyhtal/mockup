import { test } from "node:test";
import assert from "node:assert/strict";
import { schemaJson, breadcrumbTrail, formatDate, formatNumber, formatCurrency } from "../../../eleventy.config.js";

const site = { name: "Northwind", url: "https://example.com", defaultLocale: "en", locales: ["en", "de"], hasSearch: false };
const graphOf = (json) => JSON.parse(json.replace(/\\u003c/g, "<"))["@graph"];
const types = (g) => g.map((n) => n["@type"]);
const page = (url, lang = "en") => ({ url, lang });

test("home: organization, website and page, no breadcrumb, no search action by default", () => {
  const g = graphOf(schemaJson(site, { page: page("/en/"), title: "Home", description: "d", pageType: "home" }));
  assert.deepEqual(types(g), ["Organization", "WebSite", "WebPage"]);
  assert.equal(g[1].potentialAction, undefined);
});

test("a site with search adds a SearchAction to the website node", () => {
  const g = graphOf(schemaJson({ ...site, hasSearch: true }, { page: page("/en/"), title: "Home", description: "d", pageType: "home" }));
  assert.equal(g[1].potentialAction["@type"], "SearchAction");
  assert.match(g[1].potentialAction.target.urlTemplate, /^https:\/\/example\.com\/en\/search\/\?q=\{search_term_string\}$/);
});

test("about: AboutPage with a BreadcrumbList the page node references", () => {
  const data = { page: page("/en/about/"), title: "About", description: "d", pageType: "about", breadcrumbs: [{ name: "Home", url: "/en/" }, { name: "About", url: "/en/about/" }] };
  const g = graphOf(schemaJson(site, data));
  assert.deepEqual(types(g), ["Organization", "WebSite", "AboutPage", "BreadcrumbList"]);
  const bc = g[3];
  assert.equal(bc["@id"], "https://example.com/en/about/#breadcrumb");
  assert.deepEqual(bc.itemListElement.map((i) => [i.position, i.name, i.item]), [[1, "Home", "https://example.com/en/"], [2, "About", "https://example.com/en/about/"]]);
  assert.deepEqual(g[2].breadcrumb, { "@id": bc["@id"] });
});

test("job: an entity becomes a JobPosting node with absolute urls, referenced as mainEntity", () => {
  const data = { page: page("/en/careers/controls-engineer/"), title: "Controls engineer", description: "d", pageType: "job", breadcrumbs: [{ name: "Home", url: "/en/" }], entity: { title: "Controls engineer", datePosted: "2026-10-06", url: "/en/careers/controls-engineer/", hiringOrganization: { "@id": "https://example.com/#organization" } } };
  const g = graphOf(schemaJson(site, data));
  const job = g.find((n) => n["@type"] === "JobPosting");
  assert.equal(job["@id"], "https://example.com/en/careers/controls-engineer/#entity");
  assert.equal(job.url, "https://example.com/en/careers/controls-engineer/");
  assert.deepEqual(g[2].mainEntity, { "@id": job["@id"] });
});

test("team: several entities become Person nodes", () => {
  const data = { page: page("/en/about/team/"), title: "Team", description: "d", pageType: "team", breadcrumbs: [{ name: "Home", url: "/en/" }], entities: [{ name: "Priya Natarajan", jobTitle: "CTO" }, { name: "Jonas Weber", jobTitle: "CEO" }] };
  const g = graphOf(schemaJson(site, data));
  assert.equal(g.filter((n) => n["@type"] === "Person").length, 2);
  assert.equal(g[2]["@type"], "CollectionPage");
});

test("faq and contact page types map to FAQPage and ContactPage", () => {
  assert.equal(graphOf(schemaJson(site, { page: page("/en/faq/"), title: "FAQ", description: "d", pageType: "faq" }))[2]["@type"], "FAQPage");
  assert.equal(graphOf(schemaJson(site, { page: page("/en/contact/"), title: "Contact", description: "d", pageType: "contact" }))[2]["@type"], "ContactPage");
});

test("breadcrumbTrail builds the path from the url with titles where known and slug names otherwise", () => {
  const lookup = (url) => ({ "/en/about/": "About us" }[url]);
  assert.deepEqual(breadcrumbTrail("/en/about/team/", "en", lookup, "Home"), [
    { name: "Home", url: "/en/" },
    { name: "About us", url: "/en/about/" },
    { name: "Team", url: "/en/about/team/" },
  ]);
  assert.deepEqual(breadcrumbTrail("/en/", "en", lookup, "Home"), []);
});

test("formatting filters follow the locale with Latin digits by default", () => {
  assert.equal(formatDate("2026-10-17", "en"), "17 October 2026");
  assert.equal(formatDate("2026-10-17", "de"), "17. Oktober 2026");
  assert.match(formatDate("2026-10-17", "ar"), /2026/);
  assert.equal(formatNumber(1284, "en"), "1,284");
  assert.equal(formatNumber(1284, "de"), "1.284");
  // ICU separates the amount and symbol with a narrow no-break space; compare on plain spaces.
  assert.equal(formatCurrency(1900, "de", "EUR").replace(/[  ]/g, " "), "1.900,00 €");
});

test("an entity keeps an explicit @id and its schemaNodes join the graph as top-level nodes; the organization carries a logo and, with site contact, a contactPoint", () => {
  const data = { page: page("/en/blog/one/"), title: "One", description: "d", pageType: "post", breadcrumbs: [{ name: "Home", url: "/en/" }], entity: { "@type": "BlogPosting", "@id": "https://example.com/en/blog/one/#post", headline: "One", author: { "@id": "https://example.com/en/about/team/p/#person" }, schemaNodes: [{ "@type": "Person", "@id": "https://example.com/en/about/team/p/#person", name: "P", url: "/en/about/team/p/" }] } };
  const g = graphOf(schemaJson({ ...site, contact: { email: "hello@example.com", phone: "+44 1" } }, data));
  assert.deepEqual(types(g), ["Organization", "WebSite", "WebPage", "BreadcrumbList", "BlogPosting", "Person"]);
  const post = g.find((n) => n["@type"] === "BlogPosting");
  assert.equal(post["@id"], "https://example.com/en/blog/one/#post");
  assert.equal(post.schemaNodes, undefined);
  assert.deepEqual(g[2].mainEntity, { "@id": post["@id"] });
  assert.equal(g.find((n) => n["@type"] === "Person").url, "https://example.com/en/about/team/p/");
  assert.equal(g[0].logo.url, "https://example.com/icon-192.png");
  assert.equal(g[0].contactPoint.email, "hello@example.com");
});
