# Mockup Engine Phase 5 Implementation Plan (checklists, Site Brief template, README, index)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write the documents the spec's phase 5 names, from what phases 3 and 4 actually needed: the five checklists the bylaws cite 199 times but which do not exist, the Site Brief template with the reference site's filled-in brief as the worked example, the engine README, the licences file R-ASSET-12 requires, and an index that points at all of them.

**Architecture:** Checklists are generated, not hand-maintained: `engine/tools/build-checklists.js` writes `engine/checklists/<name>.md` from every rule whose `Gate:` line names that checklist (ID, title, MUST/SHOULD sentence, grouped by bylaw) under a hand-written preamble of procedure steps (`engine/checklists/_preambles/<name>.md`) that records the manual checks phase 4 needed. The bylaws gate gains a `checklist-ref` check: a `Gate: manual: checklists/<file>.md` line fails when the file is missing or does not list the rule, so bylaws and checklists cannot drift. The Site Brief template maps every field to the file it lands in.

**Tech Stack:** Node scripts in `engine/tools/`, Markdown, the existing bylaws gate and test runner.

**Spec:** `docs/superpowers/specs/2026-10-17-mockup-engine-design.md` §9 phase 5, §3 repository layout.

## Global Constraints

- No markup or copy rules change; this phase adds documents and one gate check. The reference site is rebuilt only to prove the bylaws gate.
- Checklist items cite rule IDs verbatim; the generator is the single source, hand edits go in the preambles.
- Every document is written in the engine's plain voice: short sentences, sentence case, no forbidden words (R-CONT-07).
- Commit at the end of every task on `mockup-engine`.

## Review Focus

1. A rule whose `Gate:` names a checklist that does not list it must fail the bylaws gate (Task 1 test).
2. A brief field with no destination file, or a destination the engine does not read, misleads the next site: every template field names its file and key (Task 3 self-check against `site.js`, `eleventy.config.js`).
3. The pre-delivery checklist must carry the manual checks that caught real defects in phase 4 (320 px and 1024 px reflow in every locale, RTL header and arrows, axe "needs review" contrast items, native-speaker proofread) (Task 2 preamble).
4. README commands must be the ones `package.json` defines (Task 4 self-check).
5. `engine/LICENSES.md` must list every shipped third-party asset with its licence (Task 3).

---

### Task 1: Checklist generator and the `checklist-ref` gate check

**Files:** `engine/tools/build-checklists.js`, `engine/tools/gates/bylaws.js`, `engine/tools/test/build-checklists.test.js`, `engine/tools/test/gate-bylaws.test.js`, `package.json` (script `checklists`).

**Interfaces:** `checklistRules(bylawsDir) → { [checklistName]: [{ id, title, level, text, file }] }`; `buildChecklists({ bylawsDir, preamblesDir, outDir })` writes one Markdown file per checklist name; the bylaws gate check `bylaws/checklist-ref` reads `engine/checklists/<file>.md` and requires the rule ID in it.

- [ ] Tests: generator groups rules by checklist name and bylaw file; a preamble is placed above the rule table; gate fails for a rule whose checklist file lacks its ID and passes when present.
- [ ] Implement; run `npm run checklists`; commit `feat(checklists): generated checklists with a gate check that keeps them in sync`.

### Task 2: Preambles for the five checklists

**Files:** `engine/checklists/_preambles/{new-site,new-page,new-component,new-locale,pre-delivery}.md`, generated outputs.

- [ ] new-site: brief → `site.json`, strings overlay, data files, DECISIONS statement, LICENSES, first build and gate. new-page: inventory row, recipe or front matter, description length, thank-you page, rebuild and gate. new-component: anatomy block, states, `with context` import note, style-guide sample, budget. new-locale: engine and site strings, data files per locale, plural forms, script font, RTL checks at 320/1024/1280 px, native-speaker proofread. pre-delivery: the gate command, the axe review list, reflow at 320 and 1024 px in every locale, keyboard walk, dark scheme, Rich Results test, report recorded.
- [ ] Commit `docs(checklists): procedures from the phase-4 build`.

### Task 3: Site Brief template, the reference brief and the licences file

**Files:** `engine/site-brief/TEMPLATE.md`, `sites/reference/brief.md`, `engine/LICENSES.md`.

- [ ] Template fields: company, tagline, voice, locales (default, RTL), conversion, brand (hue, accentHue, radius, density, motion, font), contact, pages (core by default, optional by name), entities per kind with counts, forms and thank-you copy, legal pages, allowed external links; each field names its destination file and key. The reference brief fills every field with Northwind's values.
- [ ] LICENSES.md: Lucide (ISC), Inter, Figtree, IBM Plex Sans, Source Sans 3, Noto Sans, Noto Sans Arabic (OFL 1.1) with links; per-site assets are listed in the site's DECISIONS.
- [ ] Commit `docs: Site Brief template, reference brief, licences`.

### Task 4: README and index

**Files:** `engine/README.md`, `README.md` (root pointer), `engine/INDEX.md`.

- [ ] README: what the engine is, prerequisites, `npm run setup|build|gate|serve|test|checklists`, repository layout, how a brief becomes a site (data files, recipes, strings), the gates and their report, the bylaws and how to change them. Index: checklists and template entries, phase-5 docs in the reading orders.
- [ ] `npm test`; `npm run gate -- --site reference --only bylaws`; commit `docs: engine README and index`.

### Task 5: Close

- [ ] Ledger, self-review against §3 layout, delete the plan workspace, final message with rulings and deferred items.
