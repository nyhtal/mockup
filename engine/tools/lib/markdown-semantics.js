/**
 * markdown-it plugin: the text-level elements plain Markdown has no syntax for (to-do 6). Raw HTML stays off for
 * entity bodies, so these are spelled in Markdown and rendered here, every piece of text escaped:
 *
 *   *[PLC]: programmable logic controller   a definition line (removed); every "PLC" becomes <abbr title="…">
 *   CO~2~   m^2^                              <sub>, <sup>
 *   [[Ctrl]]+[[G]]                            <kbd>
 *   $n$                                       <var> (a single identifier between dollar signs)
 *   "…"  „…“  «…»                             <q>, each locale's own quotation marks (the browser draws them back)
 *   ```samp                                   <pre><samp>: program output rather than code
 *   > quote … > — Name, *Work*                 figure > blockquote + figcaption, the work's title in <cite>
 */
const ABBR_DEF = /^\*\[([^\]\n]+)\]:[ \t]*(.+)$/gm;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function semantics(md) {
  const esc = md.utils.escapeHtml;

  // Abbreviation definitions are lifted out of the source before block parsing.
  md.core.ruler.before("block", "abbr_defs", (state) => {
    const defs = {};
    state.src = state.src.replace(ABBR_DEF, (_, abbr, title) => { defs[abbr.trim()] = title.trim(); return ""; });
    state.env.abbr = defs;
  });

  // Inline elements: split text tokens into text and escaped html_inline pieces.
  md.core.ruler.push("inline_semantics", (state) => {
    const defs = state.env.abbr || {};
    const names = Object.keys(defs).sort((a, b) => b.length - a.length);
    const parts = [
      String.raw`\[\[([^\]\n]{1,24})\]\]`, // 1 kbd
      String.raw`~([^~\s]{1,12})~`, // 2 sub
      String.raw`\^([^^\s]{1,12})\^`, // 3 sup
      String.raw`\$([A-Za-z][\w′']{0,15})\$`, // 4 var
      String.raw`"([^"\n]+)"|„([^“\n]+)“|«([^»\n]+)»`, // 5, 6, 7 q
    ];
    if (names.length) parts.push(String.raw`(?<![\p{L}\p{N}])(${names.map(escapeRe).join("|")})(?![\p{L}\p{N}])`); // 8 abbr
    const re = new RegExp(parts.join("|"), "gu");
    const html = (content) => Object.assign(new state.Token("html_inline", "", 0), { content });
    const text = (content) => Object.assign(new state.Token("text", "", 0), { content });
    for (const block of state.tokens) {
      if (block.type !== "inline" || !block.children) continue;
      const out = [];
      for (const tok of block.children) {
        if (tok.type !== "text" || !re.test(tok.content)) { out.push(tok); continue; }
        re.lastIndex = 0;
        let last = 0;
        for (const m of tok.content.matchAll(re)) {
          if (m.index > last) out.push(text(tok.content.slice(last, m.index)));
          const [, kbd, sub, sup, v, q1, q2, q3, abbr] = m;
          if (kbd) out.push(html(`<kbd>${esc(kbd)}</kbd>`));
          else if (sub) out.push(html(`<sub>${esc(sub)}</sub>`));
          else if (sup) out.push(html(`<sup>${esc(sup)}</sup>`));
          else if (v) out.push(html(`<var>${esc(v)}</var>`));
          else if (q1 || q2 || q3) out.push(html(`<q>${esc(q1 || q2 || q3)}</q>`));
          else if (abbr) out.push(html(`<abbr title="${esc(defs[abbr])}">${esc(abbr)}</abbr>`));
          last = m.index + m[0].length;
        }
        if (last < tok.content.length) out.push(text(tok.content.slice(last)));
      }
      block.children = out;
    }
  });

  // A quotation whose last paragraph starts with an em dash: the dash line is its attribution, outside the quote.
  md.core.ruler.push("quote_attribution", (state) => {
    const t = state.tokens;
    for (let i = 0; i < t.length; i++) {
      if (t[i].type !== "blockquote_open" || t[i].level !== 0) continue;
      const close = t.findIndex((x, j) => j > i && x.type === "blockquote_close" && x.level === 0);
      if (close < 0 || close - 3 <= i) continue;
      const inl = t[close - 2];
      if (t[close - 1].type !== "paragraph_close" || inl.type !== "inline") continue;
      const first = inl.children[0];
      if (!first || first.type !== "text" || !/^—\s*/.test(first.content)) continue;
      first.content = first.content.replace(/^—\s*/, "");
      for (const c of inl.children) if (c.type === "em_open" || c.type === "em_close") c.tag = "cite";
      const block = (content) => Object.assign(new state.Token("html_block", "", 0), { content });
      t.splice(close - 3, 3); // the attribution paragraph leaves the quote
      const end = close - 3; // blockquote_close now
      t.splice(end + 1, 0, block("<figcaption>— "), inl, block("</figcaption>\n</figure>\n"));
      t.splice(i, 0, block("<figure>\n"));
      i = end + 4;
    }
  });

  // Program output: ```samp fences.
  const fence = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
    const tok = tokens[idx];
    if (tok.info.trim() === "samp") return `<pre><samp>${esc(tok.content)}</samp></pre>\n`;
    return fence(tokens, idx, opts, env, self);
  };
}
