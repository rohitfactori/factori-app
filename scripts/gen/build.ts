/** Snapshot builder: composes hand-placed anchors, corridors, masks and
 *  seeded noise into per-hex metrics that read like a real city. Pure and
 *  deterministic — same meta in, same bytes out. */
import { cellToBoundary, cellToChildren, cellToLatLng, latLngToCell, polygonToCells } from "h3-js";
import { seeded } from "@/lib/format";
import type { MarketMeta } from "@/lib/snapshot/la-meta";
import type { HexFC, HexProps, PoiCategory, PoiFC, PoiProps } from "@/lib/snapshot/types";
import { anchorField, clamp, corridorField, distKm, noise2d, round, type Pt } from "./fields";
import { isExcluded } from "./la-mask";

export type BuildOpts = { bounds?: [number, number, number, number] };

const BRANDS: Record<PoiCategory, string[]> = {
  food: ["Starbucks", "McDonald's", "Chipotle", "In-N-Out", "Sweetgreen", "Panda Express", "Subway", "Taco Bell"],
  retail: ["Target", "Best Buy", "Nordstrom", "TJ Maxx", "Apple", "Sephora", "REI"],
  grocery: ["Trader Joe's", "Whole Foods", "Ralphs", "Vons", "Erewhon", "Costco"],
  health: ["CVS", "Walgreens", "Planet Fitness", "Equinox", "Kaiser"],
  fin: ["Chase", "Bank of America", "Wells Fargo", "Citi"],
};
const CATS: PoiCategory[] = ["food", "retail", "grocery", "health", "fin"];
const CAT_W = [0.34, 0.27, 0.14, 0.13, 0.12];

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const KM_LAT = 110.574;
const kmLng = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180);

/* seasonal wave shared by all trend series */
const seasonal = (m: number) => 1 + 0.06 * Math.sin((m / 12) * Math.PI * 2 + 0.8);

function trendSeries(nz: (seed: number) => number, seedBase: number, slope: number) {
  const out: number[] = [];
  for (let m = 0; m < 12; m++) {
    out.push(round(clamp(100 * (0.86 + (slope * m) / 11) * seasonal(m) * (0.9 + 0.2 * nz(seedBase + m)), 60, 160)));
  }
  return out;
}

/** clamp shares at a small floor, renormalize to sum 1, round 3dp */
function normShares(raw: number[]) {
  const floored = raw.map((v) => Math.max(0.02, v));
  const sum = floored.reduce((s, v) => s + v, 0);
  const out = floored.map((v) => round(v / sum, 3));
  // fix rounding drift on the largest bucket so the sum stays ≈1
  const drift = round(1 - out.reduce((s, v) => s + v, 0), 3);
  const iMax = out.indexOf(Math.max(...out));
  out[iMax] = round(out[iMax] + drift, 3);
  return out;
}

type PoiBin = { count: number; byCat: Record<PoiCategory, number>; brands: Map<string, number> };
const emptyBin = (): PoiBin => ({ count: 0, byCat: { food: 0, retail: 0, grocery: 0, health: 0, fin: 0 }, brands: new Map() });

function buildPois(meta: MarketMeta, bounds: [number, number, number, number]) {
  const [w, s, e, n] = bounds;
  const pois: GeoJSON.Feature<GeoJSON.Point, PoiProps>[] = [];
  const bins = new Map<string, PoiBin>();

  meta.anchors.forEach((a, ai) => {
    const rng = seeded(ai * 1000 + 9);
    const count = Math.round(140 * a.activity);
    const sigmaKm = a.r / 2.2;
    let made = 0;
    let guard = 0;
    while (made < count && guard < count * 6) {
      guard++;
      // Box–Muller gaussian jitter
      const u1 = Math.max(rng(), 1e-9);
      const u2 = rng();
      const mag = Math.sqrt(-2 * Math.log(u1)) * sigmaKm;
      const ang = u2 * Math.PI * 2;
      const lng = a.lng + (mag * Math.cos(ang)) / kmLng(a.lat);
      const lat = a.lat + (mag * Math.sin(ang)) / KM_LAT;
      if (lng < w || lng > e || lat < s || lat > n || isExcluded(lng, lat)) continue;

      const cr = rng();
      let ci = 0, acc = 0;
      for (let i = 0; i < CATS.length; i++) {
        acc += CAT_W[i];
        if (cr <= acc) { ci = i; break; }
        ci = i;
      }
      const category = CATS[ci];
      const pool = BRANDS[category];
      const brand = pool[Math.floor(rng() * pool.length)];
      const cell = latLngToCell(lat, lng, 8);
      const props: PoiProps = {
        id: `poi_${a.id}_${made}`,
        name: `${brand} · ${a.label}`,
        brand,
        category,
        h3: cell,
      };
      pois.push({
        type: "Feature",
        properties: props,
        geometry: { type: "Point", coordinates: [round(lng, 5), round(lat, 5)] },
      });
      const bin = bins.get(cell) ?? emptyBin();
      bin.count++;
      bin.byCat[category]++;
      bin.brands.set(brand, (bin.brands.get(brand) ?? 0) + 1);
      bins.set(cell, bin);
      made++;
    }
  });

  return { pois, bins };
}

function topBrands(bin: PoiBin | undefined, max = 5) {
  if (!bin) return [];
  return [...bin.brands.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, max).map(([b]) => b);
}

function hexProps(cell: string, meta: MarketMeta, bin: PoiBin | undefined): HexProps {
  const [lat, lng] = cellToLatLng(cell);
  const p: Pt = [lng, lat];
  const nz = (seed: number) => noise2d(lng, lat, seed);

  const act = Math.max(anchorField(p, meta.anchors, (a) => a.activity), corridorField(p, meta.corridors));
  const inc = anchorField(p, meta.anchors, (a) => a.income);
  const ngt = anchorField(p, meta.anchors, (a) => a.nightlife);

  const base = clamp(0.15 + 0.85 * act + 0.25 * (nz(11) - 0.5), 0, 1);
  const mv_visits = round(60000 * base ** 1.6);
  const mv_dwell = round(clamp(8 + 30 * (0.4 * inc + 0.3 * act + 0.6 * (nz(12) - 0.2)), 6, 45));
  const mv_eve = round(clamp(0.18 + 0.45 * ngt + 0.12 * (nz(13) - 0.5), 0.1, 0.7), 3);
  const mv_day = round(1 - mv_eve, 3);

  const dm_hhi = round(clamp(38000 + 175000 * (0.72 * inc + 0.28 * nz(15)), 35000, 220000), -2);
  const dm_pop = round(8600 * clamp(0.2 + 0.8 * act, 0, 1) * (1 - 0.45 * inc) * (0.75 + 0.5 * nz(16)));
  const dm_age = round(clamp(30 + 16 * inc + 6 * (nz(17) - 0.5) - 4 * ngt, 26, 52));
  const ageShift = (dm_age - 38) / 40;
  const dm_age_mix = normShares([
    0.12 - ageShift * 0.5,
    0.24 - ageShift * 0.5,
    0.22,
    0.19 + ageShift * 0.5,
    0.23 + ageShift * 0.5,
  ]);
  const incShift = (dm_hhi - 110000) / 300000;
  const dm_inc_mix = normShares([
    0.3 - incShift * 0.6,
    0.34 - incShift * 0.2,
    0.2 + incShift * 0.3,
    0.16 + incShift * 0.5,
  ]);

  const catAff = [
    0.5 * act + 0.5 * ngt,                 // food
    0.45 * act + 0.55 * inc,               // retail
    0.5 * (1 - inc) + 0.5 * act,           // grocery
    0.55 * inc + 0.45 * act,               // fitness
    0.65 * (1 - act) + 0.35 * nz(66),      // fuel
  ];
  const sp = catAff.map((aff, i) => round(clamp(100 * (0.55 + 0.5 * aff + 0.25 * (nz(60 + i) - 0.5)), 60, 160)));

  const au = {
    au_hip: round(40 * clamp(0.55 * inc + 0.25 * (1 - ngt) + 0.3 * nz(70), 0, 1), 1),
    au_trv: round(40 * clamp(0.5 * inc + 0.3 * act + 0.2 * nz(71), 0, 1), 1),
    au_auto: round(40 * clamp(0.45 * (1 - inc) + 0.35 * act + 0.3 * nz(72), 0, 1), 1),
    au_fit: round(40 * clamp(0.4 * inc + 0.35 * ngt + 0.25 * nz(73), 0, 1), 1),
    au_mov: round(40 * clamp(0.35 * act + 0.3 * (1 - inc) + 0.35 * nz(74), 0, 1), 1),
    au_lux: round(40 * clamp(0.8 * inc + 0.2 * nz(75), 0, 1), 1),
  };

  // nearest anchor label
  let label = "Greater Los Angeles";
  let best = 7;
  for (const a of meta.anchors) {
    const d = distKm(p, [a.lng, a.lat]);
    if (d < best) { best = d; label = a.label; }
  }

  // loyalty: brands weighted toward the hex's dominant poi category
  const rng = seeded(hashStr(cell));
  const domCat = bin
    ? (Object.entries(bin.byCat).sort((a, b) => b[1] - a[1])[0][0] as PoiCategory)
    : "food";
  const pool = [...BRANDS[domCat], ...BRANDS.food, ...BRANDS.retail];
  const bl = new Set<string>();
  while (bl.size < 3 + Math.floor(rng() * 3) && bl.size < 6) bl.add(pool[Math.floor(rng() * pool.length)]);

  return {
    h3: cell,
    label,
    mv_visits,
    mv_dwell,
    mv_day,
    mv_eve,
    tr: trendSeries(nz, 14, 0.22),
    tr_qsr: trendSeries(nz, 20, 0.3),
    tr_retail: trendSeries(nz, 32, 0.14),
    tr_grocery: trendSeries(nz, 44, 0.08),
    tr_fitness: trendSeries(nz, 56, 0.36),
    dm_hhi,
    dm_pop,
    dm_age,
    dm_age_mix,
    dm_inc_mix,
    sp_food: sp[0],
    sp_retail: sp[1],
    sp_grocery: sp[2],
    sp_fitness: sp[3],
    sp_fuel: sp[4],
    ...au,
    poi_count: bin?.count ?? 0,
    poi_food: bin?.byCat.food ?? 0,
    poi_retail: bin?.byCat.retail ?? 0,
    poi_grocery: bin?.byCat.grocery ?? 0,
    poi_health: bin?.byCat.health ?? 0,
    poi_fin: bin?.byCat.fin ?? 0,
    poi_top: topBrands(bin),
    bl_top: [...bl],
  };
}

function toFeature(cell: string, props: HexProps): GeoJSON.Feature<GeoJSON.Polygon, HexProps> {
  const ring = cellToBoundary(cell, true).map(([lng, lat]) => [round(lng, 5), round(lat, 5)]);
  return { type: "Feature", properties: props, geometry: { type: "Polygon", coordinates: [ring] } };
}

export function buildSnapshot(meta: MarketMeta, opts: BuildOpts = {}) {
  const bounds = opts.bounds ?? meta.bounds;
  const [w, s, e, n] = bounds;
  const ring: number[][] = [[w, s], [e, s], [e, n], [w, n], [w, s]];

  const keep = (cell: string) => {
    const [lat, lng] = cellToLatLng(cell);
    return !isExcluded(lng, lat);
  };
  const cells8 = polygonToCells([ring], 8, true).filter(keep).sort();
  const cells7 = polygonToCells([ring], 7, true).filter(keep).sort();

  const { pois, bins } = buildPois(meta, bounds);

  const props8 = new Map<string, HexProps>();
  for (const c of cells8) props8.set(c, hexProps(c, meta, bins.get(c)));

  const r8: HexFC = { type: "FeatureCollection", features: cells8.map((c) => toFeature(c, props8.get(c)!)) };

  const r7: HexFC = {
    type: "FeatureCollection",
    features: cells7.map((c) => {
      // r7 poi aggregates = sum of generated r8 children bins
      const agg = emptyBin();
      for (const child of cellToChildren(c, 8)) {
        const bin = bins.get(child);
        if (!bin) continue;
        agg.count += bin.count;
        for (const cat of CATS) agg.byCat[cat] += bin.byCat[cat];
        for (const [b, k] of bin.brands) agg.brands.set(b, (agg.brands.get(b) ?? 0) + k);
      }
      const props = hexProps(c, meta, agg.count ? agg : undefined);
      props.h3 = c;
      return toFeature(c, props);
    }),
  };

  const poi: PoiFC = { type: "FeatureCollection", features: pois };
  return { r7, r8, poi };
}
