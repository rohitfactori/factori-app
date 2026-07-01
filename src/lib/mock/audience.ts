import { scatter, isoPolygon, type LngLat } from "./geo";
import { seeded } from "@/lib/format";

const CA: LngLat = [-119.4179, 36.7783];
const CA_BASE = 39_500_000;

export type RuleGroup = "Geography" | "Demographics" | "Behavior" | "Device";
export type Rule = {
  id: string;
  group: RuleGroup;
  label: string;
  mult: number;
  locked?: boolean;
};

export const RULES: Rule[] = [
  { id: "geo", group: "Geography", label: "Located in California", mult: 1, locked: true },
  { id: "income", group: "Demographics", label: "Household income > $100k", mult: 0.34 },
  { id: "age", group: "Demographics", label: "Age 25–44", mult: 0.46 },
  { id: "fitness", group: "Behavior", label: "Visited fitness clubs 3+ / month", mult: 0.18 },
  { id: "dining", group: "Behavior", label: "Dines out 2+ / week", mult: 0.55 },
  { id: "ctv", group: "Device", label: "CTV-reachable household", mult: 0.68 },
];

export function estimateSize(enabled: Set<string>): number {
  let size = CA_BASE;
  for (const r of RULES) if (r.locked || enabled.has(r.id)) size *= r.mult;
  return Math.round(size);
}

const CA_AREAS = ["Bay Area", "Silicon Valley", "LA Metro", "Orange County", "San Diego", "Sacramento", "Inland Empire", "Central Valley", "Santa Barbara", "Marin", "Long Beach", "Pasadena", "Fresno", "San Jose"];

export function buildGeos() {
  const rng = seeded(909);
  return scatter(CA, 14, 250, rng)
    .map((c, i) => ({
      id: `g${i}`,
      name: CA_AREAS[i % CA_AREAS.length],
      polygon: isoPolygon(c, 16 + rng() * 12, rng),
      value: Math.round(18_000 + rng() * 182_000),
    }))
    .sort((a, b) => b.value - a.value);
}

export const PROFILE = {
  age: [
    { label: "18–24", v: 8 },
    { label: "25–34", v: 34 },
    { label: "35–44", v: 31 },
    { label: "45–54", v: 16 },
    { label: "55+", v: 11 },
  ],
  income: [
    { label: "$100–150k", v: 42 },
    { label: "$150–200k", v: 33 },
    { label: "$200k+", v: 25 },
  ],
  device: [
    { label: "Mobile", v: 54 },
    { label: "CTV", v: 31 },
    { label: "Desktop", v: 15 },
  ],
};

export const DESTINATIONS = [
  { name: "CTV — Roku & Samsung", reach: 68 },
  { name: "The Trade Desk", reach: 81 },
  { name: "Meta Advantage+", reach: 74 },
  { name: "Google DV360", reach: 79 },
];

export const AUDIENCE = {
  name: "High-income gym-goers — CA",
  base: CA_BASE,
};
