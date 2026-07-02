import { scatter, type LngLat } from "./geo";
import { seeded } from "@/lib/format";

const LA: LngLat = [-118.2437, 34.0522];

export type PanelFormat = "Billboard" | "Digital" | "Transit" | "Street";
export type Panel = {
  id: string;
  name: string;
  lng: number;
  lat: number;
  format: PanelFormat;
  impressions: number; // per 4-week
  reach: number;
  frequency: number;
  index: number; // audience index vs target (100 = avg)
  price: number; // per 4-week
  illuminated: boolean;
};

const AREAS = ["Downtown", "Hollywood", "Santa Monica", "Culver City", "Pasadena", "Venice", "Westwood", "Silver Lake", "Burbank", "Long Beach", "Glendale", "Mid-Wilshire"];
const SPOTS = ["Sunset Blvd", "Wilshire Blvd", "I-10 @ La Brea", "US-101 @ Vine", "Lincoln Blvd", "Figueroa St", "Melrose Ave", "Ventura Blvd", "Olympic Blvd", "Sepulveda Blvd"];
const FORMATS: PanelFormat[] = ["Billboard", "Digital", "Transit", "Street"];

const pick = <T,>(a: T[], rng: () => number) => a[Math.floor(rng() * a.length)];

export function buildPanels(): Panel[] {
  const rng = seeded(7321);
  return scatter(LA, 14, 24, rng)
    .map((p, i) => {
      const index = Math.round(95 + rng() * 165);
      const impressions = Math.round(220_000 + (index / 260) * 2_200_000);
      const frequency = +(2.4 + rng() * 4.6).toFixed(1);
      const reach = Math.round(impressions / frequency);
      const format = pick(FORMATS, rng);
      const price = Math.round((impressions / 1000) * (format === "Digital" ? 9 : 6) + rng() * 1500);
      return {
        id: `pn${i}`,
        name: `${pick(AREAS, rng)} · ${pick(SPOTS, rng)}`,
        lng: p[0],
        lat: p[1],
        format,
        impressions,
        reach,
        frequency,
        index,
        price,
        illuminated: rng() > 0.35,
      };
    })
    .sort((a, b) => b.index - a.index);
}

export const OOH_CAMPAIGN = {
  name: "Q3 Brand Launch — LA",
  audience: "High-income commuters · 25–44",
  budget: 120_000,
  market: "Los Angeles, CA",
};

export const OOH_UNIVERSE = 3_200_000;

export const OOH_COMPOSITION = [
  { label: "High-income commuters", value: 42, color: "#33D6C6" },
  { label: "Affluent millennials", value: 31, color: "#A99BF2" },
  { label: "Families w/ kids", value: 17, color: "#E3B341" },
  { label: "Other", value: 10, color: "#73A9E6" },
];
