/** Static discovery and deployment files every site ships (R-DEPLOY-01, R-DEPLOY-05, R-DEPLOY-06, R-SEO-12). */
import { THEME_SCRIPT_HASH } from "./theme-script.js";

export function engineFiles(site) {
  const host = new URL(site.url).hostname;
  const expires = new Date(Date.UTC(new Date().getUTCFullYear() + 1, 0, 1)).toISOString();
  const csp = `default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self' ${THEME_SCRIPT_HASH}; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests`;
  // Old addresses of moved pages, first match wins (D56, D59): the style guide and HTML reference moved from /<default>/style-guide/ and /<default>/qa/ to /<default>/sys/, then to /sys/; the lettered section pages became groups.
  const L = `/${site.defaultLocale}`;
  const redirects = [
    ["/", `${L}/`],
    [`${L}/style-guide/widgets/`, `${L}/sys/`],
    [`${L}/style-guide/html/`, "/sys/html/"],
    [`${L}/style-guide/*`, "/sys/style-guide/:splat"],
    [`${L}/qa/html/`, "/sys/html/"],
    [`${L}/qa/*`, `${L}/sys/`],
    [`${L}/sys/html/`, "/sys/html/"],
    ...["b", "c", "d", "e"].map((x) => [`${L}/sys/style-guide/sections-${x}/`, "/sys/style-guide/sections/"]),
    [`${L}/sys/style-guide/*`, "/sys/style-guide/:splat"],
  ].map(([from, to]) => ({ from, to, status: 301 }));
  return [
    { path: "/robots.txt", content: `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n` },
    { path: "/.well-known/security.txt", content: `Contact: mailto:${site.securityContact || `security@${host}`}\nExpires: ${expires}\nPreferred-Languages: ${site.locales.join(", ")}\nCanonical: ${site.url}/.well-known/security.txt\n` },
    {
      path: "/_headers",
      content: `/*\n  Content-Security-Policy: ${csp}\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n  Strict-Transport-Security: max-age=31536000; includeSubDomains\n\n/assets/*\n  Cache-Control: public, max-age=31536000\n`,
    },
    { path: "/headers.json", content: JSON.stringify({ "/*": { "Content-Security-Policy": csp, "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()", "Strict-Transport-Security": "max-age=31536000; includeSubDomains" }, "/assets/*": { "Cache-Control": "public, max-age=31536000" } }, null, 2) + "\n" },
    { path: "/_redirects", content: redirects.map((r) => `${r.from}  ${r.to}  ${r.status}`).join("\n") + "\n" },
    { path: "/redirects.json", content: JSON.stringify(redirects, null, 2) + "\n" },
  ];
}
