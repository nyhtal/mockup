import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { pagesFor, parse } from "../lib/html.js";

export const id = "consistency";
export const checks = [
  "inline-style", "single-h1", "heading-order", "dup-id", "class-exists", "component-known",
  "logical-props", "motion-safe", "no-arbitrary-lengths", "no-hash-links", "img-attrs", "head-order", "meta-length",
];

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
      if (img.getAttribute("fetchpriority") === "high" && img.getAttribute("loading") === "lazy") add("img-attrs", `img ${src} is both priority and lazy (R-HTML-12)`);
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
      if (pageTitle.length > 60) add("meta-length", `title "${pageTitle.slice(0, 40)}…" is ${pageTitle.length} chars (max 60, R-HTML-03)`);
      const desc = head.querySelector('meta[name="description"]')?.getAttribute("content") || "";
      if (desc.length < 120 || desc.length > 155) add("meta-length", `description is ${desc.length} chars (120–155, R-HTML-03)`);
    }
  }
  return { id, ok: findings.length === 0, findings };
}
