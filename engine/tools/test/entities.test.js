import { test } from "node:test";
import assert from "node:assert/strict";
import { entityUrl, cardOf, entityNode, pageEntities } from "../lib/entities.js";

const site = { name: "Northwind", url: "https://example.com", defaultLocale: "en", locales: ["en", "de"] };
const fmt = { date: (iso) => `D(${iso})` };
const ctx = { locale: "de", site, fmt };

test("entity urls follow the inventory's index paths", () => {
  assert.equal(entityUrl("services", "line-automation", "en"), "/en/services/line-automation/");
  assert.equal(entityUrl("people", "mei-chen", "de"), "/de/about/team/mei-chen/");
  assert.equal(entityUrl("downloads", "checklist", "ar"), "/ar/resources/downloads/checklist/");
  assert.equal(entityUrl("tags", "engineering", "en"), "/en/blog/tag/engineering/");
  assert.throws(() => entityUrl("nope", "x", "en"), /Unknown entity kind "nope"/);
});

test("cards map each kind to the card component's fields with a locale href and a formatted date", () => {
  assert.deepEqual(cardOf("services", { slug: "a", title: "A", lede: "L", icon: "cpu" }, ctx), { href: "/de/services/a/", icon: "cpu", title: "A", text: "L" });
  assert.deepEqual(cardOf("people", { slug: "p", name: "P", role: "R" }, ctx), { href: "/de/about/team/p/", name: "P", role: "R" });
  assert.deepEqual(cardOf("offices", { slug: "o", city: "Hamburg", address: "Str. 1", phone: "+49" }, ctx), { href: "/de/about/locations/o/", image: { slug: "office-o-card", ratio: "16:9", alt: "", max: 768, tone: "dark" }, title: "Hamburg", address: "Str. 1", phone: "+49", slug: "o" }, "office cards carry a dark-tone library picture for the tile (0.17.0) and the slug (and geo, when set) for the office map");
  assert.deepEqual(cardOf("jobs", { slug: "j", title: "J", team: "T", location: "L", employment: "Full-time" }, ctx), { href: "/de/careers/j/", title: "J", team: "T", location: "L", type: "Full-time" });
  assert.deepEqual(cardOf("events", { slug: "e", title: "E", date: "2026-11-12", format: "Webinar", location: "Online" }, ctx), { href: "/de/events/e/", title: "E", date: "D(2026-11-12)", dateIso: "2026-11-12", type: "Webinar", location: "Online" });
  assert.deepEqual(cardOf("posts", { slug: "s", title: "S", eyebrow: "Eng", excerpt: "X", date: "2026-10-03", image: { slug: "i", ratio: "16:9", alt: "" } }, ctx), { href: "/de/blog/s/", image: { slug: "i", ratio: "16:9", alt: "", max: 768 }, eyebrow: "Eng", title: "S", text: "X", date: "D(2026-10-03)", dateIso: "2026-10-03" });
  assert.deepEqual(cardOf("cases", { slug: "c", company: "Alder", title: "T", metricValue: "38%", metricLabel: "less", quote: "Q" }, ctx), { href: "/de/customers/c/", company: "Alder", title: "T", metricValue: "38%", metricLabel: "less", quote: "Q" });
  assert.deepEqual(cardOf("downloads", { slug: "d", title: "D", fileType: "PDF", pages: "12 pages", summary: "S" }, ctx), { href: "/de/resources/downloads/d/", title: "D", type: "PDF", pages: "12 pages", text: "S" });
  // Kinds without a card mapping pass through unchanged.
  assert.deepEqual(cardOf("testimonials", { quote: "Q", name: "N" }, ctx), { quote: "Q", name: "N" });
});

test("schema nodes carry the fields bylaw 13 names for each kind", () => {
  const org = { "@id": "https://example.com/#organization" };
  const job = entityNode("jobs", { slug: "j", title: "J", description: "Desc", posted: "2026-10-06", validThrough: "2026-12-31", employment: "Full-time", employmentType: "FULL_TIME", location: "Hamburg", remote: false }, ctx);
  assert.equal(job["@type"], "JobPosting");
  assert.deepEqual([job.title, job.datePosted, job.validThrough, job.employmentType, job.hiringOrganization], ["J", "2026-10-06", "2026-12-31", "FULL_TIME", org]);
  assert.equal(job.jobLocation["@type"], "Place");
  assert.deepEqual(job.jobLocation.address, { "@type": "PostalAddress", addressLocality: "Hamburg" });
  const onsiteJob = entityNode("jobs", { slug: "o", title: "O", posted: "2026-10-06", validThrough: "2026-12-31", employmentType: "FULL_TIME", location: "Manchester or remote", city: "Manchester", country: "GB" }, ctx);
  assert.deepEqual(onsiteJob.jobLocation.address, { "@type": "PostalAddress", addressLocality: "Manchester", addressCountry: "GB" });
  const remote = entityNode("jobs", { slug: "r", title: "R", posted: "2026-10-06", validThrough: "2026-12-31", employmentType: "FULL_TIME", location: "Remote", remote: true, applicantCountries: ["Germany", "Austria"] }, ctx);
  assert.equal(remote.jobLocationType, "TELECOMMUTE");
  assert.deepEqual(remote.applicantLocationRequirements, [{ "@type": "Country", name: "Germany" }, { "@type": "Country", name: "Austria" }]);

  const ev = entityNode("events", { slug: "e", title: "E", description: "Desc", date: "2026-11-12", time: "10:00", end: "11:00", tz: "+01:00", format: "Webinar", location: "Online", online: true }, ctx);
  assert.equal(ev["@type"], "Event");
  assert.equal(ev.startDate, "2026-11-12T10:00:00+01:00");
  assert.equal(ev.endDate, "2026-11-12T11:00:00+01:00");
  assert.equal(ev.eventAttendanceMode, "https://schema.org/OnlineEventAttendanceMode");
  assert.equal(ev.location["@type"], "VirtualLocation");
  assert.equal(ev.eventStatus, "https://schema.org/EventScheduled");
  assert.deepEqual(ev.organizer, org);
  const onsite = entityNode("events", { slug: "w", title: "W", date: "2026-12-03", location: "Manchester", online: false }, ctx);
  assert.equal(onsite.location["@type"], "Place");
  assert.equal(onsite.eventAttendanceMode, "https://schema.org/OfflineEventAttendanceMode");

  const post = entityNode("posts", { slug: "s", title: "S", excerpt: "X", date: "2026-10-03", modified: "2026-10-05", author: "mei-chen", image: { slug: "i", ratio: "16:9", alt: "" } }, { ...ctx, entities: { people: [{ slug: "mei-chen", name: "Mei Chen", role: "Head of Safety" }] } });
  assert.equal(post["@type"], "BlogPosting");
  assert.deepEqual([post.headline, post.datePublished, post.dateModified, post.publisher], ["S", "2026-10-03", "2026-10-05", org]);
  assert.equal(post.image, "/assets/images/i-16x9-1200.webp");
  assert.deepEqual(post.author, { "@id": "https://example.com/de/about/team/mei-chen/#person" });
  assert.equal(post.schemaNodes[0]["@type"], "Person");
  assert.equal(post.schemaNodes[0]["@id"], "https://example.com/de/about/team/mei-chen/#person");
  assert.deepEqual(post.schemaNodes[0].worksFor, org);

  const person = entityNode("people", { slug: "p", name: "P", role: "CTO" }, ctx);
  assert.deepEqual([person["@type"], person.name, person.jobTitle, person.worksFor, person["@id"]], ["Person", "P", "CTO", org, "https://example.com/de/about/team/p/#person"]);

  const svc = entityNode("services", { slug: "a", title: "A", description: "D", serviceType: "Automation" }, ctx);
  assert.deepEqual([svc["@type"], svc.name, svc.provider, svc.serviceType], ["Service", "A", org, "Automation"]);
  const office = entityNode("offices", { slug: "o", city: "Hamburg", street: "Speicherstadt 12", postalCode: "20457", country: "DE", phone: "+49 40 1", map: { slug: "m" } }, ctx);
  assert.equal(office["@type"], "Place");
  assert.deepEqual(office.address, { "@type": "PostalAddress", streetAddress: "Speicherstadt 12", addressLocality: "Hamburg", postalCode: "20457", addressCountry: "DE" });
  assert.equal(office.telephone, "+49 40 1");
  const product = entityNode("products", { slug: "x", title: "X", description: "D", image: { slug: "px", ratio: "4:3", alt: "" } }, ctx);
  assert.deepEqual([product["@type"], product.brand], ["Product", { "@type": "Brand", name: "Northwind" }]);
  assert.equal(entityNode("press", { slug: "n", title: "N", excerpt: "X", date: "2026-10-01" }, ctx)["@type"], "NewsArticle");
  assert.equal(entityNode("cases", { slug: "c", title: "C", excerpt: "X" }, ctx)["@type"], "Article");
});

test("index pages get their list entities: team, locations, blog, contact and pricing", () => {
  const entities = { people: [{ slug: "p", name: "P", role: "R" }], offices: [{ slug: "o", city: "C", street: "S", postalCode: "1", country: "GB" }] };
  const c = { ...ctx, entities };
  assert.deepEqual(pageEntities("team", {}, c).map((n) => n["@type"]), ["Person"]);
  assert.deepEqual(pageEntities("locations", {}, c).map((n) => n["@type"]), ["Place"]);
  const blog = pageEntities("blog", { url: "/de/blog/", title: "Blog" }, c);
  assert.deepEqual([blog[0]["@type"], blog[0].url], ["Blog", "/de/blog/"]);
  const cp = pageEntities("contact", {}, { ...c, site: { ...site, contact: { email: "hello@example.com", phone: "+44 1" } } });
  assert.deepEqual([cp[0]["@type"], cp[0].email, cp[0].telephone, cp[0].contactType], ["ContactPoint", "hello@example.com", "+44 1", "customer support"]);
  const pricing = pageEntities("pricing", { url: "/de/pricing/", title: "Plans", description: "D", tiers: [{ name: "Starter", price: 490, currency: "EUR", period: "per line per month" }, { name: "Enterprise", price: null }] }, c);
  assert.equal(pricing[0]["@type"], "Product");
  assert.equal(pricing[0].offers.length, 1);
  assert.deepEqual(pricing[0].offers[0], { "@id": "https://example.com/de/pricing/#offer-1" });
  assert.deepEqual(pricing[0].schemaNodes[0], { "@type": "Offer", "@id": "https://example.com/de/pricing/#offer-1", name: "Starter", price: "490", priceCurrency: "EUR", availability: "https://schema.org/InStock" });
  assert.equal(pageEntities("about", {}, c), undefined);
});
