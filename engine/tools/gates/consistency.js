import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { pagesFor, parse } from "../lib/html.js";
import { displayWidth } from "../lib/text-width.js";

export const id = "consistency";
export const checks = [
  "inline-style", "single-h1", "heading-order", "dup-id", "class-exists", "component-known",
  "logical-props", "motion-safe", "no-arbitrary-lengths", "no-hash-links", "img-attrs", "head-order", "meta-length", "rhythm", "motion-vocabulary",
];

/** The motion vocabulary of R-TOK-13 and R-MOT-05: the keyframes a page may name and the scroll ranges it may use. */
export const ANIMATIONS = new Set([
  "progress", "parallax-sm", "parallax-md", "parallax-lg", "drift", "drift-end", "settle", "drop", "scale-in", "fade", "rise-in",
  "spin", "pulse", "none",
]);
/** Scroll ranges are left only for what tracks the scroll: depth, the header shadow and the floating back to top (entrances are time-based, R-MOT-05). */
export const RANGES = new Set([
  "cover_0%_cover_100%", // depth on a view() timeline
  "0_80vh", // hero depth on scroll(root)
  "0_12rem", // header shadow
  "0_60vh", // floating back to top
]);
const DEPTH = /^(parallax-(sm|md|lg)|drift(-end)?)$/;

/** Motion-vocabulary findings for one parsed page (R-MOT-05, R-MOT-15, R-MOT-16): unknown keyframes, off-preset ranges, depth below md, depth on hero text. */
export function motionFindings(root) {
  const out = [];
  const seen = new Set();
  for (const el of root.querySelectorAll("[class]")) {
    for (const c of el.getAttribute("class").split(/\s+/).filter(Boolean)) {
      const { variants, base } = splitClass(c);
      const anim = /^animate-(.+)$/.exec(base)?.[1];
      const range = /^\[animation-range:(.+)\]$/.exec(base)?.[1];
      const key = `${c}|${anim && DEPTH.test(anim) && el.closest('[data-component="hero"]') ? "hero" : ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (anim && !ANIMATIONS.has(anim)) out.push(`class "${c}" names a keyframe outside R-TOK-13`);
      if (range && !RANGES.has(range)) out.push(`class "${c}" uses a scroll range outside the presets of R-MOT-05`);
      if (anim && DEPTH.test(anim)) {
        if (!variants.includes("md")) out.push(`class "${c}" moves a depth layer below md (R-MOT-15)`);
        const hero = el.closest('[data-component="hero"]');
        if (hero && el.tagName !== "IMG" && el.getAttribute("aria-hidden") !== "true") out.push(`class "${c}" puts depth on hero content other than its picture or backdrop (R-MOT-11, R-MOT-15)`);
      }
    }
  }
  return out;
}

/** The rhythm scale of R-LAY-02 (engine/DESIGN.md §2): the padding sets each kind of section may carry, and the body grid gaps.
 *  The opening group: a page header joined to the plain section after it carries JOINED, and that section OPENING (comfortable or compact). */
const JOINED = [["pt-12", "md:pt-16"]];
const OPENING = [["pt-12", "md:pt-16", "pb-16", "md:pb-24"], ["pt-12", "md:pt-16", "pb-12", "md:pb-16"]];
const FULL_HEADER = [["py-12", "md:py-16"]];
const PADDINGS = {
  section: [["py-16", "md:py-24"], ["py-12", "md:py-16"], ...OPENING],
  hero: [["py-16", "md:py-28"], ["py-12", "md:py-20"]],
  "page-header": [...FULL_HEADER, ...JOINED],
  strip: [["py-6"]],
};
const STRIPS = new Set(["article-meta", "filter-bar", "pagination", "was-this-helpful"]);
const GAPS = [["gap-6", "md:gap-8"], ["gap-8"], ["gap-12"], ["gap-4", "md:gap-8"]];
const PY = /^(sm:|md:|lg:|xl:|2xl:)?p[ytb]-/, GAP = /^(sm:|md:|lg:|xl:|2xl:)?gap-/;
const tokens = (classes, re) => classes.filter((c) => re.test(c)).sort();
const onScale = (classes, re, tuples) => { const t = tokens(classes, re); return tuples.some((p) => p.length === t.length && [...p].sort().every((c, i) => c === t[i])); };
const kindOf = (name) => (name === "hero" ? "hero" : name === "page-header" ? "page-header" : STRIPS.has(name) ? "strip" : "section");
const gapOf = (classes) => tokens(classes, GAP).join(" ");

/** Rhythm findings for one parsed page: sections, heading groups and top-level body grids outside the scale. */
export function rhythmFindings(root) {
  const out = [];
  const classesOf = (el) => (el?.getAttribute("class") || "").split(/\s+/);
  // An article's page header is its <header>; it carries the same padding as the section form.
  for (const section of root.querySelectorAll('section[data-component], header[data-component="page-header"]')) {
    const name = section.getAttribute("data-component");
    const classes = classesOf(section);
    if (!onScale(classes, PY, PADDINGS[kindOf(name)])) out.push(`section "${name}" padding "${tokens(classes, PY).join(" ")}" is not on the rhythm scale for a ${kindOf(name)} (R-LAY-02)`);
    // The opening group comes as a pair: a joined header is followed by an opening section, and an opening section follows a joined header.
    if (name === "page-header" && onScale(classes, PY, JOINED)) {
      const next = section.nextElementSibling;
      if (!next || next.tagName !== "SECTION" || kindOf(next.getAttribute("data-component")) !== "section" || !onScale(classesOf(next), PY, OPENING)) out.push(`page header with the joined padding "pt-12 md:pt-16" must be followed by a section with the opening padding "pt-12 md:pt-16 pb-…" (R-LAY-02)`);
    }
    if (name !== "page-header" && kindOf(name) === "section" && onScale(classes, PY, OPENING)) {
      const prev = section.previousElementSibling;
      if (!prev || prev.getAttribute("data-component") !== "page-header" || onScale(classesOf(prev), PY, FULL_HEADER)) out.push(`section "${name}" has the opening padding but does not follow a joined page header (R-LAY-02)`);
    }
    const container = section.querySelector(":scope > div");
    if (!container) continue;
    const children = container.childNodes.filter((n) => n.nodeType === 1);
    const headingGroup = children.find((d) => (d.tagName === "DIV" || d.tagName === "HGROUP") && d.childNodes.some((c) => c.nodeType === 1 && c.tagName === "H2"));
    let body = container;
    if (headingGroup) {
      const next = children[children.indexOf(headingGroup) + 1];
      if (next) {
        const nc = (next.getAttribute("class") || "").split(/\s+/);
        if (!(nc.includes("mt-12") && nc.includes("md:mt-16"))) out.push(`heading group of "${name}" is followed by "${nc.filter((c) => /^(md:)?mt-/.test(c)).join(" ") || "no top margin"}", expected "mt-12 md:mt-16" (R-LAY-02)`);
        body = next;
      }
    }
    for (const grid of body.childNodes.filter((n) => n.nodeType === 1)) {
      const gc = (grid.getAttribute("class") || "").split(/\s+/);
      if (!gc.includes("grid") && !gc.includes("md:grid")) continue;
      if (!onScale(gc, GAP, GAPS)) out.push(`grid in "${name}" uses "${gapOf(gc) || "no gap"}", expected one of ${GAPS.map((g) => `"${g.join(" ")}"`).join(", ")} (R-LAY-02)`);
    }
  }
  return out;
}

/** Marker classes Tailwind never emits CSS for but which variants depend on. */
const NOOP = /^(group|peer)(\/[\w-]+)?$/;

/** Undo CSS identifier escaping: `\:` → `:`, `\32 ` → `2`, `\[` → `[`. */
export function unescapeCss(ident) {
  return ident.replace(/\\([0-9a-fA-F]{1,6}) ?|\\(.)/g, (m, hex, ch) => (hex ? String.fromCodePoint(parseInt(hex, 16)) : ch));
}

/** Set of class names a built Tailwind file defines, with CSS escaping undone. */
export function classesInCss(css) {
  const set = new Set();
  for (const m of css.matchAll(/\.((?:\\[0-9a-fA-F]{1,6} ?|\\.|[A-Za-z0-9_-])+)/g)) set.add(unescapeCss(m[1]));
  return set;
}

/** Component names = .njk file names under catalog/{primitives,components,sections}. */
export function catalogComponents(engineDir = "engine") {
  const out = new Set();
  for (const kind of ["primitives", "components", "sections"]) {
    const dir = path.join(engineDir, "catalog", kind);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (f.endsWith(".njk") && !f.startsWith("_")) out.add(f.replace(/\.njk$/, ""));
  }
  return out;
}

/** Split a Tailwind class into its variants and base utility, respecting brackets: "motion-safe:sda:[a:b]" → { variants: [...], base: "[a:b]" }. */
export function splitClass(cls) {
  const variants = [];
  let depth = 0, start = 0;
  for (let i = 0; i < cls.length; i++) {
    const ch = cls[i];
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth--;
    else if (ch === ":" && depth === 0) { variants.push(cls.slice(start, i)); start = i + 1; }
  }
  return { variants, base: cls.slice(start).replace(/^-/, "") };
}

const PHYSICAL = /^(pl|pr|ml|mr|left|right|text-left|text-right|rounded-(?:l|r|tl|tr|bl|br)|border-(?:l|r)|scroll-(?:ml|mr|pl|pr)|inset-(?:l|r)|float-(?:left|right)|clear-(?:left|right))(?:-|$)/;
const MOTION = /^(animate-(?!none)|transition)/;
const LENGTH_UTIL = /^(p|px|py|ps|pe|pt|pb|m|mx|my|ms|me|mt|mb|gap|gap-x|gap-y|space-x|space-y|w|h|size|min-w|min-h|max-w|max-h|top|bottom|inset|inset-x|inset-y|start|end|text|leading|tracking|indent|rounded(?:-[a-z]+)?|border(?:-[a-z]+)?)-\[([^\]]*)\]$/;
const LENGTH_VALUE = /^\d*\.?\d+(px|rem|em|%|vw|vh|ch|svh|dvh)$/;

/** Head children in the order R-HTML-02 requires; each entry is a predicate on the element. */
const HEAD_ORDER = [
  (el) => el.tagName === "META" && el.hasAttribute("charset"),
  (el) => el.tagName === "META" && el.getAttribute("name") === "viewport",
  (el) => el.tagName === "TITLE",
  (el) => el.tagName === "META" && el.getAttribute("name") === "description",
  (el) => el.tagName === "LINK" && el.getAttribute("rel") === "canonical",
  (el) => el.tagName === "LINK" && el.getAttribute("rel") === "alternate" && el.hasAttribute("hreflang"),
  (el) => el.tagName === "LINK" && el.getAttribute("rel") === "alternate" && el.hasAttribute("type"),
  (el) => el.tagName === "META" && el.getAttribute("name") === "robots",
  (el) => el.tagName === "META" && el.getAttribute("name") === "theme-color",
  (el) => el.tagName === "LINK" && /^(icon|apple-touch-icon)$/.test(el.getAttribute("rel") || ""),
  (el) => el.tagName === "LINK" && el.getAttribute("rel") === "preload",
  (el) => el.tagName === "LINK" && el.getAttribute("rel") === "stylesheet",
  (el) => el.tagName === "META" && (el.getAttribute("property") || "").startsWith("og:"),
  (el) => el.tagName === "META" && (el.getAttribute("name") || "").startsWith("twitter:"),
  (el) => el.tagName === "SCRIPT" && el.getAttribute("type") === "application/ld+json",
];

export async function run(ctx) {
  const findings = [];
  const css = classesInCss(readFileSync(ctx.cssFile || path.join(ctx.distDir, "assets", "app.css"), "utf8"));
  const known = ctx.components ? new Set(ctx.components) : catalogComponents(ctx.engineDir);

  for (const file of pagesFor(ctx)) {
    const { root } = parse(file);
    const add = (check, message) => findings.push({ file, message, check: `consistency/${check}` });

    for (const el of root.querySelectorAll("[style]")) add("inline-style", `inline style on <${el.tagName.toLowerCase()}>`);

    const h1s = root.querySelectorAll("h1");
    if (h1s.length !== 1) add("single-h1", `${h1s.length} h1 elements`);
    for (const m of rhythmFindings(root)) add("rhythm", m);
    for (const m of motionFindings(root)) add("motion-vocabulary", m);

    let prev = 0;
    for (const h of root.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
      const n = Number(h.tagName[1]);
      if (prev && n > prev + 1) add("heading-order", `h${prev} followed by h${n}`);
      prev = n;
    }

    const ids = new Map();
    for (const el of root.querySelectorAll("[id]")) { const v = el.getAttribute("id"); ids.set(v, (ids.get(v) || 0) + 1); }
    for (const [v, n] of ids) if (n > 1) add("dup-id", `id "${v}" used ${n} times`);

    const seen = new Set();
    for (const el of root.querySelectorAll("[class]")) {
      for (const c of el.getAttribute("class").split(/\s+/).filter(Boolean)) {
        if (!css.has(c) && !NOOP.test(c)) add("class-exists", `class "${c}" not in built CSS`);
        if (seen.has(c)) continue;
        seen.add(c);
        const { variants, base } = splitClass(c);
        if (PHYSICAL.test(base)) add("logical-props", `class "${c}" uses a physical direction; use the logical utility (R-LAY-04)`);
        if ((MOTION.test(base) || variants.includes("starting")) && !variants.includes("motion-safe")) add("motion-safe", `class "${c}" animates without motion-safe: (R-MOT-02)`);
        const m = LENGTH_UTIL.exec(base);
        if (m && LENGTH_VALUE.test(m[2])) add("no-arbitrary-lengths", `class "${c}" uses an arbitrary length; use the spacing scale (R-TOK-01)`);
      }
    }

    for (const el of root.querySelectorAll("[data-component]")) {
      const v = el.getAttribute("data-component");
      if (!known.has(v)) add("component-known", `data-component "${v}" not in catalog`);
    }

    for (const a of root.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href");
      if (href === "#" || /^javascript:/i.test(href)) add("no-hash-links", `link href="${href}" (R-HTML-09)`);
    }

    for (const img of root.querySelectorAll("img")) {
      const src = img.getAttribute("src") || "";
      if (!img.hasAttribute("alt")) add("img-attrs", `img ${src} has no alt attribute (R-HTML-12)`);
      if (!img.hasAttribute("width") || !img.hasAttribute("height")) add("img-attrs", `img ${src} lacks width/height (R-HTML-12)`);
      const priority = img.getAttribute("fetchpriority") === "high";
      const lazy = img.getAttribute("loading") === "lazy";
      if (priority && lazy) add("img-attrs", `img ${src} is both priority and lazy (R-HTML-12)`);
      if (!priority && !lazy) add("img-attrs", `img ${src} is neither the LCP image (fetchpriority="high") nor loading="lazy" (R-HTML-12)`);
    }

    const head = root.querySelector("head");
    if (head) {
      let max = -1;
      for (const el of head.childNodes.filter((n) => n.tagName)) {
        const idx = HEAD_ORDER.findIndex((p) => p(el));
        if (idx < 0) continue;
        if (idx < max) { add("head-order", `<${el.tagName.toLowerCase()} ${el.rawAttrs.slice(0, 40)}> appears after later head items (R-HTML-02)`); break; }
        max = idx;
      }
      const title = head.querySelector("title")?.text?.trim() || "";
      const parts = title.split(" · ");
      const pageTitle = parts.length > 1 ? parts.slice(0, -1).join(" · ") : title;
      const titleWidth = displayWidth(pageTitle);
      if (titleWidth > 60) add("meta-length", `title "${pageTitle.slice(0, 40)}…" is ${titleWidth} wide (max 60, R-HTML-03)`);
      const desc = head.querySelector('meta[name="description"]')?.getAttribute("content") || "";
      const descWidth = displayWidth(desc);
      if (descWidth < 120 || descWidth > 155) add("meta-length", `description is ${descWidth} wide (120–155, R-HTML-03)`);
    }
  }
  return { id, ok: findings.length === 0, findings };
}
