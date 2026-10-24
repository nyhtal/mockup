import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { GATES, GATE_CHECKS, SLOW_GATE_IDS, gatesToRun, parseArgs, runGates, formatReport } from "../gate.js";

test("every gate exports a non-empty list of check names", () => {
  for (const gate of GATES) {
    assert.ok(Array.isArray(gate.checks) && gate.checks.length > 0, `${gate.id} exports checks`);
    assert.deepEqual(GATE_CHECKS[gate.id], gate.checks);
  }
});

test("parseArgs reads site, skip, only, runs and the development sample and fast flags", () => {
  assert.deepEqual(parseArgs(["--site", "x", "--skip", "a,b", "--runs", "2"]), { site: "x", skip: ["a", "b"], only: [], runs: 2, sample: false, fast: false });
  assert.equal(parseArgs(["--skip", "lighthouse", "--sample"]).sample, true, "--sample checks one page per page type and locale in the a11y gate (R-GATE-09)");
  assert.equal(parseArgs(["--fast"]).fast, true);
});

test("--fast leaves out the browser-driven gates; the plain gate runs all nine; --only wins over --fast (R-GATE-01)", () => {
  assert.deepEqual(SLOW_GATE_IDS, ["a11y", "lighthouse"]);
  assert.deepEqual(gatesToRun(), ["bylaws", "html", "consistency", "schema", "budget", "i18n", "links", "a11y", "lighthouse"]);
  assert.deepEqual(gatesToRun({ fast: true }), ["bylaws", "html", "consistency", "schema", "budget", "i18n", "links"]);
  assert.deepEqual(gatesToRun({ fast: true, skip: ["links"] }), ["bylaws", "html", "consistency", "schema", "budget", "i18n"]);
  assert.deepEqual(gatesToRun({ skip: ["lighthouse"] }), ["bylaws", "html", "consistency", "schema", "budget", "i18n", "links", "a11y"]);
  assert.deepEqual(gatesToRun({ fast: true, only: ["a11y"] }), ["a11y"]);
});

test("an output folder with no pages is a failure, not a green run", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "gate-"));
  const prev = process.cwd();
  try {
    mkdirSync(path.join(root, "dist", "empty"), { recursive: true });
    mkdirSync(path.join(root, "sites", "empty"), { recursive: true });
    writeFileSync(path.join(root, "sites", "empty", "site.json"), JSON.stringify({ name: "x", url: "https://example.com", defaultLocale: "en", locales: ["en"] }));
    process.chdir(root);
    await assert.rejects(() => runGates({ site: "empty", only: ["budget"] }), /no pages/i);
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
  }
});

test("the report records the benchmark conditions and per-page sizes", () => {
  const out = {
    site: "x",
    results: [
      { id: "budget", ok: true, findings: [], ms: 5, report: [{ file: "dist/x/en/index.html", html: 1234, total: 5678 }] },
      {
        id: "lighthouse", ok: true, findings: [], ms: 9,
        report: [{ url: "http://127.0.0.1:1/en/", profile: "mobile", runs: 5, throttling: "simulate (150ms RTT, 1.6Mbps, 4x CPU)", chrome: "142.0.0.0", scores: { performance: 100, accessibility: 100, "best-practices": 100, seo: 100 } }],
      },
    ],
  };
  const text = formatReport(out);
  assert.match(text, /Chrome 142\.0\.0\.0/);
  assert.match(text, /simulate \(150ms RTT/);
  assert.match(text, /runs: 5|5 runs/);
  assert.match(text, /\| \/en\/ \| 1234 B \| 5678 B \| - B \|/);
});

test("the report lists Lighthouse coverage per locale and page type", () => {
  const out = {
    site: "x",
    results: [{
      id: "lighthouse", ok: true, findings: [], ms: 9,
      report: [{ url: "http://127.0.0.1:1/en/", profile: "mobile", runs: 5, throttling: "simulate (150ms RTT, 1.6Mbps, 4x CPU)", chrome: "142.0.0.0", scores: { performance: 100, accessibility: 100, "best-practices": 100, seo: 100 } }],
      coverage: [{ locale: "en", pageType: "home", url: "http://127.0.0.1:1/en/", status: "measured" }, { locale: "de", pageType: "post", url: "http://127.0.0.1:1/de/blog/one/", status: "failed: NO_FCP" }],
    }],
  };
  const text = formatReport(out);
  assert.match(text, /## Lighthouse coverage/);
  assert.match(text, /\| en \| home \| \/en\/ \| measured \|/);
  assert.match(text, /\| de \| post \| \/de\/blog\/one\/ \| failed: NO_FCP \|/);
});
