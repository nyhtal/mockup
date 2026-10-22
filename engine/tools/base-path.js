import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Rewrites root-relative URLs in a built site so it can be served from a sub-path
 * (e.g. GitHub Pages project sites at /<repo>/). Protocol-relative and absolute URLs are left alone.
 */
const ROOT = /^\/(?!\/)/;
const prefixUrl = (base, url) => (ROOT.test(url) ? base + url : url);

export function rewriteHtml(html, base) {
  return html
    .replace(/(\s(?:href|src|action|poster|data)=")([^"]*)"/g, (_, a, v) => `${a}${prefixUrl(base, v)}"`)
    .replace(/(\ssrcset=")([^"]*)"/g, (_, a, v) => `${a}${v.split(",").map((c) => c.replace(/^(\s*)(\S+)/, (m, s, u) => s + prefixUrl(base, u))).join(",")}"`)
    .replace(/(content="\d+;\s*url=)(\/(?!\/))/gi, `$1${base}$2`)
    .replace(/url\((['"]?)\/(?!\/)/g, `url($1${base}/`);
}

export function rewriteCss(css, base) {
  return css.replace(/url\((['"]?)\/(?!\/)/g, `url($1${base}/`);
}

function walk(dir) {
  return readdirSync(dir).flatMap((e) => {
    const p = path.join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

export function applyBasePath(dist, base) {
  base = "/" + base.replace(/^\/+|\/+$/g, "");
  if (base === "/") return;
  for (const file of walk(dist)) {
    const rewrite = file.endsWith(".html") ? rewriteHtml : file.endsWith(".css") ? rewriteCss : null;
    if (rewrite) writeFileSync(file, rewrite(readFileSync(file, "utf8"), base));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [dist, base] = process.argv.slice(2);
  if (!dist || !base) {
    console.error("Usage: node engine/tools/base-path.js <dist-dir> <base-path>");
    process.exit(1);
  }
  applyBasePath(dist, base);
}
