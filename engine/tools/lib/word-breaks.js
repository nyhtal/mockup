/**
 * <wbr> break opportunities in long compounds (to-do 6): in a word of 14 letters or more that starts with one of the
 * locale's listed first parts, a <wbr> goes after the longest such part ("Steuerungs<wbr>software"). Headings use it so a
 * German compound wraps at its joint instead of overflowing or breaking mid-syllable. Returns escaped HTML.
 */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function wordBreaks(text, parts = []) {
  if (text == null) return "";
  const sorted = [...parts].sort((a, b) => b.length - a.length);
  return String(text).split(/(\p{L}+)/u).map((w, i) => {
    if (i % 2 === 0 || w.length < 14) return esc(w);
    const p = sorted.find((x) => w.startsWith(x) && w.length - x.length >= 4);
    return p ? `${esc(p)}<wbr>${esc(w.slice(p.length))}` : esc(w);
  }).join("");
}
