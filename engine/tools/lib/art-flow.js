/**
 * The assembling twin of planes-flow (R-ASSET-05, D62): the art library's piece redrawn as SVG from geometry measured off
 * engine/art/planes-flow.webp (1672 × 941), in the five greys of the source recoloured through the same dark ramp the
 * raster takes, so at rest it is the picture. Its pipes are separate parts the art-flow utility (app.css) assembles once
 * on load, every movement heading toward the words on the start side: the dark base and the white ribbon slide in from
 * the end edge, the trail pair draws in from that edge to the joint, the mid pipe reaches out from the joint and the
 * channel pair draws out beside it; then lit notches run in along the trail, through the joint, and out along the
 * channels to their open end by the words. The notches are invisible at rest. No text, no style.
 */
import { ramp } from "./art.js";

/** Source greys: ground, dark band, mid band, channel line, white ribbon, and the notches' glint (brighter than any line). */
export const FLOW_GREYS = [4, 56, 118, 214, 233, 255];

/** The six greys through the dark ramp of the site's hues, as hex. */
export function flowTones(hue = 250, accentHue = hue) {
  const lut = ramp("dark", hue, accentHue);
  return FLOW_GREYS.map((g) => "#" + [0, 1, 2].map((c) => lut[g * 3 + c].toString(16).padStart(2, "0")).join(""));
}

const E = 1772; // bands run past the end edge, so they arrive from outside the frame

/** Three notches of light on a pair of rails: each notch is one short bar per rail, moving together. */
const notches = (x, rails, fill) => Array.from({ length: 3 }, () => `<g opacity="0">${rails.map(([y, h]) => `<rect x="${x}" y="${y}" width="40" height="${h}" fill="${fill}"/>`).join("")}</g>`).join("");

/** The SVG. */
export function planesFlowSvg({ tones, className = "" }) {
  const [ground, dark, mid, line, white, glint] = tones;
  const channels = [[330.5, 13], [354, 11]];
  const trail = [[524, 15], [551, 12]];
  const part = (name, body) => `<g data-part="${name}">${body}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1672 941" preserveAspectRatio="xMidYMid slice" aria-hidden="true"${className ? ` class="${className}"` : ""}>`
    + `<rect x="-100" y="-100" width="${E + 200}" height="1141" fill="${ground}"/>`
    // The channel pair beside the mid pipe; it starts under the ribbon's leg, where the notches come out of the joint.
    + part("lines", channels.map(([y, h]) => `<rect x="645" y="${y}" width="425" height="${h}" fill="${line}"/>`).join(""))
    + `<g data-run="out">${notches(1000, channels, glint)}</g>`
    // The trail pair in the ribbon's hole, from the end edge into the joint; its notches enter beyond the edge.
    + part("trail", trail.map(([y, h]) => `<rect x="1100" y="${y}" width="${E - 1100}" height="${h}" fill="${line}"/>`).join(""))
    + `<g data-run="in">${notches(1700, trail, glint)}</g>`
    // The white ribbon: a band from the end edge turning down through a quarter-turn into a leg that runs under the joint and the base.
    + part("ribbon", `<path d="M992 570V367A180 180 0 0 1 1172 187H${E}V293H1203A83 83 0 0 0 1120 376V570Z" fill="${white}"/>`
      + `<path d="M${E} 293H1203A83 83 0 0 0 1120 376V570H1131V376A72 72 0 0 1 1203 304H${E}Z" fill="${mid}"/>`
      + `<path d="M${E} 304H1203A72 72 0 0 0 1131 376V570H1143V376A60 60 0 0 1 1203 316H${E}Z" fill="${white}"/>`)
    // The line of light around the base's corner; its top runs under the mid pipe, so it is drawn below it and arrives with the base.
    + part("corner", `<path d="M971 470V600A136 136 0 0 0 1028.2 710.9L1035.2 701.1A124 124 0 0 1 983 600V470Z" fill="${line}"/>`)
    // The mid pipe's straight run, reaching out from the joint toward the start.
    + part("reach", `<rect x="645" y="365" width="345" height="139" fill="${mid}"/>`)
    // The joint: the mid pipe's turn down to the base, its lower edge the base's S.
    + part("joint", `<path d="M988 365A167 167 0 0 1 1155 532V565H1095C1045 565 1035 505 992 505H988Z" fill="${mid}"/>`)
    // The base: the dark band, its top rising in an S to meet the joint, its bottom-start corner rounded.
    + part("base", `<path d="M992 503C1035 503 1045 563 1095 563H${E}V715H1107A115 115 0 0 1 992 600Z" fill="${dark}"/>`)
    + `</svg>`;
}
