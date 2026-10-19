import { createHash } from "node:crypto";

/**
 * The one inline script (R-PERF-03, R-PREC-08): applies a theme the visitor chose before the first paint, so a dark
 * choice never flashes light. It only reads; enhance.js writes. The CSP allows exactly this text by its hash.
 */
export const THEME_SCRIPT = 'try{var t=localStorage.getItem("theme");if(t=="light"||t=="dark")document.documentElement.dataset.theme=t}catch(e){}';

/** CSP source expression for THEME_SCRIPT. */
export const THEME_SCRIPT_HASH = `'sha256-${createHash("sha256").update(THEME_SCRIPT, "utf8").digest("base64")}'`;
