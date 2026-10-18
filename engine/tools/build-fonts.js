import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import path from "node:path";
import subsetFont from "subset-font";
import { FONTS, resolveFont } from "./lib/theme.js";

/** Locale prefix → extra subset and, when the brand font lacks the script, the package that provides it. */
const SCRIPT_SUBSETS = [
  [/^(ar|fa|ur)\b/, "arabic", "noto-sans-arabic"],
  [/^(ru|uk|bg|sr)\b/, "cyrillic", null],
  [/^el\b/, "greek", null],
  [/^vi\b/, "vietnamese", null],
];

/**
 * Script faces are subset at build time to the script's core blocks (no presentation forms, no historic
 * blocks) and to the weights the catalog uses (400–700): the stock Arabic face is 166 KB, which no page
 * could carry within the 300 KB budget (R-PERF-01). Latin faces ship as fontsource delivers them.
 */
const SUBSET_RANGES = {
  arabic: "U+0600-06FF, U+0750-077F, U+0870-08FF, U+200C-200F, U+2010-2011, U+2E41",
};
const WEIGHTS = { min: 400, max: 700 };

function rangeText(ranges) {
  let text = "";
  for (const r of ranges.split(",")) {
    const [a, b] = r.trim().replace(/^U\+/, "").split("-").map((h) => parseInt(h, 16));
    for (let c = a; c <= (b ?? a); c++) text += String.fromCodePoint(c);
  }
  return text;
}

const fontsourceDir = (pkg) => path.join("node_modules", "@fontsource-variable", pkg);

/** @font-face entries from a fontsource package for the wanted subsets (upright, weight axis only). */
function facesFrom(pkg, subsets) {
  const css = readFileSync(path.join(fontsourceDir(pkg), "index.css"), "utf8");
  const faces = [];
  for (const block of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const body = block[1];
    const file = /url\(\.\/files\/([^)]+?)\)/.exec(body)?.[1];
    if (!file || !file.endsWith("-wght-normal.woff2") || !file.startsWith(`${pkg}-`)) continue;
    const subset = file.slice(pkg.length + 1, -"-wght-normal.woff2".length);
    if (!subsets.includes(subset)) continue;
    const unicodeRange = SUBSET_RANGES[subset] || /unicode-range:\s*([^;]+);/.exec(body)?.[1].trim();
    faces.push({ family: FONTS[pkg].family, pkg, file, subset, unicodeRange, subsetted: subset in SUBSET_RANGES });
  }
  return faces;
}

/**
 * Which font files a site ships and the @font-face CSS for them (R-TYPO-01, R-TYPO-02, R-I18N-11).
 * Latin + Latin-ext always; other scripts by locale. Returns { faces, preload, css }.
 */
export function fontPlan(brand, locales) {
  const main = resolveFont(brand.font);
  if (!main) return { faces: [], preload: null, preloadFor: () => null, css: "" };
  const faces = facesFrom(main.pkg, ["latin", "latin-ext"]);
  for (const [re, subset, pkg] of SCRIPT_SUBSETS) {
    if (!locales.some((l) => re.test(l))) continue;
    faces.push(...facesFrom(pkg || main.pkg, [subset]));
  }
  const families = [...new Set(faces.map((f) => f.pkg))];
  const faceCss = faces.map((f) =>
    `@font-face {\n  font-family: "${f.family}";\n  font-style: normal;\n  font-weight: 100 900;\n  font-display: swap;\n  src: url(/assets/fonts/${f.file}) format("woff2-variations");\n  unicode-range: ${f.unicodeRange};\n}`
  );
  const fallbackCss = families.map((pkg) => {
    const { family, fallback, metrics: m } = FONTS[pkg];
    return `@font-face {\n  font-family: "${family.replace(" Variable", "")} Fallback";\n  src: local("${fallback}");\n  size-adjust: ${m.sizeAdjust};\n  ascent-override: ${m.ascent};\n  descent-override: ${m.descent};\n  line-gap-override: ${m.lineGap};\n}`;
  });
  const latin = faces.find((f) => f.pkg === main.pkg && f.subset === "latin");
  const fileOf = (f) => (f ? `/assets/fonts/${f.file}` : null);
  // The one file a page preloads: its own script's face (R-I18N-11), Latin elsewhere.
  const preloadFor = (locale) => {
    const script = SCRIPT_SUBSETS.find(([re]) => re.test(locale || ""));
    const face = script && faces.find((f) => f.subset === script[1]);
    return fileOf(face || latin);
  };
  return { faces, preload: fileOf(latin), preloadFor, css: [...faceCss, ...fallbackCss].join("\n") + "\n" };
}

export async function copyFonts(plan, distDir) {
  const out = path.join(distDir, "assets", "fonts");
  mkdirSync(out, { recursive: true });
  for (const f of plan.faces) {
    const src = path.join(fontsourceDir(f.pkg), "files", f.file);
    if (!f.subsetted) { copyFileSync(src, path.join(out, f.file)); continue; }
    const buf = await subsetFont(readFileSync(src), rangeText(f.unicodeRange), { targetFormat: "woff2", variationAxes: { wght: WEIGHTS } });
    writeFileSync(path.join(out, f.file), buf);
  }
}
