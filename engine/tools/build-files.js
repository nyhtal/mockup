import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pdf, csv, ics, vcard } from "./lib/files.js";
import { entityUrl } from "./lib/entities.js";

/**
 * The files the site links to with `download` (to-do 5): a PDF per PDF download (one English file: the base-14 PDF
 * fonts cannot set Arabic), a CSV per CSV download, and per locale an .ics per event and a .vcf per office.
 * Deterministic: the calendar stamp is the site's year, not the build time.
 */
export function generateFiles(dist, site, data) {
  const out = path.join(dist, "assets", "files");
  const write = (rel, buf) => { const f = path.join(out, rel); mkdirSync(path.dirname(f), { recursive: true }); writeFileSync(f, buf); };
  const en = data[site.defaultLocale]?.entities || {};
  for (const d of en.downloads || []) {
    if (d.fileType === "PDF") write(`${d.slug}.pdf`, pdf(d.title, [`${site.name}: ${d.pages || ""}`.trim(), "Sample page of a fictional document.", "Every name, figure and quote in it is invented.", site.url]));
    if (d.fileType === "CSV") write(`${d.slug}.csv`, csv([["Line", "Stops per month", "Minutes per stop", "Cost per minute (GBP)", "Monthly cost (GBP)"], ["Filler 1", 14, 22, 85, 26180], ["Capper 2", 9, 15, 85, 11475], ["Palletiser", 4, 40, 60, 9600]]));
  }
  const stamp = `${site.year || "2026"}0101T000000Z`;
  const host = new URL(site.url).host;
  for (const locale of site.locales) {
    const e = data[locale]?.entities || {};
    for (const ev of e.events || []) write(`${locale}/${ev.slug}.ics`, ics(ev, { url: site.url + entityUrl("events", ev.slug, locale), host, stamp }));
    for (const o of e.offices || []) write(`${locale}/${o.slug}.vcf`, vcard(o, { org: site.name, url: site.url + entityUrl("offices", o.slug, locale) }));
  }
}
