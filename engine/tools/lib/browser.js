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

/** URLs of the pages a gate should visit: ctx.only or every HTML page under distDir. */
export function pageUrls(ctx) {
  const files = ctx.only || listHtml(ctx.distDir).map((f) => path.relative(ctx.distDir, f));
  return files.map((f) => ctx.baseUrl + "/" + f.replace(/\\/g, "/").replace(/index\.html$/, ""));
}
