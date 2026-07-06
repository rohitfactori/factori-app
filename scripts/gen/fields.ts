/** Pure spatial-field math for the snapshot generator. No h3 dependency —
 *  everything works on [lng, lat] pairs and km distances. */

export type Pt = [number, number]; // [lng, lat]

const KM_LAT = 110.574;
const kmLng = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180);

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const round = (v: number, dp = 0) => {
  const m = 10 ** dp;
  return Math.round(v * m) / m;
};

export function distKm(a: Pt, b: Pt) {
  const dx = (a[0] - b[0]) * kmLng((a[1] + b[1]) / 2);
  const dy = (a[1] - b[1]) * KM_LAT;
  return Math.hypot(dx, dy);
}

/** gaussian-ish falloff: 1 at d=0, ~0.37 at d=r, →0 beyond */
export const kernel = (dKm: number, rKm: number) => Math.exp(-((dKm / rKm) ** 2));

export function distToSegmentKm(p: Pt, a: Pt, b: Pt) {
  const kx = kmLng(p[1]);
  const ax = a[0] * kx, ay = a[1] * KM_LAT;
  const bx = b[0] * kx, by = b[1] * KM_LAT;
  const px = p[0] * kx, py = p[1] * KM_LAT;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1e-9;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function distToPolylineKm(p: Pt, pts: Pt[]) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distToSegmentKm(p, pts[i], pts[i + 1]));
  return d;
}

/** max-blend of anchor kernels weighted by pick(anchor) */
export function anchorField<A extends { lng: number; lat: number; r: number }>(
  p: Pt,
  anchors: A[],
  pick: (a: A) => number
) {
  let v = 0;
  for (const a of anchors) v = Math.max(v, pick(a) * kernel(distKm(p, [a.lng, a.lat]), a.r));
  return v;
}

export function corridorField<C extends { pts: Pt[]; wKm: number; activity: number }>(
  p: Pt,
  corridors: C[]
) {
  let v = 0;
  for (const c of corridors) v = Math.max(v, c.activity * kernel(distToPolylineKm(p, c.pts), c.wKm));
  return v;
}

/* deterministic value noise on a ~1.1km lattice, bilinear-smoothed, 0..1 */
function latticeHash(ix: number, iy: number, seed: number) {
  let h = (ix * 374761393 + iy * 668265263 + seed * 2147483647) | 0;
  h = (h ^ (h >> 13)) | 0;
  h = Math.imul(h, 1274126177);
  h = (h ^ (h >> 16)) >>> 0;
  return h / 4294967295;
}

export function noise2d(lng: number, lat: number, seed: number) {
  const gx = lng * 90, gy = lat * 90; // ≈1.1km cells
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0;
  const s = (t: number) => t * t * (3 - 2 * t);
  const v00 = latticeHash(x0, y0, seed), v10 = latticeHash(x0 + 1, y0, seed);
  const v01 = latticeHash(x0, y0 + 1, seed), v11 = latticeHash(x0 + 1, y0 + 1, seed);
  return (v00 * (1 - s(fx)) + v10 * s(fx)) * (1 - s(fy)) + (v01 * (1 - s(fx)) + v11 * s(fx)) * s(fy);
}
