import { scatter, isoPolygon, type LngLat } from "./geo";
import { seeded } from "@/lib/format";

const AUSTIN: LngLat = [-97.7431, 30.2672];

export type SubScores = {
  demographics: number;
  footfall: number;
  competition: number;
  accessibility: number;
  cannibalization: number;
};
export type Site = {
  id: string;
  name: string;
  lng: number;
  lat: number;
  kind: "candidate" | "existing";
  score: number;
  sub: SubScores;
  revenue: number;
  visits: number;
  address: string;
  rent: number;
  tradeArea: LngLat[];
};

export const SCORE_WEIGHTS: { key: keyof SubScores; label: string; weight: number }[] = [
  { key: "demographics", label: "Demographic fit", weight: 0.3 },
  { key: "footfall", label: "Footfall potential", weight: 0.28 },
  { key: "competition", label: "Competition gap", weight: 0.18 },
  { key: "accessibility", label: "Accessibility", weight: 0.14 },
  { key: "cannibalization", label: "Low cannibalization", weight: 0.1 },
];

const STREETS = ["Congress Ave", "Lamar Blvd", "Burnet Rd", "S 1st St", "E 6th St", "Guadalupe St", "Riverside Dr", "Manor Rd", "Airport Blvd", "W 35th St"];
const AREAS = ["Downtown", "South Congress", "Mueller", "The Domain", "East Austin", "Zilker", "Hyde Park", "Westlake"];

const r = (rng: () => number, lo: number, hi: number) => Math.round(lo + rng() * (hi - lo));
const pick = <T,>(a: T[], rng: () => number) => a[Math.floor(rng() * a.length)];

export function buildSites(): Site[] {
  const rng = seeded(4242);

  const existing: Site[] = scatter(AUSTIN, 5, 9, rng).map((p, i) => ({
    id: `ex${i}`,
    name: `Store #${101 + i}`,
    lng: p[0],
    lat: p[1],
    kind: "existing",
    score: 0,
    sub: { demographics: 0, footfall: 0, competition: 0, accessibility: 0, cannibalization: 0 },
    revenue: Math.round(1.2e6 + rng() * 1.9e6),
    visits: Math.round(8000 + rng() * 22000),
    address: `${100 + Math.floor(rng() * 899)} ${pick(STREETS, rng)}`,
    rent: r(rng, 28, 68),
    tradeArea: isoPolygon(p, 2.1, rng),
  }));

  const candidates: Site[] = scatter(AUSTIN, 8, 12, rng)
    .map((p, i) => {
      const sub: SubScores = {
        demographics: r(rng, 46, 98),
        footfall: r(rng, 40, 96),
        competition: r(rng, 35, 95),
        accessibility: r(rng, 52, 95),
        cannibalization: r(rng, 42, 96),
      };
      const score = Math.round(
        SCORE_WEIGHTS.reduce((s, w) => s + sub[w.key] * w.weight, 0)
      );
      return {
        id: `c${i}`,
        name: `${pick(AREAS, rng)} · ${pick(STREETS, rng)}`,
        lng: p[0],
        lat: p[1],
        kind: "candidate" as const,
        score,
        sub,
        revenue: Math.round(1.3e6 + (score / 100) * 2.6e6),
        visits: Math.round(9000 + (score / 100) * 27000),
        address: `${100 + Math.floor(rng() * 899)} ${pick(STREETS, rng)}`,
        rent: r(rng, 30, 76),
        tradeArea: isoPolygon(p, 2.6, rng),
      };
    })
    .sort((a, b) => b.score - a.score);

  return [...existing, ...candidates];
}

export const PROJECT = {
  name: "Q3 Expansion — Austin",
  brand: "Premium grocery · high-income families",
  metro: "Austin, TX",
};

export function siteDemographics(site: Site) {
  const rng = seeded((Math.abs(Math.round(site.lng * 1000 + site.lat * 900)) % 9973) + site.id.length);
  const population = Math.round(18000 + rng() * 92000);
  const income = Math.round(58 + rng() * 142);
  const age = Math.round(30 + rng() * 16);
  const daytime = Math.round(population * (1.1 + rng() * 0.9));
  const households = Math.round(population / 2.4);
  const growth = +(rng() * 8 - 1.5).toFixed(1);
  const ageBands = [
    { label: "<18", value: 14 + Math.round(rng() * 10) },
    { label: "18–34", value: 24 + Math.round(rng() * 14) },
    { label: "35–54", value: 22 + Math.round(rng() * 12) },
    { label: "55+", value: 16 + Math.round(rng() * 12) },
  ];
  return { population, income, age, daytime, households, growth, ageBands };
}
