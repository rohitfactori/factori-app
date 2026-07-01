export type LngLat = [number, number];
export type CityDef = { center: LngLat; zoom: number; label: string };

export const CITIES: Record<string, CityDef> = {
  "los angeles": { center: [-118.2437, 34.0522], zoom: 9.6, label: "Los Angeles" },
  "san diego": { center: [-117.1611, 32.7157], zoom: 10.4, label: "San Diego" },
  "las vegas": { center: [-115.1398, 36.1699], zoom: 10.6, label: "Las Vegas" },
  irvine: { center: [-117.8265, 33.6846], zoom: 11.8, label: "Irvine" },
  "san francisco": { center: [-122.4194, 37.7749], zoom: 11.2, label: "San Francisco" },
  "new york": { center: [-73.9857, 40.7484], zoom: 10.8, label: "New York" },
  dallas: { center: [-96.797, 32.7767], zoom: 10.2, label: "Dallas" },
  austin: { center: [-97.7431, 30.2672], zoom: 10.6, label: "Austin" },
  miami: { center: [-80.1918, 25.7617], zoom: 10.6, label: "Miami" },
  chicago: { center: [-87.6298, 41.8781], zoom: 10.4, label: "Chicago" },
  seattle: { center: [-122.3321, 47.6062], zoom: 10.6, label: "Seattle" },
  california: { center: [-119.4179, 36.7783], zoom: 5.6, label: "California" },
  texas: { center: [-99.9018, 31.9686], zoom: 5.5, label: "Texas" },
  india: { center: [78.9629, 22.5937], zoom: 4.4, label: "India" },
  "united states": { center: [-96, 38.5], zoom: 3.8, label: "United States" },
};

export const DEFAULT_CITY: CityDef = CITIES["los angeles"];

export function detectCity(q: string): { key: string; def: CityDef } | null {
  const lq = q.toLowerCase();
  const keys = Object.keys(CITIES).sort((a, b) => b.length - a.length);
  for (const k of keys) if (lq.includes(k)) return { key: k, def: CITIES[k] };
  return null;
}

const KM_PER_DEG_LAT = 110.574;
const kmPerDegLng = (lat: number) =>
  111.32 * Math.cos((lat * Math.PI) / 180);

export function scatter(
  center: LngLat,
  n: number,
  spreadKm: number,
  rng: () => number
): LngLat[] {
  const [lng, lat] = center;
  const out: LngLat[] = [];
  for (let i = 0; i < n; i++) {
    const r = spreadKm * Math.sqrt(rng());
    const theta = rng() * Math.PI * 2;
    const dLat = (r * Math.sin(theta)) / KM_PER_DEG_LAT;
    const dLng = (r * Math.cos(theta)) / kmPerDegLng(lat);
    out.push([lng + dLng, lat + dLat]);
  }
  return out;
}

/** Slightly irregular isochrone-like polygon ring (closed). */
export function isoPolygon(
  center: LngLat,
  radiusKm: number,
  rng: () => number,
  steps = 44
): LngLat[] {
  const [lng, lat] = center;
  const wob: number[] = [];
  for (let i = 0; i < steps; i++) wob.push(0.74 + rng() * 0.5);
  const ring: LngLat[] = [];
  for (let i = 0; i <= steps; i++) {
    const idx = i % steps;
    const prev = wob[(idx - 1 + steps) % steps];
    const next = wob[(idx + 1) % steps];
    const w = (wob[idx] * 2 + prev + next) / 4; // smooth
    const a = (idx / steps) * Math.PI * 2;
    const r = radiusKm * w;
    const dLat = (r * Math.sin(a)) / KM_PER_DEG_LAT;
    const dLng = (r * Math.cos(a)) / kmPerDegLng(lat);
    ring.push([lng + dLng, lat + dLat]);
  }
  return ring;
}

export function bbox(points: LngLat[]): [number, number, number, number] {
  let w = 180,
    s = 90,
    e = -180,
    n = -90;
  for (const [lng, lat] of points) {
    w = Math.min(w, lng);
    e = Math.max(e, lng);
    s = Math.min(s, lat);
    n = Math.max(n, lat);
  }
  return [w, s, e, n];
}

/** Map-safe hex palette (MapLibre can't read CSS vars). */
export const MAP = {
  teal: "#33D6C6",
  amber: "#E3B341",
  violet: "#A99BF2",
  rose: "#E98AA0",
  blue: "#73A9E6",
  green: "#73CF93",
  point: "#33D6C6",
  competitor: "#E98AA0",
  // dark → bright teal sequential ramp for choropleth
  ramp: ["#163f3a", "#1c574f", "#247a6c", "#2da08d", "#39ccb8"],
};
