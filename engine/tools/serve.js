import { createServer } from "node:http";
import { createReadStream, existsSync, statSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "./build.js";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".vtt": "text/vtt; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

/**
 * Static server for a built site: `/` → its redirect, directory URLs → index.html, misses → 404.html with status 404.
 */
export function startServer(distDir, port = 0, { noCache = false } = {}) {
  const root = path.resolve(distDir);
  // A host answers `/` with the 301 of `_redirects` (R-DEPLOY-05), not the root HTML page that stands in for hosts
  // without redirects, so Lighthouse measures the redirect visitors get (a meta refresh costs a full page load more).
  const rulesFile = path.join(root, "redirects.json");
  const rootRule = existsSync(rulesFile) ? JSON.parse(readFileSync(rulesFile, "utf8")).find((r) => r.from === "/") : null;
  const server = createServer((req, res) => {
    let urlPath;
    try { urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { urlPath = "/"; }
    if (rootRule && urlPath === "/") {
      res.writeHead(rootRule.status || 301, { Location: rootRule.to });
      return res.end();
    }
    let file = path.resolve(root, "." + urlPath);
    if (!file.startsWith(root + path.sep) && file !== root) return send(res, 404, root);
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!existsSync(file) || !statSync(file).isFile()) return send(res, 404, root);
    const type = TYPES[path.extname(file)] || "application/octet-stream";
    const headers = { "Content-Type": type };
    if (noCache) headers["Cache-Control"] = "no-store";
    else if (urlPath.startsWith("/assets/")) headers["Cache-Control"] = "public, max-age=31536000";
    // Text assets go out gzip-compressed, as a real host would (R-PERF-11), so Lighthouse sees deployment-like transfer sizes.
    const compressible = /^(text\/|application\/(json|xml|javascript|manifest))/.test(type) || type === "image/svg+xml";
    if (compressible && /\bgzip\b/.test(req.headers["accept-encoding"] || "")) {
      const body = gzipSync(readFileSync(file), { level: 6 });
      res.writeHead(200, { ...headers, "Content-Encoding": "gzip", "Content-Length": body.length, Vary: "Accept-Encoding" });
      return res.end(body);
    }
    res.writeHead(200, { ...headers, "Content-Length": statSync(file).size });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      const url = `http://127.0.0.1:${server.address().port}`;
      resolve({ url, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

function send(res, status, root) {
  const page = path.join(root, "404.html");
  if (existsSync(page)) {
    res.writeHead(status, { "Content-Type": TYPES[".html"], "Content-Length": statSync(page).size });
    createReadStream(page).pipe(res);
  } else {
    res.writeHead(status, { "Content-Type": TYPES[".txt"] });
    res.end("Not found");
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { site } = parseArgs(process.argv.slice(2));
  const noCache = process.argv.includes("--dev");
  startServer(`dist/${site}`, 8080, { noCache }).then(({ url }) => console.log(`Serving dist/${site} at ${url}${noCache ? " (--dev: no caching)" : ""}`));
}
