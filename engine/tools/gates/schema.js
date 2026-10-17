import { readFileSync } from "node:fs";
import { pagesFor, parse, jsonLd } from "../lib/html.js";

export const id = "schema";
export const checks = ["parse", "single-block", "graph", "contract", "ref-resolves", "absolute-url"];

/** Properties whose string values must be absolute URLs. */
const URL_KEYS = new Set(["url", "image", "logo", "sameAs", "contentUrl", "thumbnailUrl", "item", "embedUrl"]);

export function loadContracts() {
  return JSON.parse(readFileSync("engine/schema-contracts.json", "utf8"));
}

export async function run(ctx) {
  const contracts = ctx.contracts || loadContracts();
  const findings = [];

  for (const file of pagesFor(ctx)) {
    const { root } = parse(file);
    const add = (check, message) => findings.push({ file, message, check: `schema/${check}` });

    let blocks;
    try { blocks = jsonLd(root); } catch (e) { add("parse", e.message); continue; }
    if (blocks.length !== 1) { add("single-block", `${blocks.length} JSON-LD blocks`); continue; }

    const graph = blocks[0]["@graph"];
    if (!Array.isArray(graph)) { add("graph", "no @graph array"); continue; }

    const ids = new Set(graph.map((n) => n["@id"]).filter(Boolean));
    const types = new Set(graph.flatMap((n) => [].concat(n["@type"] || [])));
    const pageType = root.querySelector("body")?.getAttribute("data-page") || "generic";
    const contract = contracts[pageType];
    if (!contract) add("contract", `no schema contract for page type "${pageType}"`);
    for (const t of contract?.required || []) if (!types.has(t)) add("contract", `page type "${pageType}" requires ${t}`);

    const walk = (v, key) => {
      if (Array.isArray(v)) return v.forEach((x) => walk(x, key));
      if (v && typeof v === "object") {
        const keys = Object.keys(v);
        if (keys.length === 1 && keys[0] === "@id" && !ids.has(v["@id"])) add("ref-resolves", `reference ${v["@id"]} has no node in the graph`);
        return keys.forEach((k) => walk(v[k], k));
      }
      if (typeof v === "string" && URL_KEYS.has(key) && !/^https?:\/\//.test(v)) add("absolute-url", `${key} "${v}" is not an absolute URL`);
    };
    walk(graph, null);
  }
  return { id, ok: findings.length === 0, findings };
}
