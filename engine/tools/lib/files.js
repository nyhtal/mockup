/**
 * Placeholder files the site links to with `download` (to-do 5): PDFs, a CSV, calendar entries and contact cards,
 * generated at build time from the site data so every link resolves. All content is fictional, like the site.
 */

/** A one-page PDF 1.4 with a title and lines of text in Helvetica (Latin text only: the base-14 fonts have no Arabic). */
export function pdf(title, lines = []) {
  const esc = (s) => String(s).replace(/[\\()]/g, (c) => `\\${c}`).replace(/[^\x20-\x7e]/g, "?");
  const text = [`BT /F1 20 Tf 72 760 Td (${esc(title)}) Tj ET`, ...lines.map((l, i) => `BT /F1 11 Tf 72 ${720 - i * 18} Td (${esc(l)}) Tj ET`)].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(text, "latin1")} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Title (${esc(title)}) /Producer (Northwind mockup engine) >>`,
  ];
  let out = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((o, i) => { offsets.push(Buffer.byteLength(out, "latin1")); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((n) => `${String(n).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

/** A CSV the downtime calculator stands in for: one header row and a few worked rows. */
export function csv(rows) {
  return Buffer.from(rows.map((r) => r.map((c) => (/[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : String(c))).join(",")).join("\r\n") + "\r\n", "utf8");
}

const icsText = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** Lines longer than 75 octets fold onto continuation lines (RFC 5545 §3.1). */
const fold = (line) => { const out = []; let rest = Buffer.from(line, "utf8"); while (rest.length > 75) { let cut = 75; while ((rest[cut] & 0xc0) === 0x80) cut--; out.push(rest.subarray(0, cut).toString("utf8")); rest = Buffer.concat([Buffer.from(" "), rest.subarray(cut)]); } out.push(rest.toString("utf8")); return out.join("\r\n"); };

/** An iCalendar file for one event (RFC 5545), times converted to UTC from the event's offset. */
export function ics(e, { url, host, stamp }) {
  const utc = (date, time) => new Date(`${date}T${time}:00${e.tz || "+00:00"}`).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Northwind Dynamics//Mockup engine//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:${e.slug}@${host}`, `DTSTAMP:${stamp}`, `DTSTART:${utc(e.date, e.time)}`, `DTEND:${utc(e.date, e.end || e.time)}`,
    `SUMMARY:${icsText(e.title)}`, `DESCRIPTION:${icsText(e.description)}`, `LOCATION:${icsText(e.location)}`, `URL:${url}`,
    "END:VEVENT", "END:VCALENDAR",
  ];
  return Buffer.from(lines.map(fold).join("\r\n") + "\r\n", "utf8");
}

const vText = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;");
/** A vCard 4.0 for one office (RFC 6350). */
export function vcard(o, { org, url }) {
  const lines = [
    "BEGIN:VCARD", "VERSION:4.0", `FN:${vText(`${org} ${o.city}`)}`, `ORG:${vText(org)}`, "KIND:org",
    `ADR;TYPE=work:;;${vText(o.street)};${vText(o.city)};;${vText(o.postalCode)};${vText(o.country)}`,
    `TEL;TYPE=work,voice;VALUE=uri:tel:${o.phone.replace(/\s/g, "")}`, `EMAIL;TYPE=work:${o.email}`,
    o.geo ? `GEO:geo:${o.geo.lat},${o.geo.lng}` : null, `URL:${url}`, "END:VCARD",
  ].filter(Boolean);
  return Buffer.from(lines.map(fold).join("\r\n") + "\r\n", "utf8");
}
