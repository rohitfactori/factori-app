/** Metric registry: every layer the explorer can render, its styling domain,
 *  ramp and formatting, plus the MapLibre paint-expression builders. Metric
 *  ids double as hex property names — the swap-to-real-data contract. */
import { fmtCompact, fmtUSDCompact } from "@/lib/format";
import type { ExploreLayer, HexProps, PoiCategory } from "@/lib/snapshot/types";

export const RAMPS = {
  teal: ["#163f3a", "#1c574f", "#247a6c", "#2da08d", "#39ccb8"],
  amber: ["#3d3117", "#5a481d", "#7d6323", "#a8842c", "#d6a838"],
  violet: ["#2b2745", "#3d3763", "#554d8a", "#6f65b3", "#8d82dd"],
  blue: ["#1c2e42", "#28425e", "#375c82", "#4a7aa9", "#5f9bd4"],
  rose: ["#40252c", "#5e333e", "#824453", "#a85669", "#d06c82"],
  green: ["#1e3a2a", "#2a533c", "#387052", "#48906a", "#59b184"],
} as const;

/** map-safe POI category colors (MapLibre can't read CSS vars) */
export const POI_COLORS: Record<PoiCategory, string> = {
  food: "#33D6C6",
  retail: "#A99BF2",
  grocery: "#73CF93",
  health: "#E3B341",
  fin: "#73A9E6",
};

export type MetricDef = {
  id: string;
  datasetId: string;
  label: string;
  domain: [number, number];
  ramp: readonly string[];
  temporal?: boolean;
  /** long-tail metrics get compressed stop spacing so hotspots don't wash out */
  curve?: "longtail";
  fmt: (v: number) => string;
};

const idx = (v: number) => `${Math.round(v)}`;
const pct = (v: number) => `${v.toFixed(0)}%`;

export const METRICS: MetricDef[] = [
  { id: "mv_visits", datasetId: "movement-graph", label: "Visits / month", domain: [0, 60000], ramp: RAMPS.teal, curve: "longtail", fmt: fmtCompact },
  { id: "mv_dwell", datasetId: "movement-graph", label: "Median dwell", domain: [6, 45], ramp: RAMPS.teal, fmt: (v) => `${Math.round(v)}m` },
  { id: "tr", datasetId: "foot-traffic-trends", label: "Visitation index", domain: [60, 160], ramp: RAMPS.amber, temporal: true, fmt: idx },
  { id: "dm_hhi", datasetId: "demographics-income", label: "Median HH income", domain: [35000, 220000], ramp: RAMPS.violet, fmt: fmtUSDCompact },
  { id: "dm_pop", datasetId: "demographics-income", label: "Population", domain: [0, 9000], ramp: RAMPS.violet, curve: "longtail", fmt: fmtCompact },
  { id: "dm_age", datasetId: "demographics-income", label: "Median age", domain: [26, 52], ramp: RAMPS.violet, fmt: idx },
  { id: "sp_food", datasetId: "consumer-spend", label: "Spend index — food & dining", domain: [60, 160], ramp: RAMPS.rose, fmt: idx },
  { id: "sp_retail", datasetId: "consumer-spend", label: "Spend index — retail", domain: [60, 160], ramp: RAMPS.rose, fmt: idx },
  { id: "sp_grocery", datasetId: "consumer-spend", label: "Spend index — grocery", domain: [60, 160], ramp: RAMPS.rose, fmt: idx },
  { id: "sp_fitness", datasetId: "consumer-spend", label: "Spend index — fitness", domain: [60, 160], ramp: RAMPS.rose, fmt: idx },
  { id: "sp_fuel", datasetId: "consumer-spend", label: "Spend index — fuel & auto", domain: [60, 160], ramp: RAMPS.rose, fmt: idx },
  { id: "au_hip", datasetId: "people-audience", label: "High-income parents", domain: [0, 40], ramp: RAMPS.blue, fmt: pct },
  { id: "au_trv", datasetId: "people-audience", label: "Frequent travelers", domain: [0, 40], ramp: RAMPS.blue, fmt: pct },
  { id: "au_auto", datasetId: "people-audience", label: "Auto intenders", domain: [0, 40], ramp: RAMPS.blue, fmt: pct },
  { id: "au_fit", datasetId: "people-audience", label: "Fitness enthusiasts", domain: [0, 40], ramp: RAMPS.blue, fmt: pct },
  { id: "au_mov", datasetId: "people-audience", label: "New movers", domain: [0, 40], ramp: RAMPS.blue, fmt: pct },
  { id: "au_lux", datasetId: "people-audience", label: "Luxury shoppers", domain: [0, 40], ramp: RAMPS.blue, fmt: pct },
  { id: "poi_count", datasetId: "places-poi", label: "POI density", domain: [0, 120], ramp: RAMPS.green, curve: "longtail", fmt: idx },
];

export const METRIC_BY_ID: Record<string, MetricDef> = Object.fromEntries(METRICS.map((m) => [m.id, m]));

export type LayerConfig = {
  kind: "hex" | "poi";
  metricIds: string[];
  metricLabel: string;
  variants?: { id: string; label: string }[];
  variantLabel?: string;
  defaultMetric: string;
  defaultVariant?: string;
};

export const LAYER_CONFIGS: Record<string, LayerConfig> = {
  "movement-graph": {
    kind: "hex",
    metricIds: ["mv_visits", "mv_dwell"],
    metricLabel: "Metric",
    variants: [
      { id: "all", label: "All day" },
      { id: "day", label: "Daytime" },
      { id: "eve", label: "Evening" },
    ],
    variantLabel: "Day-part",
    defaultMetric: "mv_visits",
    defaultVariant: "all",
  },
  "foot-traffic-trends": {
    kind: "hex",
    metricIds: ["tr"],
    metricLabel: "Metric",
    variants: [
      { id: "all", label: "All categories" },
      { id: "qsr", label: "QSR" },
      { id: "retail", label: "Retail" },
      { id: "grocery", label: "Grocery" },
      { id: "fitness", label: "Fitness" },
    ],
    variantLabel: "Category",
    defaultMetric: "tr",
    defaultVariant: "all",
  },
  "places-poi": {
    kind: "poi",
    metricIds: ["poi_count"],
    metricLabel: "Metric",
    variants: [
      { id: "points", label: "Points" },
      { id: "density", label: "Density" },
    ],
    variantLabel: "Render",
    defaultMetric: "poi_count",
    defaultVariant: "points",
  },
  "people-audience": {
    kind: "hex",
    metricIds: ["au_hip", "au_trv", "au_auto", "au_fit", "au_mov", "au_lux"],
    metricLabel: "Segment",
    defaultMetric: "au_hip",
  },
  "demographics-income": {
    kind: "hex",
    metricIds: ["dm_hhi", "dm_pop", "dm_age"],
    metricLabel: "Metric",
    defaultMetric: "dm_hhi",
  },
  "consumer-spend": {
    kind: "hex",
    metricIds: ["sp_food", "sp_retail", "sp_grocery", "sp_fitness", "sp_fuel"],
    metricLabel: "Category",
    defaultMetric: "sp_retail",
  },
};

export const EXPLORABLE = [
  "movement-graph",
  "foot-traffic-trends",
  "places-poi",
  "people-audience",
  "demographics-income",
  "consumer-spend",
];

/** does this layer paint hex fills (vs POI circles)? */
export function rendersHex(layer: ExploreLayer) {
  const cfg = LAYER_CONFIGS[layer.datasetId];
  if (!cfg) return false;
  if (cfg.kind === "hex") return true;
  return layer.variant === "density";
}

export function isTemporal(layer: ExploreLayer) {
  return METRIC_BY_ID[layer.metricId]?.temporal === true;
}

function trProp(layer: ExploreLayer) {
  return layer.variant && layer.variant !== "all" ? `tr_${layer.variant}` : "tr";
}

function poiProp(layer: ExploreLayer) {
  return layer.poiCat && layer.poiCat !== "all" ? `poi_${layer.poiCat}` : "poi_count";
}

export function valueExpr(layer: ExploreLayer, timeIndex: number): unknown {
  const m = METRIC_BY_ID[layer.metricId];
  if (m.temporal) return ["at", timeIndex, ["get", trProp(layer)]];
  if (layer.datasetId === "movement-graph" && (layer.variant === "day" || layer.variant === "eve"))
    return ["*", ["get", "mv_visits"], ["get", layer.variant === "day" ? "mv_day" : "mv_eve"]];
  if (layer.metricId === "poi_count" && layer.poiCat && layer.poiCat !== "all") return ["get", poiProp(layer)];
  return ["get", m.id];
}

export function domainFor(layer: ExploreLayer): [number, number] {
  const m = METRIC_BY_ID[layer.metricId];
  if (layer.datasetId === "movement-graph" && layer.variant === "day") return [0, m.domain[1] * 0.65];
  if (layer.datasetId === "movement-graph" && layer.variant === "eve") return [0, m.domain[1] * 0.45];
  if (layer.metricId === "poi_count" && layer.poiCat && layer.poiCat !== "all") return [0, 60];
  return m.domain;
}

export function rampFor(layer: ExploreLayer): readonly string[] {
  return METRIC_BY_ID[layer.metricId].ramp;
}

export const LINEAR_STOPS = [0, 0.25, 0.5, 0.75, 1];
export const LONGTAIL_STOPS = [0, 0.06, 0.18, 0.45, 1]; // most cells sit low; brights reserved for true hotspots

export function stopsFor(layer: ExploreLayer): number[] {
  return METRIC_BY_ID[layer.metricId].curve === "longtail" ? LONGTAIL_STOPS : LINEAR_STOPS;
}

export function colorExpr(layer: ExploreLayer, timeIndex: number): unknown {
  const [lo, hi] = domainFor(layer);
  const ramp = rampFor(layer);
  const pos = stopsFor(layer);
  const stops: unknown[] = [];
  for (let i = 0; i < 5; i++) stops.push(lo + (hi - lo) * pos[i], ramp[i]);
  return ["interpolate", ["linear"], valueExpr(layer, timeIndex), ...stops];
}

/** JS mirror of valueExpr — tooltips and panel read the same number the map paints */
export function readValue(layer: ExploreLayer, props: HexProps, timeIndex: number): number {
  const m = METRIC_BY_ID[layer.metricId];
  const rec = props as unknown as Record<string, number | number[]>;
  if (m.temporal) return (rec[trProp(layer)] as number[])[timeIndex];
  if (layer.datasetId === "movement-graph" && (layer.variant === "day" || layer.variant === "eve"))
    return (rec.mv_visits as number) * (rec[layer.variant === "day" ? "mv_day" : "mv_eve"] as number);
  if (layer.metricId === "poi_count" && layer.poiCat && layer.poiCat !== "all") return rec[poiProp(layer)] as number;
  return rec[m.id] as number;
}

export function formatMetric(layer: ExploreLayer, v: number) {
  return METRIC_BY_ID[layer.metricId].fmt(v);
}
