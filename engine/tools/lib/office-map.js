/**
 * The office map (to-do 7): one equirectangular frame shared by the generated picture and the <area> hot spots, so a
 * hot spot always sits on its dot. 8 px per degree, longitude 20° W to 60° E, latitude 65° N to 15° N: 640 × 400.
 */
export const MAP = { width: 640, height: 400, west: -20, north: 65, scale: 8 };
export const project = ({ lat, lng }) => ({ x: Math.round((lng - MAP.west) * MAP.scale), y: Math.round((MAP.north - lat) * MAP.scale) });

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** The picture: a light panel with a 10° graticule, the offices joined by a dashed route, a dot and a label each. */
export function officeMapSvg(offices, { label = (o) => o.city } = {}) {
  const pts = offices.filter((o) => o.geo).map((o) => ({ ...project(o.geo), o }));
  const grid = [];
  for (let lng = -10; lng <= 50; lng += 10) { const { x } = project({ lat: 0, lng }); grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="${MAP.height}"/>`); }
  for (let lat = 20; lat <= 60; lat += 10) { const { y } = project({ lat, lng: 0 }); grid.push(`<line x1="0" y1="${y}" x2="${MAP.width}" y2="${y}"/>`); }
  const route = pts.map((p) => `${p.x},${p.y}`).join(" ");
  // Labels go to the side with room: away from a neighbour on the same row, and inwards near the edges.
  const labels = pts.map((p) => {
    const near = pts.find((q) => q !== p && Math.abs(q.y - p.y) < 24);
    const left = near ? near.x > p.x : p.x > MAP.width / 2;
    return `<text x="${left ? p.x - 14 : p.x + 14}" y="${p.y + 5}" text-anchor="${left ? "end" : "start"}">${esc(label(p.o))}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP.width} ${MAP.height}" width="${MAP.width}" height="${MAP.height}">
<rect width="${MAP.width}" height="${MAP.height}" rx="12" fill="#f4f7fb"/>
<g stroke="#d3dbe6" stroke-width="1">${grid.join("")}</g>
<polyline points="${route}" fill="none" stroke="#005db8" stroke-opacity=".45" stroke-width="2" stroke-dasharray="6 6"/>
<g fill="#005db8" stroke="#fff" stroke-width="3">${pts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="8"/>`).join("")}</g>
<g font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#1f2a37">${labels.join("")}</g>
</svg>
`;
}
