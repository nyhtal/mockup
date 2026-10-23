import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ACRONYMS = { cta: "CTA", faq: "FAQ", html: "HTML" };
const words = (s) => s.split("-").map((w) => ACRONYMS[w] || w);

/** A sample section's display name: its type in words, then its variant ("Hero (centered)", "Job list empty"). */
export function sectionLabel(sample) {
  const base = words(sample.variant ? sample.type : sample.id).join(" ");
  const label = sample.variant ? `${base} (${sample.variant})` : base;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** The `purpose:` line of a section's catalog file, without its rule references ("(R-SEC-03)", "(to-do 7)"). */
export function sectionPurpose(type, dir = path.join("engine", "catalog", "sections")) {
  const file = path.join(dir, `${type}.njk`);
  if (!existsSync(file)) return "";
  const line = /^\s*purpose:\s*(.+)$/m.exec(readFileSync(file, "utf8"))?.[1] || "";
  return line.replace(/\s*\((?:R-|to-do|D\d)[^)]*\)/g, "").replace(/\s+([.;,])/g, "$1").trim();
}

/**
 * The style guide's section pages (engine/catalog/style-guide-sections.json): each group with its sections' names and
 * purposes. Every sample section belongs to exactly one group and every listed id is a sample, so a section added to
 * the catalog fails the build until it has a page, and the pages and their descriptions never fall behind.
 */
export function sectionGroups(samples, groups, opts = {}) {
  const byId = new Map(samples.sections.map((s) => [s.id, s]));
  const seen = new Map();
  const problems = [];
  for (const g of groups) {
    for (const id of g.sections) {
      if (!byId.has(id)) problems.push(`"${id}" in group "${g.slug}" is not a sample section`);
      else if (seen.has(id)) problems.push(`"${id}" is in groups "${seen.get(id)}" and "${g.slug}"`);
      else seen.set(id, g.slug);
    }
  }
  for (const id of byId.keys()) if (!seen.has(id)) problems.push(`sample section "${id}" is in no style-guide group`);
  if (problems.length) throw new Error(`engine/catalog/style-guide-sections.json: ${problems.join("; ")}`);
  return groups.map((g) => ({
    ...g,
    items: g.sections.map((id) => {
      const s = byId.get(id);
      return { id, anchor: `section-${id}`, label: sectionLabel(s), purpose: sectionPurpose(s.type, opts.dir) };
    }),
  }));
}
