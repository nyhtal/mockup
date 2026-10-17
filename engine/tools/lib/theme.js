/**
 * Brand inputs from a Site Brief → the generated part of the Tailwind theme (bylaw 02).
 * Everything a site can change about colour, radius, motion and font is produced here.
 */
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const L = [97, 93, 86, 76, 66, 56, 48, 40, 33, 26, 20];
const C = [0.02, 0.04, 0.07, 0.11, 0.14, 0.17, 0.17, 0.14, 0.11, 0.08, 0.05];
const RADIUS = {
  sharp: ["0", "0", "0", "0", "9999px"],
  soft: ["0.25rem", "0.5rem", "0.75rem", "1rem", "9999px"],
  round: ["0.5rem", "1rem", "1.5rem", "2rem", "9999px"],
};
const MOTION = { calm: [8, 200, 0], standard: [16, 300, 60], expressive: [24, 500, 90] };

/** Approved fonts (R-TYPO-01) with the fontsource package and metric overrides for the local fallback (R-TYPO-02). */
export const FONTS = {
  inter: { family: "Inter Variable", pkg: "inter", fallback: "Arial", metrics: { sizeAdjust: "107.12%", ascent: "90.49%", descent: "22.56%", lineGap: "0%" } },
  figtree: { family: "Figtree Variable", pkg: "figtree", fallback: "Arial", metrics: { sizeAdjust: "100.5%", ascent: "94%", descent: "25%", lineGap: "0%" } },
  "ibm-plex-sans": { family: "IBM Plex Sans Variable", pkg: "ibm-plex-sans", fallback: "Arial", metrics: { sizeAdjust: "100.3%", ascent: "102.6%", descent: "27.6%", lineGap: "0%" } },
  "source-sans-3": { family: "Source Sans 3 Variable", pkg: "source-sans-3", fallback: "Arial", metrics: { sizeAdjust: "94.4%", ascent: "107.5%", descent: "30%", lineGap: "0%" } },
  "noto-sans": { family: "Noto Sans Variable", pkg: "noto-sans", fallback: "Arial", metrics: { sizeAdjust: "104.5%", ascent: "102.6%", descent: "28.1%", lineGap: "0%" } },
  "noto-sans-arabic": { family: "Noto Sans Arabic Variable", pkg: "noto-sans-arabic", fallback: "Arial", metrics: { sizeAdjust: "100%", ascent: "110%", descent: "40%", lineGap: "0%" } },
  system: null,
};

const oklch = (l, c, h) => `oklch(${l}% ${c} ${h})`;
const scale = (name, hue) => STEPS.map((s, i) => `  --color-${name}-${s}: ${oklch(L[i], C[i], hue)};`).join("\n");
const ld = (name, light, dark) => `  --color-${name}: light-dark(${light}, ${dark});`;
const state = (name, hue) => [
  ld(name, oklch(55, 0.15, hue), oklch(70, 0.15, hue)),
  ld(`${name}-soft`, oklch(95, 0.04, hue), oklch(25, 0.06, hue)),
  ld(`${name}-strong`, oklch(38, 0.14, hue), oklch(85, 0.12, hue)),
].join("\n");

export function resolveFont(name) {
  return FONTS[name] === undefined ? FONTS.inter : FONTS[name];
}

export function brandTokens(brand) {
  const h = Number(brand.hue) || 0;
  const a = Number(brand.accentHue ?? brand.hue) || 0;
  const r = RADIUS[brand.radius] || RADIUS.soft;
  const [dist, dur, stag] = MOTION[brand.motion] || MOTION.standard;
  const font = resolveFont(brand.font);
  const fontSans = font ? `"${font.family}", "${font.family.replace(" Variable", "")} Fallback", system-ui, sans-serif` : "system-ui, sans-serif";
  return `@theme {
  --color-*: initial;
${scale("brand", h)}
${scale("accent", a)}
${ld("surface", oklch(99, 0.002, h), oklch(18, 0.01, h))}
${ld("surface-alt", oklch(96.5, 0.005, h), oklch(22, 0.012, h))}
${ld("surface-raised", oklch(100, 0, h), oklch(26, 0.014, h))}
${ld("ink", oklch(20, 0.02, h), oklch(95, 0.01, h))}
${ld("ink-muted", oklch(46, 0.02, h), oklch(72, 0.015, h))}
${ld("ink-inverse", oklch(99, 0.002, h), oklch(16, 0.01, h))}
${ld("line", oklch(90, 0.01, h), oklch(32, 0.015, h))}
${ld("line-strong", oklch(78, 0.015, h), oklch(42, 0.02, h))}
${ld("focus", oklch(48, 0.17, h), oklch(76, 0.11, h))}
${state("success", 150)}
${state("warning", 80)}
${state("danger", 25)}
  --radius-sm: ${r[0]};
  --radius-md: ${r[1]};
  --radius-lg: ${r[2]};
  --radius-xl: ${r[3]};
  --radius-full: ${r[4]};
  --reveal-distance: ${dist}px;
  --reveal-duration: ${dur}ms;
  --reveal-stagger: ${stag}ms;
  --ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);
  --font-sans: ${fontSans};
}
`;
}

/** OKLCH → sRGB hex (gamut-clamped). l in 0..1, c ≥ 0, h in degrees. */
export function oklchToHex(l, c, h) {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ ** 3, m3 = m_ ** 3, s3 = s_ ** 3;
  const linear = [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
  const srgb = linear.map((v) => {
    v = Math.min(1, Math.max(0, v));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  });
  return "#" + srgb.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
}

/** theme-color values: brand-600 for light, brand-400 for dark. */
export function themeColors(brand) {
  const h = Number(brand.hue) || 0;
  return { light: oklchToHex(L[6] / 100, C[6], h), dark: oklchToHex(L[4] / 100, C[4], h) };
}
