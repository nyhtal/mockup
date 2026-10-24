// engine/tools/lib/art-flow.js
/**
 * The flowing twin of planes-flow (R-ASSET-05, D62): the art library's piece redrawn as SVG from geometry measured off
 * engine/art/planes-flow.webp (1672 × 941), in the five greys of the source recoloured through the same dark ramp the
 * raster takes, so at rest it is the picture. Three groups move along x under the art-flow utility (app.css): the body
 * (ribbon, mid band, dark band and the line around its corner, which must move as one or a hidden edge shows), the
 * channel pair at the start and the trail pair in the ribbon's hole. No text, no style.
 */
import { ramp } from "./art.js";

/** Source greys: ground, dark band, mid band, channel line, white ribbon. */
export const FLOW_GREYS = [4, 56, 118, 214, 233];

/** The five greys through the dark ramp of the site's hues, as hex. */
export function flowTones(hue = 250, accentHue = hue) {
  const lut = ramp("dark", hue, accentHue);
  return FLOW_GREYS.map((g) => "#" + [0, 1, 2].map((c) => lut[g * 3 + c].toString(16).padStart(2, "0")).join(""));
}

const E = 1772; // bands run past the end edge so a glide never shows their end

/** The SVG; `shift` offsets groups (tests only: the site moves them with CSS). */
export function planesFlowSvg({ tones, className = "", shift = {} }) {
  const [ground, dark, mid, line, white] = tones;
  const at = (k) => (shift[k] ? ` transform="translate(${shift[k]} 0)"` : "");
  const lines = [
    `<rect x="645" y="330.5" width="425" height="13" fill="${line}"/>`,
    `<rect x="645" y="354" width="425" height="11" fill="${line}"/>`,
  ];
  const trail = [
    `<rect x="1100" y="524" width="${E - 1100}" height="15" fill="${line}"/>`,
    `<rect x="1100" y="551" width="${E - 1100}" height="12" fill="${line}"/>`,
  ];
  const body = [
    // The white ribbon: a band from the end edge turning down through a quarter-turn into a leg that runs under the mid band.
    `<path d="M992 640V367A180 180 0 0 1 1172 187H${E}V293H1203A83 83 0 0 0 1120 376V640Z" fill="${white}"/>`,
    `<path d="M${E} 293H1203A83 83 0 0 0 1120 376V640H1131V376A72 72 0 0 1 1203 304H${E}Z" fill="${mid}"/>`,
    `<path d="M${E} 304H1203A72 72 0 0 0 1131 376V640H1143V376A60 60 0 0 1 1203 316H${E}Z" fill="${white}"/>`,
    // The line of light around the dark band's corner, its top under the mid band.
    `<path d="M971 470V600A136 136 0 0 0 1028.2 710.9L1035.2 701.1A124 124 0 0 1 983 600V470Z" fill="${line}"/>`,
    // The mid band: in from the start, turning down at the junction; its leg runs under the dark band.
    `<path d="M645 365H988A167 167 0 0 1 1155 532V640H1000V504H645Z" fill="${mid}"/>`,
    // The dark band: its top rises in an S to meet the mid band, its bottom-start corner rounded.
    `<path d="M992 503C1035 503 1045 563 1095 563H${E}V715H1107A115 115 0 0 1 992 600Z" fill="${dark}"/>`,
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1672 941" preserveAspectRatio="xMidYMid slice" aria-hidden="true"${className ? ` class="${className}"` : ""}>`
    + `<rect x="-100" y="-100" width="${E + 200}" height="1141" fill="${ground}"/>`
    + `<g data-flow="lines"${at("lines")}>${lines.join("")}</g>`
    + `<g data-flow="trail"${at("trail")}>${trail.join("")}</g>`
    + `<g data-flow="body"${at("body")}>${body.join("")}</g>`
    + `</svg>`;
}
