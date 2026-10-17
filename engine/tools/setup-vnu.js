import { existsSync, mkdirSync, createWriteStream, rmSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.join("engine", "tools", "vnu");
const ZIP = { win32: "vnu.windows.zip", darwin: "vnu.osx.zip", linux: "vnu.linux.zip" }[process.platform];
const URL = `https://github.com/validator/validator/releases/download/latest/${ZIP}`;

/** Path to the standalone Nu checker launcher, or null when not installed. */
export function vnuPath() {
  const bin = process.platform === "win32" ? "vnu.bat" : "vnu";
  const p = path.join(DIR, "vnu-runtime-image", "bin", bin);
  return existsSync(p) ? p : null;
}

/** The bundled Java runtime plus the module flag the launcher uses; lets callers skip the shell. */
export function vnuCommand() {
  if (!vnuPath()) return null;
  const java = path.join(DIR, "vnu-runtime-image", "bin", process.platform === "win32" ? "java.exe" : "java");
  return { command: java, args: ["-m", "vnu/nu.validator.client.SimpleCommandLineValidator"] };
}

export async function setup() {
  if (vnuPath()) return vnuPath();
  mkdirSync(DIR, { recursive: true });
  const zipPath = path.join(DIR, ZIP);
  if (!existsSync(zipPath)) {
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${URL}`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(zipPath));
  }
  // Git Bash puts GNU tar first on PATH; Windows' bsdtar (System32) is the one that reads zip files.
  const tar = process.platform === "win32" ? path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe") : "tar";
  execFileSync(tar, ["-xf", zipPath, "-C", DIR]);
  rmSync(zipPath);
  const p = vnuPath();
  if (!p) throw new Error(`Extracted ${ZIP} but no launcher found under ${DIR}`);
  return p;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  setup().then((p) => console.log("vnu at", p)).catch((e) => { console.error(e.message); process.exit(1); });
}
