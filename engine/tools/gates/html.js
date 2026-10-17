import { spawnSync } from "node:child_process";
import path from "node:path";
import { vnuCommand } from "../setup-vnu.js";
import { pagesFor } from "../lib/html.js";

export const id = "html";
export const checks = ["error", "info", "non-document-error", "tool"];

/** Nu HTML Checker: zero errors and zero warnings on every page. */
export async function run(ctx) {
  const vnu = ctx.vnu || vnuCommand();
  if (!vnu) {
    return { id, ok: false, findings: [{ file: "-", message: "Nu checker not installed; run npm run setup", check: "html/tool" }] };
  }
  // Whole output folder in one call (no command-line length limit); explicit files only when ctx.only is set.
  const targets = ctx.only ? pagesFor(ctx).map((f) => path.resolve(f)) : ["--skip-non-html", path.resolve(ctx.distDir)];
  const r = spawnSync(vnu.command, [...vnu.args, "--format", "json", "--stdout", "--exit-zero-always", ...targets], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const tool = (message) => ({ id, ok: false, findings: [{ file: "-", message, check: "html/tool" }] });
  if (r.error) return tool(`Nu checker could not start: ${r.error.message}`);
  if (r.status !== 0) return tool(`Nu checker exited with exit ${r.status}: ${(r.stderr || "").trim().slice(0, 500)}`);
  let messages;
  try { ({ messages } = JSON.parse(r.stdout)); } catch { return tool(`Nu checker output was not JSON: ${(r.stdout || "").slice(0, 200)}`); }
  if (!Array.isArray(messages)) return tool("Nu checker output had no messages array");
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
