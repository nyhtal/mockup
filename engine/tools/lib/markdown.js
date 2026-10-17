import MarkdownIt from "markdown-it";

/** Heading slug: lower-case, letters and digits of any script kept, everything else collapsed to one hyphen. */
export function slugify(text) {
  return text.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "section";
}

function headings(md) {
  const parser = new MarkdownIt({ html: false, linkify: false, typographer: false });
  const tokens = parser.parse(md, {});
  const seen = new Map();
  const out = [];
  tokens.forEach((tok, i) => {
    if (tok.type !== "heading_open") return;
    const text = tokens[i + 1].children.filter((c) => c.type === "text" || c.type === "code_inline").map((c) => c.content).join("");
    const base = slugify(text);
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    out.push({ id: n === 1 ? base : `${base}-${n}`, text, level: Number(tok.tag.slice(1)), token: tok });
  });
  return out;
}

/** Markdown → HTML with ids on every heading (R-COMP-13 anchors; toc targets). */
export function renderMarkdown(md) {
  const parser = new MarkdownIt({ html: false, linkify: false, typographer: false });
  const tokens = parser.parse(md, {});
  const seen = new Map();
  tokens.forEach((tok, i) => {
    if (tok.type !== "heading_open") return;
    const text = tokens[i + 1].children.filter((c) => c.type === "text" || c.type === "code_inline").map((c) => c.content).join("");
    const base = slugify(text);
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    tok.attrSet("id", n === 1 ? base : `${base}-${n}`);
  });
  return parser.renderer.render(tokens, parser.options, {}).trim();
}

/** h2 and h3 entries for the toc component, in document order. */
export function tocOf(md) {
  return headings(md).filter((h) => h.level === 2 || h.level === 3).map(({ id, text, level }) => ({ id, text, level }));
}

/** Words in the rendered text, any script (for reading time). */
export function wordCount(md) {
  const text = renderMarkdown(md).replace(/<[^>]+>/g, " ");
  return (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu) || []).length;
}
