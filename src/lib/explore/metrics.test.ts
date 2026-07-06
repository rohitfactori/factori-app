import { describe, expect, it } from "vitest";
import { DATASETS } from "@/lib/mock/platform";
import type { ExploreLayer } from "@/lib/snapshot/types";
import { colorExpr, domainFor, EXPLORABLE, LAYER_CONFIGS, METRIC_BY_ID, METRICS, rampFor, readValue, valueExpr } from "./metrics";

const layer = (over: Partial<ExploreLayer>): ExploreLayer => ({
  id: "xl1",
  datasetId: "movement-graph",
  metricId: "mv_visits",
  opacity: 0.7,
  visible: true,
  ...over,
});

describe("metric registry", () => {
  it("metric ids are unique", () => {
    expect(new Set(METRICS.map((m) => m.id)).size).toBe(METRICS.length);
  });

  it("every layer config maps to a real catalog dataset", () => {
    for (const id of Object.keys(LAYER_CONFIGS)) {
      expect(DATASETS.some((d) => d.id === id)).toBe(true);
    }
    expect(EXPLORABLE).toHaveLength(6);
  });

  it("every default metric belongs to its config", () => {
    for (const [ds, cfg] of Object.entries(LAYER_CONFIGS)) {
      expect(cfg.metricIds).toContain(cfg.defaultMetric);
      for (const m of cfg.metricIds) {
        expect(METRIC_BY_ID[m], `metric ${m} of ${ds}`).toBeDefined();
      }
    }
  });
});

describe("expressions", () => {
  it("temporal layer reads via at-index with variant prop", () => {
    const l = layer({ datasetId: "foot-traffic-trends", metricId: "tr", variant: "qsr" });
    expect(valueExpr(l, 5)).toEqual(["at", 5, ["get", "tr_qsr"]]);
    expect(valueExpr(layer({ datasetId: "foot-traffic-trends", metricId: "tr", variant: "all" }), 2)).toEqual([
      "at", 2, ["get", "tr"],
    ]);
  });

  it("movement day-part multiplies visits by share", () => {
    expect(valueExpr(layer({ variant: "eve" }), 0)).toEqual(["*", ["get", "mv_visits"], ["get", "mv_eve"]]);
    expect(domainFor(layer({ variant: "eve" }))[1]).toBeCloseTo(60000 * 0.45);
  });

  it("poi density respects category filter", () => {
    const l = layer({ datasetId: "places-poi", metricId: "poi_count", variant: "density", poiCat: "food" });
    expect(valueExpr(l, 0)).toEqual(["get", "poi_food"]);
    expect(domainFor(l)).toEqual([0, 60]);
  });

  it("colorExpr interpolates 5 ramp stops over the domain", () => {
    const l = layer({});
    const e = colorExpr(l, 0) as unknown[];
    expect(e).toHaveLength(13); // op, lerp, value, 5×(stop,color)
    expect(e[e.length - 1]).toBe(rampFor(l)[4]);
    expect(e[3]).toBe(0);
    expect(e[e.length - 2]).toBe(60000);
  });
});

describe("readValue mirrors valueExpr for tooltips/panel", () => {
  const props = {
    mv_visits: 10000, mv_eve: 0.3, mv_day: 0.7,
    tr_qsr: [100, 110, 120], tr: [90, 95, 99],
    poi_food: 7, poi_count: 20, dm_hhi: 88000,
  } as never;

  it("plain, daypart, temporal and poiCat reads", () => {
    expect(readValue(layer({}), props, 0)).toBe(10000);
    expect(readValue(layer({ variant: "eve" }), props, 0)).toBe(3000);
    expect(readValue(layer({ datasetId: "foot-traffic-trends", metricId: "tr", variant: "qsr" }), props, 2)).toBe(120);
    expect(readValue(layer({ datasetId: "places-poi", metricId: "poi_count", poiCat: "food" }), props, 0)).toBe(7);
    expect(readValue(layer({ datasetId: "demographics-income", metricId: "dm_hhi" }), props, 0)).toBe(88000);
  });
});
