import { existsSync } from "node:fs";
import path from "node:path";
import { listHtml } from "./html.js";

/** Local Chrome executable: CHROME_PATH or the default Windows/macOS/Linux install. */
export function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = {
    win32: ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"],
    darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"],
    linux: ["/usr/bin/google-chrome", "/usr/bin/chromium"],
  }[process.platform] || [];
  return candidates.find((p) => existsSync(p)) || null;
}

/** Pages a gate should visit as { file, url }: ctx.only or every HTML page under distDir. */
export function pages(ctx) {
  const files = ctx.only ? ctx.only.map((f) => path.join(ctx.distDir, f)) : listHtml(ctx.distDir);
  return files.map((file) => {
    const rel = path.relative(ctx.distDir, file).replace(/\\/g, "/");
    return { file, url: ctx.baseUrl + "/" + rel.replace(/index\.html$/, "") };
  });
}

export function pageUrls(ctx) {
  return pages(ctx).map((p) => p.url);
}
