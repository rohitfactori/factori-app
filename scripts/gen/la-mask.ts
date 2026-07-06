/** Coarse LA land/urban mask (hand-tuned; demo-grade). Excluded cells are
 *  simply omitted from the snapshot, so ocean and mountains read as gaps. */
import { distToPolylineKm, type Pt } from "./fields";

/** approximate coastline SM Bay → Palos Verdes → Long Beach; ocean = seaward side */
const COAST: Pt[] = [
  [-118.95, 34.05], [-118.8, 34.03], [-118.68, 34.035], [-118.56, 34.04],
  [-118.5, 34.008], [-118.46, 33.98], [-118.44, 33.93], [-118.43, 33.87],
  [-118.39, 33.8], [-118.3, 33.72], [-118.18, 33.72], [-118.1, 33.74],
];

/** latitude of the coast at a given lng (piecewise linear); ocean is south/west of it */
function coastLatAt(lng: number) {
  if (lng <= COAST[0][0]) return COAST[0][1];
  for (let i = 0; i < COAST.length - 1; i++) {
    const [x1, y1] = COAST[i];
    const [x2, y2] = COAST[i + 1];
    if (lng >= x1 && lng <= x2) return y1 + ((lng - x1) / (x2 - x1 || 1e-9)) * (y2 - y1);
  }
  return COAST[COAST.length - 1][1];
}

/** Santa Monica Mtns spine + Angeles NF as exclusion polylines with width */
const MOUNTAINS: { pts: Pt[]; wKm: number }[] = [
  { pts: [[-118.95, 34.09], [-118.75, 34.1], [-118.6, 34.1], [-118.5, 34.105], [-118.44, 34.115]], wKm: 4.0 },
  { pts: [[-118.4, 34.33], [-118.2, 34.3], [-118.05, 34.28], [-117.95, 34.26]], wKm: 9 },
];

export function isExcluded(lng: number, lat: number) {
  // ocean: seaward of the coastline (small onshore grace so beach cities survive)
  if (lat < coastLatAt(lng) - 0.012) return true;
  for (const m of MOUNTAINS) if (distToPolylineKm([lng, lat], m.pts) < m.wKm) return true;
  return false;
}
