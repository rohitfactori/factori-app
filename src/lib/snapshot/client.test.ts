import { describe, expect, it } from "vitest";
import type { HexFC, HexProps, PoiFC } from "./types";
import { __resetSnapshotForTests, loadSnapshot } from "./client";

const hex = (h3: string, over: Partial<HexProps>): GeoJSON.Feature<GeoJSON.Polygon, HexProps> => ({
  type: "Feature",
  properties: {
    h3,
    label: "Testville",
    mv_visits: 1000, mv_dwell: 20, mv_day: 0.7, mv_eve: 0.3,
    tr: Array(12).fill(100), tr_qsr: Array(12).fill(100), tr_retail: Array(12).fill(100),
    tr_grocery: Array(12).fill(100), tr_fitness: Array(12).fill(100),
    dm_hhi: 80000, dm_pop: 3000, dm_age: 36,
    dm_age_mix: [0.2, 0.2, 0.2, 0.2, 0.2], dm_inc_mix: [0.25, 0.25, 0.25, 0.25],
    sp_food: 100, sp_retail: 100, sp_grocery: 100, sp_fitness: 100, sp_fuel: 100,
    au_hip: 10, au_trv: 10, au_auto: 10, au_fit: 10, au_mov: 10, au_lux: 10,
    poi_count: 5, poi_food: 2, poi_retail: 1, poi_grocery: 1, poi_health: 1, poi_fin: 0,
    poi_top: ["Starbucks"], bl_top: ["Target"],
    ...over,
  },
  geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1], [0, 0]]] },
});

function fixtureFetcher() {
  let calls = 0;
  const r8: HexFC = {
    type: "FeatureCollection",
    features: [hex("88aa", { mv_visits: 1000, dm_hhi: 60000 }), hex("88bb", { mv_visits: 3000, dm_hhi: 120000, label: "Richton" })],
  };
  const r7: HexFC = { type: "FeatureCollection", features: [hex("87cc", {})] };
  const poi: PoiFC = {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      properties: { id: "p1", name: "Starbucks · Testville", brand: "Starbucks", category: "food", h3: "88aa" },
      geometry: { type: "Point", coordinates: [-118.3, 34.0] },
    }],
  };
  const fetcher = (async (url: string | URL | Request) => {
    calls++;
    const u = String(url);
    const body = u.includes("r7") ? r7 : u.includes("r8") ? r8 : poi;
    return { ok: true, json: async () => body } as Response;
  }) as typeof fetch;
  return { fetcher, calls: () => calls };
}

describe("snapshot client", () => {
  it("loads, indexes and averages", async () => {
    __resetSnapshotForTests();
    const { fetcher } = fixtureFetcher();
    const snap = await loadSnapshot(fetcher);
    expect(snap.r8.features).toHaveLength(2);
    expect(snap.byId.size).toBe(3); // r8 + r7
    expect(snap.avg.mv_visits).toBeCloseTo(2000);
    expect(snap.topHex("dm_hhi")?.label).toBe("Richton");
  });

  it("memoizes — fetcher runs once", async () => {
    __resetSnapshotForTests();
    const { fetcher, calls } = fixtureFetcher();
    await loadSnapshot(fetcher);
    await loadSnapshot(fetcher);
    expect(calls()).toBe(3); // three files, one pass
  });
});
