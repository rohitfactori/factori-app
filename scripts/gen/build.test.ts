import { describe, expect, it } from "vitest";
import { buildSnapshot } from "./build";
import { LA } from "@/lib/snapshot/la-meta";

describe("buildSnapshot (small bbox around DTLA)", () => {
  const out = buildSnapshot(LA, { bounds: [-118.3, 34.0, -118.2, 34.09] });

  it("produces r7, r8 and poi collections", () => {
    expect(out.r8.features.length).toBeGreaterThan(30);
    expect(out.r7.features.length).toBeGreaterThan(1);
    expect(out.poi.features.length).toBeGreaterThan(50);
  });

  it("hex props are complete and in range", () => {
    for (const f of out.r8.features.slice(0, 20)) {
      const p = f.properties;
      expect(p.h3).toMatch(/^88/); // res 8 ids start with 88
      expect(p.tr).toHaveLength(12);
      expect(p.tr_qsr).toHaveLength(12);
      expect(p.mv_visits).toBeGreaterThanOrEqual(0);
      expect(p.mv_visits).toBeLessThanOrEqual(60000);
      expect(p.dm_hhi).toBeGreaterThanOrEqual(35000);
      expect(p.dm_hhi).toBeLessThanOrEqual(220000);
      expect(p.dm_age_mix.reduce((s: number, x: number) => s + x, 0)).toBeCloseTo(1, 1);
      expect(p.dm_inc_mix.reduce((s: number, x: number) => s + x, 0)).toBeCloseTo(1, 1);
      expect(p.poi_top.length).toBeLessThanOrEqual(5);
      expect(p.bl_top.length).toBeGreaterThan(0);
      expect(p.label.length).toBeGreaterThan(0);
    }
  });

  it("poi props carry their containing r8 cell", () => {
    for (const f of out.poi.features.slice(0, 10)) {
      expect(f.properties.h3).toMatch(/^88/);
      expect(f.properties.brand.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic", () => {
    const again = buildSnapshot(LA, { bounds: [-118.3, 34.0, -118.2, 34.09] });
    expect(JSON.stringify(again.r8.features[0])).toBe(JSON.stringify(out.r8.features[0]));
    expect(again.poi.features.length).toBe(out.poi.features.length);
  });
});
