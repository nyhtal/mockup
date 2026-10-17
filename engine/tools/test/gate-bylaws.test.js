import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run, parseRules } from "../gates/bylaws.js";

const GOOD = `# 01 HTML

Purpose paragraph.

### R-HTML-01 One h1 per page
MUST. Every page has exactly one h1.
Why: Screen readers and search engines key off it.
Gate: consistency/single-h1

### R-HTML-02 Sections start with a heading
SHOULD. A section element begins with a heading.
Why: Nu warns otherwise.
Gate: html/info

### R-HTML-03 Keyboard walkthrough
MUST. Every control is reachable.
Why: WCAG 2.1.1.
Gate: manual: checklists/pre-delivery.md
`;

const BAD = `# 02 Tokens

### R-TOK-01 Missing must
Spacing uses the scale.
Why: consistency.
Gate: consistency/class-exists

### R-TOK-02 Unknown gate
MUST. Something.
Why: because.
Gate: nonsense/check

### R-TOK-04 Gap in numbering
MUST. Something.
Why: because.
Gate: budget/css

### R-HTML-01 Duplicate id from another file
MUST. Something.
Why: because.
Gate: budget/css
`;

let dir;
before(() => {
  dir = mkdtempSync(path.join(tmpdir(), "bylaws-"));
  writeFileSync(path.join(dir, "01-html.md"), GOOD);
  writeFileSync(path.join(dir, "02-tokens.md"), BAD);
});
after(() => rmSync(dir, { recursive: true, force: true }));

const gateIds = ["html", "consistency", "schema", "budget", "i18n", "lighthouse", "a11y", "links", "bylaws"];

test("parseRules extracts id, level, why and gate", () => {
  const rules = parseRules(GOOD);
  assert.equal(rules.length, 3);
  assert.deepEqual(rules[0], { id: "R-HTML-01", title: "One h1 per page", level: "MUST", why: "Screen readers and search engines key off it.", gate: "consistency/single-h1", line: 5 });
});

test("a well-formed bylaw file has no findings", async () => {
  const r = await run({ bylawsDir: dir, only: ["01-html.md"], gateIds });
  assert.equal(r.id, "bylaws");
  assert.deepEqual(r.findings, []);
});

test("format, unknown gate, numbering gap and duplicate id are each reported", async () => {
  const r = await run({ bylawsDir: dir, gateIds });
  const byCheck = Object.groupBy(r.findings, (f) => f.check);
  assert.equal(byCheck["bylaws/format"].length, 1, "R-TOK-01 lacks MUST/SHOULD");
  assert.equal(byCheck["bylaws/gate-ref"].length, 1, "R-TOK-02 names nonsense gate");
  assert.equal(byCheck["bylaws/numbering"].length, 1, "R-TOK-04 after R-TOK-02");
  assert.equal(byCheck["bylaws/unique-id"].length, 1, "R-HTML-01 appears twice");
  assert.ok(r.findings.every((f) => f.line > 0));
});
