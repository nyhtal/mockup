/**
 * Site entities (sites/<name>/data/<locale>/entities.json) → the catalog's card items and the schema.org
 * nodes bylaw 13 asks for. Index paths mirror bylaw 09's inventory, so a detail page's URL is a function
 * of its kind and slug in every locale.
 */
export const ENTITY_INDEX = {
  services: "services", products: "products", industries: "industries", people: "about/team", offices: "about/locations",
  jobs: "careers", events: "events", downloads: "resources/downloads", posts: "blog", press: "news", cases: "customers",
  docs: "help", tags: "blog/tag", authors: "blog/author",
};

export function entityUrl(kind, slug, locale) {
  const index = ENTITY_INDEX[kind];
  if (!index) throw new Error(`Unknown entity kind "${kind}"`);
  return `/${locale}/${index}/${slug}/`;
}

const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ""));
const withMax = (image, max) => (image ? { ...image, max: image.max || max } : undefined);

/** Card fields per kind (see components/card.njk `data`). Unknown kinds pass through as they are. */
const CARDS = {
  services: (e) => ({ icon: e.icon, title: e.title, text: e.lede }),
  industries: (e) => ({ icon: e.icon, title: e.title, text: e.lede }),
  products: (e) => ({ image: withMax(e.image, 768), title: e.title, text: e.lede }),
  people: (e) => ({ name: e.name, role: e.role }),
  offices: (e) => ({ title: e.city, address: e.address, phone: e.phone }),
  jobs: (e) => ({ title: e.title, team: e.team, location: e.location, type: e.employment }),
  events: (e, c) => ({ title: e.title, date: c.fmt.date(e.date), dateIso: e.date, type: e.format, location: e.location }),
  downloads: (e) => ({ title: e.title, type: e.fileType, pages: e.pages, text: e.summary }),
  posts: (e, c) => ({ image: withMax(e.image, 768), eyebrow: e.eyebrow, title: e.title, text: e.excerpt, date: c.fmt.date(e.date), dateIso: e.date }),
  press: (e, c) => ({ eyebrow: e.eyebrow, title: e.title, text: e.excerpt, date: c.fmt.date(e.date), dateIso: e.date }),
  cases: (e) => ({ company: e.company, title: e.title, metricValue: e.metricValue, metricLabel: e.metricLabel, quote: e.quote }),
  docs: (e) => ({ title: e.title, text: e.summary }),
  tags: (e) => ({ label: e.label }),
};

export function cardOf(kind, e, ctx) {
  const map = CARDS[kind];
  if (!map) return e;
  return clean({ href: entityUrl(kind, e.slug, ctx.locale), ...map(e, ctx) });
}

/** Newest first for dated kinds that are archives; soonest first for events; data order otherwise. */
export function sortEntities(kind, list) {
  if (["posts", "press"].includes(kind)) return [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (kind === "events") return [...list].sort((a, b) => (a.date > b.date ? 1 : -1));
  return list;
}

const orgRef = (site) => ({ "@id": `${site.url}/#organization` });
const imageUrl = (image) => (image ? `/assets/images/${image.slug}-${image.ratio.replace(":", "x")}-1200.webp` : undefined);
const absId = (site, kind, slug, locale, hash) => `${site.url}${entityUrl(kind, slug, locale)}#${hash}`;

function personNode(p, ctx) {
  return clean({ "@type": "Person", "@id": absId(ctx.site, "people", p.slug, ctx.locale, "person"), name: p.name, jobTitle: p.role, worksFor: orgRef(ctx.site), url: entityUrl("people", p.slug, ctx.locale) });
}

function placeNode(o, ctx) {
  return clean({
    "@type": "Place", "@id": absId(ctx.site, "offices", o.slug, ctx.locale, "place"), name: o.city, telephone: o.phone, url: entityUrl("offices", o.slug, ctx.locale),
    address: { "@type": "PostalAddress", streetAddress: o.street, addressLocality: o.city, postalCode: o.postalCode, addressCountry: o.country },
    geo: o.geo ? { "@type": "GeoCoordinates", latitude: o.geo[0], longitude: o.geo[1] } : undefined,
  });
}

const NODES = {
  services: (e, c) => ({ "@type": "Service", name: e.title, description: e.description || e.lede, provider: orgRef(c.site), serviceType: e.serviceType, areaServed: e.areaServed, url: entityUrl("services", e.slug, c.locale) }),
  industries: (e, c) => ({ "@type": "Service", name: e.title, description: e.description || e.lede, provider: orgRef(c.site), serviceType: e.serviceType, url: entityUrl("industries", e.slug, c.locale) }),
  products: (e, c) => ({ "@type": "Product", name: e.title, description: e.description || e.lede, image: imageUrl(e.image), brand: { "@type": "Brand", name: c.site.name }, url: entityUrl("products", e.slug, c.locale) }),
  people: (e, c) => personNode(e, c),
  offices: (e, c) => placeNode(e, c),
  jobs: (e, c) => ({
    "@type": "JobPosting", title: e.title, description: e.description, datePosted: e.posted, validThrough: e.validThrough, employmentType: e.employmentType,
    hiringOrganization: orgRef(c.site), url: entityUrl("jobs", e.slug, c.locale),
    jobLocationType: e.remote ? "TELECOMMUTE" : undefined,
    jobLocation: e.remote ? undefined : { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: e.location } },
  }),
  events: (e, c) => {
    const tz = e.tz || "Z";
    const at = (t) => (t ? `${e.date}T${t}:00${tz}` : e.date);
    return {
      "@type": "Event", name: e.title, description: e.description || e.lede, startDate: at(e.time), endDate: at(e.end), eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: e.online ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
      location: e.online ? { "@type": "VirtualLocation", url: entityUrl("events", e.slug, c.locale) } : { "@type": "Place", name: e.location, address: { "@type": "PostalAddress", addressLocality: e.location } },
      organizer: orgRef(c.site), url: entityUrl("events", e.slug, c.locale),
    };
  },
  downloads: (e, c) => ({ "@type": "Article", headline: e.title, description: e.description || e.summary, author: orgRef(c.site), publisher: orgRef(c.site), url: entityUrl("downloads", e.slug, c.locale) }),
  posts: (e, c) => {
    const author = (c.entities?.people || []).find((p) => p.slug === e.author);
    const node = {
      "@type": "BlogPosting", headline: e.title, description: e.description || e.excerpt, datePublished: e.date, dateModified: e.modified || e.date, image: imageUrl(e.image),
      publisher: orgRef(c.site), url: entityUrl("posts", e.slug, c.locale), inLanguage: c.locale,
    };
    if (author) { const p = personNode(author, c); node.author = { "@id": p["@id"] }; node.schemaNodes = [p]; }
    else node.author = orgRef(c.site);
    return node;
  },
  press: (e, c) => ({ "@type": "NewsArticle", headline: e.title, description: e.description || e.excerpt, datePublished: e.date, dateModified: e.modified || e.date, author: orgRef(c.site), publisher: orgRef(c.site), url: entityUrl("press", e.slug, c.locale), inLanguage: c.locale }),
  cases: (e, c) => ({ "@type": "Article", headline: e.title, description: e.description || e.excerpt, author: orgRef(c.site), publisher: orgRef(c.site), url: entityUrl("cases", e.slug, c.locale), about: e.company ? { "@type": "Organization", name: e.company } : undefined }),
  docs: (e, c) => ({ "@type": "Article", headline: e.title, description: e.description || e.summary, author: orgRef(c.site), publisher: orgRef(c.site), url: entityUrl("docs", e.slug, c.locale) }),
  authors: (e, c) => personNode(e, c),
};

/** The schema.org node for one entity (undefined for kinds with none, such as tags); `schemaNodes` on it lists extra top-level nodes the page must add. */
export function entityNode(kind, e, ctx) {
  const make = NODES[kind];
  return make ? clean(make(e, ctx)) : undefined;
}

/** List or singleton entities for index pages that the contract types (bylaw 09): undefined when the page type has none. */
export function pageEntities(pageType, data, ctx) {
  const ents = ctx.entities || {};
  switch (pageType) {
    case "team": return (ents.people || []).map((p) => personNode(p, ctx));
    case "locations": return (ents.offices || []).map((o) => placeNode(o, ctx));
    case "blog": return [clean({ "@type": "Blog", name: data.title, description: data.description, url: data.url, publisher: orgRef(ctx.site), inLanguage: ctx.locale })];
    case "contact": case "demo": {
      const c = ctx.site.contact || {};
      return [clean({ "@type": "ContactPoint", contactType: "customer support", email: c.email, telephone: c.phone, availableLanguage: ctx.site.locales })];
    }
    case "pricing": {
      const offers = (data.tiers || []).filter((t) => t.price != null).map((t, i) => clean({ "@type": "Offer", "@id": `${ctx.site.url}${data.url}#offer-${i + 1}`, name: t.name, price: String(t.price), priceCurrency: t.currency, availability: "https://schema.org/InStock" }));
      return [clean({ "@type": "Product", name: data.title, description: data.description, brand: { "@type": "Brand", name: ctx.site.name }, offers: offers.map((o) => ({ "@id": o["@id"] })), schemaNodes: offers })];
    }
    default: return undefined;
  }
}
