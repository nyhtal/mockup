import { createHash } from "node:crypto";

/**
 * The one inline script (R-PERF-03, R-PREC-08): applies a theme the visitor chose before the first paint, so a dark
 * choice never flashes light, and hides an announcement bar the visitor dismissed this session (to-do 7b). It only reads; enhance.js writes. The CSP allows exactly this text by its hash.
 */
export const THEME_SCRIPT = 'try{var d=document.documentElement,t=localStorage.getItem("theme");if(t=="light"||t=="dark")d.dataset.theme=t;if(sessionStorage.notice)d.dataset.notice="off"}catch(e){}';

/** CSP source expression for THEME_SCRIPT. */
export const THEME_SCRIPT_HASH = `'sha256-${createHash("sha256").update(THEME_SCRIPT, "utf8").digest("base64")}'`;
