import { existsSync, mkdirSync, createWriteStream, createReadStream, rmSync, readFileSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.join("engine", "tools", "vnu");
const ZIP = { win32: "vnu.windows.zip", darwin: "vnu.osx.zip", linux: "vnu.linux.zip" }[process.platform];
// The Nu project publishes one rolling "latest" asset; the pin below is what makes a run reproducible.
const URL = `https://github.com/validator/validator/releases/download/latest/${ZIP}`;

/** Expected checker version and zip SHA-256 from package.json `config.vnu`. */
export function pinned() {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const pin = pkg.config?.vnu?.[process.platform] || pkg.config?.vnu;
  if (!pin?.version || !pin?.sha256) throw new Error("package.json config.vnu must give version and sha256");
  return { version: pin.version, sha256: pin.sha256 };
}

export function sha256File(file) {
  return new Promise((resolve, reject) => {
    const h = createHash("sha256");
    createReadStream(file).on("data", (d) => h.update(d)).on("end", () => resolve(h.digest("hex"))).on("error", reject);
  });
}

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

/** Version string of the installed checker ("26.10.12"), or null. */
export function installedVersion() {
  const cmd = vnuCommand();
  if (!cmd) return null;
  const out = execFileSync(cmd.command, [...cmd.args, "--version"], { encoding: "utf8" });
  return /(\d+\.\d+\.\d+)/.exec(out)?.[1] || null;
}

export async function setup() {
  const pin = pinned();
  if (vnuPath()) {
    const v = installedVersion();
    if (v !== pin.version) throw new Error(`Installed Nu checker is ${v}, package.json pins ${pin.version}; delete ${DIR} to reinstall`);
    return vnuPath();
  }
  mkdirSync(DIR, { recursive: true });
  const zipPath = path.join(DIR, ZIP);
  if (!existsSync(zipPath)) {
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${URL}`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(zipPath));
  }
  const sum = await sha256File(zipPath);
  if (sum !== pin.sha256) {
    rmSync(zipPath);
    throw new Error(`Refusing to extract ${ZIP}: SHA-256 ${sum} does not match the pin ${pin.sha256}. The upstream "latest" asset changed; verify the new release, then update package.json config.vnu.`);
  }
  // Git Bash puts GNU tar first on PATH; Windows' bsdtar (System32) is the one that reads zip files.
  const tar = process.platform === "win32" ? path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe") : "tar";
  execFileSync(tar, ["-xf", zipPath, "-C", DIR]);
  rmSync(zipPath);
  const v = installedVersion();
  if (v !== pin.version) throw new Error(`Extracted checker reports ${v}, package.json pins ${pin.version}`);
  return vnuPath();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  setup().then((p) => console.log("vnu at", p)).catch((e) => { console.error(e.message); process.exit(1); });
}
