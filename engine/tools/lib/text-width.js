/**
 * Display width (R-HTML-03, R-CONT-13): wide and full-width characters (CJK ideographs, kana, Hangul, full-width
 * punctuation and forms) count 2, everything else 1. Search snippets and fixed-width components are bounded in
 * pixels, and a Japanese character is about twice as wide as a Latin one, so limits written in Latin characters
 * hold for every script when they are measured this way.
 */
const WIDE = /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏ꥠ-꥿가-힣豈-﫿︐-︙︰-﹯＀-｠￠-￦\u{1F200}-\u{1F2FF}\u{20000}-\u{3FFFD}]/u;

export function displayWidth(s) {
  let w = 0;
  for (const ch of String(s ?? "")) w += WIDE.test(ch) ? 2 : 1;
  return w;
}
