/**
 * Imports one reviewed source image into the art library (R-ASSET-05): greyscale, inverted when its mean is light so
 * every piece sits on a dark ground (the dark tone then reads as a deep brand field, the light tone as near-white),
 * normalised, WebP q90.
 * Usage: node engine/tools/import-art.js <source.png> <id>. Add or update the piece's entry in engine/art/manifest.json by hand.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

/** Returns { file, inverted }. */
export async function importArt(src, id, dir = "engine/art") {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`art id "${id}" must be kebab-case`);
  const grey = await sharp(src).greyscale().png().toBuffer();
  const { channels } = await sharp(grey).stats();
  const inverted = channels[0].mean > 127.5;
  const file = path.join(dir, `${id}.webp`);
  await (inverted ? sharp(grey).negate({ alpha: false }) : sharp(grey)).normalise().webp({ quality: 90 }).toFile(file);
  return { file, inverted };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [src, id] = process.argv.slice(2);
  if (!src || !id) { console.error("usage: node engine/tools/import-art.js <source.png> <id>"); process.exit(1); }
  const r = await importArt(src, id);
  console.log(r.file + (r.inverted ? " (inverted to a dark ground)" : ""));
}
