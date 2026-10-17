/** Static discovery and deployment files every site ships (R-DEPLOY-01, R-DEPLOY-05, R-DEPLOY-06, R-SEO-12). */
export function engineFiles(site) {
  const host = new URL(site.url).hostname;
  const expires = new Date(Date.UTC(new Date().getUTCFullYear() + 1, 0, 1)).toISOString();
  const csp = "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests";
  return [
    { path: "/robots.txt", content: `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n` },
    { path: "/.well-known/security.txt", content: `Contact: mailto:${site.securityContact || `security@${host}`}\nExpires: ${expires}\nPreferred-Languages: ${site.locales.join(", ")}\nCanonical: ${site.url}/.well-known/security.txt\n` },
    {
      path: "/_headers",
      content: `/*\n  Content-Security-Policy: ${csp}\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n  Strict-Transport-Security: max-age=31536000; includeSubDomains\n\n/assets/*\n  Cache-Control: public, max-age=31536000\n`,
    },
    { path: "/headers.json", content: JSON.stringify({ "/*": { "Content-Security-Policy": csp, "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()", "Strict-Transport-Security": "max-age=31536000; includeSubDomains" }, "/assets/*": { "Cache-Control": "public, max-age=31536000" } }, null, 2) + "\n" },
    { path: "/_redirects", content: `/  /${site.defaultLocale}/  301\n` },
    { path: "/redirects.json", content: JSON.stringify([{ from: "/", to: `/${site.defaultLocale}/`, status: 301 }], null, 2) + "\n" },
  ];
}
