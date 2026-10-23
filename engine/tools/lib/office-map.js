/**
 * The office map (to-do 7): one equirectangular frame shared by the inline map on the locations page, the generated
 * picture and the style guide's <area> hot spots, so a dot, its link and its hot spot always agree. 4 px per degree,
 * longitude 10° W to 150° E (Manchester to Tokyo), latitude 65° N to 15° N: 640 × 200.
 */
export const MAP = { width: 640, height: 200, west: -10, north: 65, scale: 4 };
export const project = ({ lat, lng }) => ({ x: Math.round((lng - MAP.west) * MAP.scale), y: Math.round((MAP.north - lat) * MAP.scale) });

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Graticule lines, the route through the offices and each label's side: the geometry both renderings share. */
function layout(offices, { gap = 14 } = {}) {
  const pts = offices.filter((o) => o.geo).map((o) => ({ ...project(o.geo), o }));
  const grid = [];
  const east = MAP.west + MAP.width / MAP.scale, south = MAP.north - MAP.height / MAP.scale;
  for (let lng = MAP.west + 10; lng < east; lng += 10) { const { x } = project({ lat: 0, lng }); grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="${MAP.height}"/>`); }
  for (let lat = south + 5; lat < MAP.north; lat += 10) { const { y } = project({ lat, lng: 0 }); grid.push(`<line x1="0" y1="${y}" x2="${MAP.width}" y2="${y}"/>`); }
  const route = pts.map((p) => `${p.x},${p.y}`).join(" ");
  // Labels go to the side with room: away from a neighbour on the same row, and inwards near the edges.
  for (const p of pts) {
    const near = pts.find((q) => q !== p && Math.abs(q.y - p.y) < 24);
    p.left = near ? near.x > p.x : p.x > MAP.width / 2;
    p.lx = p.left ? p.x - gap : p.x + gap;
  }
  return { pts, grid, route };
}

/** The picture (a file, for the style guide's image map): a light panel with a 10° graticule, the offices joined by a dashed route, a dot and a label each. */
export function officeMapSvg(offices, { label = (o) => o.city } = {}) {
  const { pts, grid, route } = layout(offices);
  const labels = pts.map((p) => `<text x="${p.lx}" y="${p.y + 5}" text-anchor="${p.left ? "end" : "start"}">${esc(label(p.o))}</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP.width} ${MAP.height}" width="${MAP.width}" height="${MAP.height}">
<rect width="${MAP.width}" height="${MAP.height}" rx="12" fill="#f4f7fb"/>
<g stroke="#d3dbe6" stroke-width="1">${grid.join("")}</g>
<polyline points="${route}" fill="none" stroke="#005db8" stroke-opacity=".45" stroke-width="2" stroke-dasharray="6 6"/>
<g fill="#005db8" stroke="#fff" stroke-width="3">${pts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="8"/>`).join("")}</g>
<g font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#1f2a37">${labels.join("")}</g>
</svg>
`;
}

/**
 * The inline map on the locations page: the same frame drawn with theme classes (brand, surfaces and ink in both
 * schemes), scaled to its column, each office a link around its dot and label with a 22-unit transparent hit area.
 * Labels are 20 units so they stay legible when a phone scales the map to about half size; the list beside it repeats
 * every link as text; a focused link underlines its label. offices = [{ title, href, geo }]; linkLabel(o) is the link's accessible name.
 */
export function officeMapInline(offices, { linkLabel = (o) => o.title, label = "" } = {}) {
  const { pts, grid, route } = layout(offices, { gap: 16 });
  const links = pts.map((p) =>
    `<a href="${esc(p.o.href)}" aria-label="${esc(linkLabel(p.o))}" class="group focus-visible:outline-none">` +
    `<circle cx="${p.x}" cy="${p.y}" r="22" fill="transparent"/>` +
    `<circle cx="${p.x}" cy="${p.y}" r="9" class="fill-brand-600 stroke-surface-alt" stroke-width="3"/>` +
    `<text x="${p.lx}" y="${p.y + 7}" text-anchor="${p.left ? "end" : "start"}" fill="currentColor" class="group-focus-visible:underline" aria-hidden="true">${esc(p.o.title)}</text></a>`);
  return `<svg viewBox="0 0 ${MAP.width} ${MAP.height}" width="${MAP.width}" height="${MAP.height}" class="block h-auto w-full" role="group"${label ? ` aria-label="${esc(label)}"` : ""}>` +
    `<rect width="${MAP.width}" height="${MAP.height}" class="fill-surface-alt"/>` +
    `<g class="stroke-line" stroke-width="1">${grid.join("")}</g>` +
    `<polyline points="${route}" fill="none" class="stroke-brand-600" stroke-opacity=".45" stroke-width="2" stroke-dasharray="6 6"/>` +
    `<g font-size="20" font-weight="600" class="text-ink">${links.join("")}</g></svg>`;
}
