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
/** Lightness of ink-muted per scheme; must keep 4.5:1 on every surface (see contrastFailures). */
const ROLE_MUTED = { light: 46, dark: 72 };
/** Lightness of ink-brand (brand-coloured text: eyebrows, links, icons on surfaces) per scheme. */
const ROLE_BRAND_TEXT = { light: 40, dark: 78 };
/** Lightness of line-strong (input and secondary-button borders): must reach 3:1 on surfaces (WCAG 1.4.11). */
const ROLE_LINE_STRONG = { light: 60, dark: 62 };

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

// Tokens are emitted as sRGB hex: Chrome keeps oklch() in computed styles and axe-core misreads that form,
// so hex keeps every contrast checker honest. The design is still done in OKLCH (see oklchToHex).
const oklch = (l, c, h) => oklchToHex(l / 100, c, h);
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

export function brandTokens(brand, { scriptFamilies = [] } = {}) {
  const h = Number(brand.hue) || 0;
  const a = Number(brand.accentHue ?? brand.hue) || 0;
  const r = RADIUS[brand.radius] || RADIUS.soft;
  const [dist, dur, stag] = MOTION[brand.motion] || MOTION.standard;
  const font = resolveFont(brand.font);
  // Brand font, then each script font (its unicode-range keeps it to its script), then the matching metric fallbacks (R-TYPO-12).
  const fb = (family) => `"${family.replace(" Variable", "")} Fallback"`;
  const fontSans = font ? [`"${font.family}"`, ...scriptFamilies.map((f) => `"${f}"`), fb(font.family), ...scriptFamilies.map(fb), "system-ui, sans-serif"].join(", ") : "system-ui, sans-serif";
  return `@theme {
  --color-*: initial;
${scale("brand", h)}
${scale("accent", a)}
${ld("surface", oklch(99, 0.002, h), oklch(18, 0.01, h))}
${ld("surface-alt", oklch(96.5, 0.005, h), oklch(22, 0.012, h))}
${ld("surface-raised", oklch(100, 0, h), oklch(26, 0.014, h))}
${ld("ink", oklch(20, 0.02, h), oklch(95, 0.01, h))}
${ld("ink-muted", oklch(ROLE_MUTED.light, 0.02, h), oklch(ROLE_MUTED.dark, 0.015, h))}
  --color-ink-inverse: ${oklch(99, 0.002, h)};
${ld("line", oklch(90, 0.01, h), oklch(32, 0.015, h))}
${ld("line-strong", oklch(ROLE_LINE_STRONG.light, 0.015, h), oklch(ROLE_LINE_STRONG.dark, 0.02, h))}
${ld("focus", oklch(48, 0.17, h), oklch(76, 0.11, h))}
${ld("ink-brand", oklch(ROLE_BRAND_TEXT.light, 0.14, h), oklch(ROLE_BRAND_TEXT.dark, 0.11, h))}
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
  --font-system: system-ui, sans-serif;
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

/** WCAG 2 relative luminance of a hex colour. */
export function luminance(hex) {
  const c = hex.replace("#", "").match(/.{2}/g).map((h) => parseInt(h, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** WCAG 2 contrast ratio between two hex colours. */
export function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** The role colour values as hex per scheme, so contrast can be checked at the token level (R-COL-03). */
export function roleHex(brand) {
  const h = Number(brand.hue) || 0;
  const a = Number(brand.accentHue ?? brand.hue) || 0;
  const px = (l, c, hue) => oklchToHex(l / 100, c, hue);
  const fixed = { "ink-inverse": px(99, 0.002, h), "brand-50": px(L[0], C[0], h), "brand-100": px(L[1], C[1], h), "brand-600": px(L[6], C[6], h), "brand-700": px(L[7], C[7], h), "brand-800": px(L[8], C[8], h), "accent-600": px(L[6], C[6], a) };
  return {
    light: { ...fixed, surface: px(99, 0.002, h), "surface-alt": px(96.5, 0.005, h), "surface-raised": px(100, 0, h), ink: px(20, 0.02, h), "ink-muted": px(ROLE_MUTED.light, 0.02, h), "ink-brand": px(ROLE_BRAND_TEXT.light, 0.14, h), "line-strong": px(ROLE_LINE_STRONG.light, 0.015, h) },
    dark: { ...fixed, surface: px(18, 0.01, h), "surface-alt": px(22, 0.012, h), "surface-raised": px(26, 0.014, h), ink: px(95, 0.01, h), "ink-muted": px(ROLE_MUTED.dark, 0.015, h), "ink-brand": px(ROLE_BRAND_TEXT.dark, 0.11, h), "line-strong": px(ROLE_LINE_STRONG.dark, 0.02, h) },
  };
}

/** [fg, bg, minimum ratio]: text pairs need 4.5:1, UI boundaries 3:1 (R-COL-03), checked in BOTH schemes. */
const CONTRAST_PAIRS = [
  ["ink", "surface", 4.5], ["ink", "surface-alt", 4.5], ["ink", "surface-raised", 4.5],
  ["ink-muted", "surface", 4.5], ["ink-muted", "surface-alt", 4.5], ["ink-muted", "surface-raised", 4.5],
  ["ink-brand", "surface", 4.5], ["ink-brand", "surface-alt", 4.5], ["ink-brand", "surface-raised", 4.5],
  ["ink-inverse", "brand-600", 4.5], ["ink-inverse", "brand-700", 4.5], ["ink-inverse", "accent-600", 4.5],
  ["brand-800", "brand-100", 4.5], ["brand-800", "brand-50", 4.5],
  ["line-strong", "surface", 3], ["line-strong", "surface-alt", 3], ["line-strong", "surface-raised", 3],
];

/** Pairs below their minimum in either scheme. */
export function contrastFailures(brand) {
  const out = [];
  for (const scheme of contrastFailures.schemes) {
    const r = roleHex(brand)[scheme];
    for (const [fg, bg, min] of CONTRAST_PAIRS) {
      const c = contrast(r[fg], r[bg]);
      if (c < min) out.push({ scheme, fg, bg, ratio: Math.round(c * 100) / 100, min });
    }
  }
  return out;
}
contrastFailures.pairs = CONTRAST_PAIRS.map(([fg, bg]) => [fg, bg]);
contrastFailures.schemes = ["light", "dark"];

/** theme-color values: brand-600 for light, brand-400 for dark. */
export function themeColors(brand) {
  const h = Number(brand.hue) || 0;
  return { light: oklchToHex(L[6] / 100, C[6], h), dark: oklchToHex(L[4] / 100, C[4], h) };
}
