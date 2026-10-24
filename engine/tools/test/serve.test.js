import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { startServer } from "../serve.js";

let dir, server;
before(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "serve-"));
  mkdirSync(path.join(dir, "en"), { recursive: true });
  mkdirSync(path.join(dir, "assets"), { recursive: true });
  writeFileSync(path.join(dir, "en", "index.html"), "<!DOCTYPE html><title>en</title>");
  writeFileSync(path.join(dir, "404.html"), "<!DOCTYPE html><title>missing</title>");
  writeFileSync(path.join(dir, "assets", "app.css"), "a{}");
  writeFileSync(path.join(dir, "index.html"), '<!DOCTYPE html><meta http-equiv="refresh" content="0; url=/en/">');
  writeFileSync(path.join(dir, "redirects.json"), JSON.stringify([{ from: "/", to: "/en/", status: 301 }]));
  server = await startServer(dir);
});
after(async () => { await server.close(); rmSync(dir, { recursive: true, force: true }); });

test("serves index.html for a directory URL with the html content type", async () => {
  const res = await fetch(`${server.url}/en/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /^text\/html/);
  assert.match(await res.text(), /<title>en<\/title>/);
});

test("serves assets with their type and a long cache lifetime", async () => {
  const res = await fetch(`${server.url}/assets/app.css`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /^text\/css/);
  // No `immutable`: asset names are not content-hashed, so a redeploy must be able to replace them.
  assert.equal(res.headers.get("cache-control"), "public, max-age=31536000");
});

test("text assets are gzip-compressed when the client accepts it, and plain otherwise", async () => {
  const gz = await fetch(`${server.url}/assets/app.css`, { headers: { "accept-encoding": "gzip" } });
  assert.equal(gz.headers.get("content-encoding"), "gzip");
  assert.equal(await gz.text(), "a{}", "fetch transparently decodes the body");
  const plain = await fetch(`${server.url}/assets/app.css`, { headers: { "accept-encoding": "identity" } });
  assert.equal(plain.headers.get("content-encoding"), null);
  assert.equal(plain.headers.get("content-length"), "3");
});

test("returns the 404 page with status 404 for a missing path", async () => {
  const res = await fetch(`${server.url}/nope/`);
  assert.equal(res.status, 404);
  assert.match(await res.text(), /missing/);
});

test("refuses paths that escape the root", async () => {
  const res = await fetch(`${server.url}/../package.json`);
  assert.equal(res.status, 404);
});

test("answers the root with the site's 301, as a host would, not its meta-refresh stand-in", async () => {
  const res = await fetch(`${server.url}/`, { redirect: "manual" });
  assert.equal(res.status, 301);
  assert.equal(res.headers.get("location"), "/en/");
  assert.equal((await fetch(`${server.url}/en/`, { redirect: "manual" })).status, 200);
});
