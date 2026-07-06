import type { PoiCategory, SavedView } from "./types";

/** Hand-curated spatial skeleton for the LA demo snapshot. Anchors carry
 *  per-field weights the generator composes into every metric — this is
 *  what makes synthetic data read as a real city. */
export type Anchor = {
  id: string;
  label: string;
  lng: number;
  lat: number;
  r: number;         // kernel radius, km
  activity: number;  // drives visits / footfall / poi density
  income: number;    // drives HHI / luxury
  nightlife: number; // drives evening share
};

export type Corridor = {
  id: string;
  pts: [number, number][];
  wKm: number;
  activity: number;
};

export const LA = {
  id: "la",
  label: "Los Angeles",
  bounds: [-118.95, 33.63, -117.95, 34.4] as [number, number, number, number], // [w,s,e,n]
  camera: { center: [-118.33, 34.02] as [number, number], zoom: 9.7 },
  months: ["Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26"],
  segments: [
    { id: "au_hip", label: "High-income parents" },
    { id: "au_trv", label: "Frequent travelers" },
    { id: "au_auto", label: "Auto intenders" },
    { id: "au_fit", label: "Fitness enthusiasts" },
    { id: "au_mov", label: "New movers" },
    { id: "au_lux", label: "Luxury shoppers" },
  ],
  spendCats: [
    { id: "sp_food", label: "Food & dining" },
    { id: "sp_retail", label: "Retail" },
    { id: "sp_grocery", label: "Grocery" },
    { id: "sp_fitness", label: "Fitness" },
    { id: "sp_fuel", label: "Fuel & auto" },
  ],
  poiCats: [
    { id: "food", label: "Food & dining" },
    { id: "retail", label: "Retail" },
    { id: "grocery", label: "Grocery" },
    { id: "health", label: "Health" },
    { id: "fin", label: "Financial" },
  ] as { id: PoiCategory; label: string }[],
  anchors: [
    { id: "dtla", label: "Downtown LA", lng: -118.249, lat: 34.048, r: 5.5, activity: 1.0, income: 0.45, nightlife: 0.9 },
    { id: "ktown", label: "Koreatown", lng: -118.3, lat: 34.061, r: 3.2, activity: 0.85, income: 0.4, nightlife: 1.0 },
    { id: "hlwd", label: "Hollywood", lng: -118.328, lat: 34.101, r: 4.0, activity: 0.9, income: 0.5, nightlife: 1.0 },
    { id: "weho", label: "West Hollywood", lng: -118.361, lat: 34.09, r: 2.8, activity: 0.8, income: 0.7, nightlife: 0.95 },
    { id: "bh", label: "Beverly Hills", lng: -118.4, lat: 34.073, r: 3.4, activity: 0.7, income: 1.0, nightlife: 0.5 },
    { id: "cc", label: "Century City", lng: -118.417, lat: 34.058, r: 2.4, activity: 0.75, income: 0.9, nightlife: 0.35 },
    { id: "sm", label: "Santa Monica", lng: -118.492, lat: 34.017, r: 3.8, activity: 0.9, income: 0.85, nightlife: 0.75 },
    { id: "venice", label: "Venice", lng: -118.472, lat: 33.99, r: 2.6, activity: 0.75, income: 0.7, nightlife: 0.8 },
    { id: "culver", label: "Culver City", lng: -118.396, lat: 34.021, r: 3.0, activity: 0.8, income: 0.7, nightlife: 0.6 },
    { id: "lax", label: "LAX / El Segundo", lng: -118.402, lat: 33.936, r: 4.2, activity: 0.85, income: 0.55, nightlife: 0.3 },
    { id: "sofi", label: "Inglewood / SoFi", lng: -118.339, lat: 33.953, r: 3.4, activity: 0.75, income: 0.4, nightlife: 0.6 },
    { id: "pas", label: "Pasadena", lng: -118.144, lat: 34.147, r: 4.0, activity: 0.8, income: 0.75, nightlife: 0.55 },
    { id: "glen", label: "Glendale", lng: -118.255, lat: 34.146, r: 3.6, activity: 0.75, income: 0.65, nightlife: 0.5 },
    { id: "burb", label: "Burbank", lng: -118.309, lat: 34.181, r: 3.4, activity: 0.7, income: 0.6, nightlife: 0.45 },
    { id: "shox", label: "Sherman Oaks", lng: -118.451, lat: 34.151, r: 3.4, activity: 0.65, income: 0.7, nightlife: 0.5 },
    { id: "noho", label: "North Hollywood", lng: -118.377, lat: 34.172, r: 3.0, activity: 0.65, income: 0.5, nightlife: 0.65 },
    { id: "vny", label: "Van Nuys", lng: -118.449, lat: 34.187, r: 3.6, activity: 0.6, income: 0.42, nightlife: 0.4 },
    { id: "torr", label: "Torrance", lng: -118.34, lat: 33.836, r: 4.0, activity: 0.65, income: 0.62, nightlife: 0.35 },
    { id: "lb", label: "Long Beach", lng: -118.193, lat: 33.77, r: 4.6, activity: 0.8, income: 0.5, nightlife: 0.7 },
    { id: "elmonte", label: "El Monte", lng: -118.028, lat: 34.069, r: 3.4, activity: 0.55, income: 0.35, nightlife: 0.3 },
    { id: "whit", label: "Whittier", lng: -118.033, lat: 33.979, r: 3.2, activity: 0.55, income: 0.5, nightlife: 0.35 },
    { id: "comp", label: "Compton", lng: -118.22, lat: 33.896, r: 3.2, activity: 0.55, income: 0.3, nightlife: 0.35 },
  ] as Anchor[],
  corridors: [
    { id: "wilshire", pts: [[-118.492, 34.021], [-118.4, 34.062], [-118.3, 34.062], [-118.249, 34.05]], wKm: 1.4, activity: 0.7 },
    { id: "sunset", pts: [[-118.47, 34.078], [-118.361, 34.094], [-118.328, 34.098], [-118.266, 34.077]], wKm: 1.2, activity: 0.6 },
    { id: "ventura", pts: [[-118.605, 34.168], [-118.451, 34.152], [-118.377, 34.156]], wKm: 1.2, activity: 0.55 },
    { id: "i405", pts: [[-118.469, 34.285], [-118.449, 34.18], [-118.43, 34.05], [-118.396, 33.93], [-118.35, 33.82]], wKm: 1.6, activity: 0.45 },
    { id: "i10", pts: [[-118.49, 34.02], [-118.35, 34.03], [-118.249, 34.04], [-118.03, 34.065]], wKm: 1.6, activity: 0.5 },
    { id: "i110", pts: [[-118.27, 34.05], [-118.28, 33.94], [-118.22, 33.8], [-118.2, 33.77]], wKm: 1.5, activity: 0.45 },
  ] as Corridor[],
  views: [
    {
      id: "v-affluence",
      name: "Westside affluence vs footfall",
      description: "Median income choropleth with visits — see money and movement disagree.",
      layers: [
        { datasetId: "demographics-income", metricId: "dm_hhi", opacity: 0.68, visible: true },
        { datasetId: "movement-graph", metricId: "mv_visits", variant: "all", opacity: 0.5, visible: true },
      ],
      camera: { center: [-118.44, 34.04], zoom: 11.2 },
    },
    {
      id: "v-qsr",
      name: "QSR corridor scan — Downtown",
      description: "12-month QSR visitation with POIs overlaid.",
      layers: [
        { datasetId: "foot-traffic-trends", metricId: "tr", variant: "qsr", opacity: 0.7, visible: true },
        { datasetId: "places-poi", metricId: "poi_count", variant: "points", poiCat: "food", opacity: 0.9, visible: true },
      ],
      camera: { center: [-118.26, 34.05], zoom: 12.1 },
      timeIndex: 11,
    },
    {
      id: "v-spend",
      name: "Retail spend hotspots",
      description: "Where retail spend over-indexes vs metro.",
      layers: [
        { datasetId: "consumer-spend", metricId: "sp_retail", opacity: 0.72, visible: true },
        { datasetId: "places-poi", metricId: "poi_count", variant: "points", poiCat: "retail", opacity: 0.85, visible: true },
      ],
      camera: { center: [-118.35, 34.06], zoom: 10.6 },
    },
    {
      id: "v-recovery",
      name: "12 months of movement",
      description: "Press play — a year of visitation index across the metro.",
      layers: [{ datasetId: "foot-traffic-trends", metricId: "tr", variant: "all", opacity: 0.75, visible: true }],
      camera: { center: [-118.33, 34.02], zoom: 9.7 },
      timeIndex: 0,
      playing: true,
    },
  ] as SavedView[],
};

export type MarketMeta = typeof LA;
