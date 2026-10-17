import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { pagesFor, parse } from "../lib/html.js";

export const id = "consistency";

/** Marker classes Tailwind never emits CSS for but which variants depend on. */
const NOOP = /^(group|peer)(\/[\w-]+)?$/;

/** Set of class names a built Tailwind file defines, with CSS escaping undone. */
export function classesInCss(css) {
  const set = new Set();
  for (const m of css.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)/g)) set.add(m[1].replace(/\\(.)/g, "$1"));
  return set;
}

/** Component names = .njk file names under catalog/{primitives,components,sections}. */
export function catalogComponents(engineDir = "engine") {
  const out = new Set();
  for (const kind of ["primitives", "components", "sections"]) {
    const dir = path.join(engineDir, "catalog", kind);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (f.endsWith(".njk")) out.add(f.replace(/\.njk$/, ""));
  }
  return out;
}

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

    for (const el of root.querySelectorAll("[class]")) {
      for (const c of el.getAttribute("class").split(/\s+/).filter(Boolean)) {
        if (!css.has(c) && !NOOP.test(c)) add("class-exists", `class "${c}" not in built CSS`);
      }
    }

    for (const el of root.querySelectorAll("[data-component]")) {
      const v = el.getAttribute("data-component");
      if (!known.has(v)) add("component-known", `data-component "${v}" not in catalog`);
    }
  }
  return { id, ok: findings.length === 0, findings };
}
