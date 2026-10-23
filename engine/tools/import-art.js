/**
 * Imports one reviewed source image into the art library (R-ASSET-05): greyscale, normalised, WebP q90.
 * Usage: node engine/tools/import-art.js <source.png> <id>. Add or update the piece's entry in engine/art/manifest.json by hand.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export async function importArt(src, id, dir = "engine/art") {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`art id "${id}" must be kebab-case`);
  const out = path.join(dir, `${id}.webp`);
  await sharp(src).greyscale().normalise().webp({ quality: 90 }).toFile(out);
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [src, id] = process.argv.slice(2);
  if (!src || !id) { console.error("usage: node engine/tools/import-art.js <source.png> <id>"); process.exit(1); }
  console.log(await importArt(src, id));
}
