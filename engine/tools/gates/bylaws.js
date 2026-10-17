import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

export const id = "bylaws";
export const checks = ["format", "gate-ref", "numbering", "unique-id"];

const HEADING = /^### (R-[A-Z0-9]+-(\d{2})) (.+)$/;

/** Rules in one bylaw file: { id, title, level, why, gate, line }. */
export function parseRules(markdown) {
  const lines = markdown.split(/\r?\n/);
  const rules = [];
  for (let i = 0; i < lines.length; i++) {
    const m = HEADING.exec(lines[i]);
    if (!m) continue;
    const rule = { id: m[1], title: m[3].trim(), level: null, why: null, gate: null, line: i + 1 };
    for (let j = i + 1; j < lines.length && !lines[j].startsWith("### ") && !lines[j].startsWith("## "); j++) {
      const l = lines[j].trim();
      if (rule.level === null && l) rule.level = /^(MUST|SHOULD)\./.test(l) ? RegExp.$1 : "";
      if (l.startsWith("Why:")) rule.why = l.slice(4).trim();
      if (l.startsWith("Gate:")) rule.gate = l.slice(5).trim();
    }
    rules.push(rule);
  }
  return rules;
}

/** Each rule: MUST/SHOULD first line, Why, a Gate naming an exported check (or a checklist), contiguous numbering per area, unique ids. */
export async function run(ctx) {
  const dir = ctx.bylawsDir || path.join("engine", "bylaws");
  const gateChecks = ctx.gateChecks || {};
  const findings = [];
  const seen = new Map();
  if (!existsSync(dir)) return { id, ok: true, findings, report: { rules: 0 } };
  const files = (ctx.only || readdirSync(dir).filter((f) => f.endsWith(".md"))).sort();
  let count = 0;
  for (const name of files) {
    const file = path.join(dir, name);
    const add = (check, line, message) => findings.push({ file, line, message, check: `bylaws/${check}` });
    const next = new Map(); // area → next expected number within this file
    for (const r of parseRules(readFileSync(file, "utf8"))) {
      count++;
      const area = r.id.slice(0, -3);
      const expected = next.get(area) || 1;
      if (!r.level) add("format", r.line, `${r.id}: first line must start with MUST. or SHOULD.`);
      if (!r.why) add("format", r.line, `${r.id}: missing "Why:" line`);
      if (!r.gate) add("format", r.line, `${r.id}: missing "Gate:" line`);
      else if (/^manual: checklists\/[\w-]+\.md$/.test(r.gate)) { /* manual check */ }
      else {
        const [gate, ...rest] = r.gate.split("/");
        const check = rest.join("/");
        const known = gateChecks[gate];
        const ok = known && (known.includes(check) || known.some((c) => c.endsWith("/*") && check.startsWith(c.slice(0, -1))));
        if (!ok) add("gate-ref", r.line, `${r.id}: "${r.gate}" is not a check any gate exports`);
      }
      const n = Number(r.id.slice(-2));
      if (n !== expected) add("numbering", r.line, `${r.id}: expected number ${String(expected).padStart(2, "0")}`);
      next.set(area, n + 1);
      if (seen.has(r.id)) add("unique-id", r.line, `${r.id} already defined in ${seen.get(r.id)}`);
      else seen.set(r.id, file);
    }
  }
  return { id, ok: findings.length === 0, findings, report: { rules: count } };
}
