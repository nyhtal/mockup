import { test } from "node:test";
import assert from "node:assert/strict";
import { pdf, csv, ics, vcard } from "../lib/files.js";

test("pdf: a well-formed one-page PDF whose xref offsets point at its objects", () => {
  const buf = pdf("Commissioning checklist 2026", ["Sample page", "All figures are fictional."]);
  const s = buf.toString("latin1");
  assert.ok(s.startsWith("%PDF-1.4\n") && s.endsWith("%%EOF\n"));
  const xref = Number(/startxref\n(\d+)\n/.exec(s)[1]);
  assert.equal(s.slice(xref, xref + 4), "xref");
  const offsets = [...s.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
  assert.equal(offsets.length, 6);
  offsets.forEach((o, i) => assert.equal(s.slice(o, o + `${i + 1} 0 obj`.length), `${i + 1} 0 obj`, `object ${i + 1} at its offset`));
  assert.match(s, /\(Commissioning checklist 2026\) Tj/);
});

test("csv quotes cells that need it; ics converts the event's offset to UTC and folds long lines; vcard carries address, phone, email and geo", () => {
  assert.equal(csv([["a", "b,c"], [1, 'say "hi"']]).toString(), 'a,"b,c"\r\n1,"say ""hi"""\r\n');
  const cal = ics({ slug: "fair", title: "Northwind at the automation fair", description: "x".repeat(120), location: "Nuremberg", date: "2027-01-21", time: "09:00", end: "18:00", tz: "+01:00" }, { url: "https://example.com/en/events/fair/", host: "example.com", stamp: "20261019T000000Z" }).toString();
  assert.match(cal, /DTSTART:20270121T080000Z\r\nDTEND:20270121T170000Z/);
  assert.ok(cal.split("\r\n").every((l) => Buffer.byteLength(l) <= 75), "folded at 75 octets");
  assert.match(cal, /^BEGIN:VCALENDAR\r\nVERSION:2\.0/);
  const card = vcard({ city: "Hamburg", street: "Speicherstadt 12", postalCode: "20457", country: "DE", phone: "+49 40 123456", email: "hamburg@example.com", geo: { lat: 53.5438, lng: 9.9861 } }, { org: "Northwind Dynamics", url: "https://example.com/de/about/locations/hamburg/" }).toString();
  assert.match(card, /ADR;TYPE=work:;;Speicherstadt 12;Hamburg;;20457;DE\r\n/);
  assert.match(card, /TEL;TYPE=work,voice;VALUE=uri:tel:\+4940123456/);
  assert.match(card, /GEO:geo:53\.5438,9\.9861/);
});
