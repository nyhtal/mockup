/**
 * Build-time parsing of a formatted figure ("1,284", "99,98 %", "٣٨٪") into what the count-up script needs (R-MOT-10, R-TYPO-09):
 * the numeric value, the authored decimal count and the numbering system, so the script never guesses at separators.
 */
const cache = new Map();

/** Separators and digit glyphs of a formatting locale (e.g. "de-DE-u-nu-latn"). */
export function localeShape(fmtLocale) {
  if (cache.has(fmtLocale)) return cache.get(fmtLocale);
  const parts = new Intl.NumberFormat(fmtLocale).formatToParts(1234567.89);
  const group = parts.find((p) => p.type === "group")?.value ?? ",";
  const decimal = parts.find((p) => p.type === "decimal")?.value ?? ".";
  const plain = new Intl.NumberFormat(fmtLocale, { useGrouping: false });
  const digits = Array.from({ length: 10 }, (_, d) => plain.format(d));
  const nu = /-u-nu-([a-z]+)/.exec(fmtLocale)?.[1] || "latn";
  const shape = { group, decimal, digits, nu };
  cache.set(fmtLocale, shape);
  return shape;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * { number, decimals, nu, prefix, suffix } for a formatted value, or null when it holds no digit of the locale.
 * The first run of digits and separators is the figure; what surrounds it is kept verbatim by the script.
 */
export function parseFigure(value, fmtLocale) {
  const { group, decimal, digits, nu } = localeShape(fmtLocale);
  const digitClass = digits.map(escapeRe).join("");
  const run = new RegExp(`[${digitClass}](?:[${digitClass}${escapeRe(group)}${escapeRe(decimal)}\\u00a0\\u202f]*[${digitClass}])?`);
  const m = run.exec(String(value));
  if (!m) return null;
  let raw = m[0];
  // The decimal separator is the last separator followed by one or two digits; any other separator groups thousands.
  const lastSep = Math.max(raw.lastIndexOf(decimal), group === decimal ? -1 : raw.lastIndexOf(group));
  let decimals = 0;
  if (lastSep >= 0) {
    const after = raw.slice(lastSep + 1);
    const isDecimal = raw.slice(lastSep, lastSep + decimal.length) === decimal && after.length > 0 && after.length <= 2;
    if (isDecimal) decimals = after.length;
  }
  const ascii = [...raw].map((ch) => { const d = digits.indexOf(ch); return d >= 0 ? String(d) : ch; }).join("");
  const stripped = decimals ? ascii.slice(0, lastSep).replace(/[^0-9]/g, "") + "." + ascii.slice(lastSep + 1).replace(/[^0-9]/g, "") : ascii.replace(/[^0-9]/g, "");
  const number = Number(stripped);
  if (!Number.isFinite(number)) return null;
  return { number, decimals, nu, prefix: String(value).slice(0, m.index), suffix: String(value).slice(m.index + raw.length) };
}
