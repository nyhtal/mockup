import { spawnSync } from "node:child_process";
import path from "node:path";
import { vnuPath } from "../setup-vnu.js";
import { pagesFor } from "../lib/html.js";

export const id = "html";

/** Nu HTML Checker: zero errors and zero warnings on every page. */
export async function run(ctx) {
  const vnu = vnuPath();
  if (!vnu) {
    return { id, ok: false, findings: [{ file: "-", message: "Nu checker not installed; run npm run setup", check: "html/installed" }] };
  }
  const files = pagesFor(ctx).map((f) => path.resolve(f));
  const r = spawnSync(vnu, ["--format", "json", "--stdout", "--exit-zero-always", ...files], {
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.error) throw r.error;
  const { messages } = JSON.parse(r.stdout || '{"messages":[]}');
  const findings = messages
    .filter((m) => m.type === "error" || m.type === "non-document-error" || (m.type === "info" && m.subType === "warning"))
    .map((m) => ({
      file: decodeURIComponent((m.url || "").replace(/^file:\/+/, "")),
      line: m.lastLine,
      message: m.message,
      check: `html/${m.type}`,
    }));
  return { id, ok: findings.length === 0, findings };
}
