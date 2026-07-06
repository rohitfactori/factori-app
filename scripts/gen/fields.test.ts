import { describe, expect, it } from "vitest";
import { anchorField, clamp, distKm, distToPolylineKm, kernel, noise2d } from "./fields";
import { isExcluded } from "./la-mask";

describe("fields", () => {
  it("distKm: SM pier → DTLA ≈ 23km", () => {
    const d = distKm([-118.497, 34.008], [-118.249, 34.048]);
    expect(d).toBeGreaterThan(20);
    expect(d).toBeLessThan(26);
  });

  it("kernel decays monotonically and is 1 at center", () => {
    expect(kernel(0, 4)).toBeCloseTo(1, 5);
    expect(kernel(2, 4)).toBeGreaterThan(kernel(4, 4));
    expect(kernel(12, 4)).toBeLessThan(0.02);
  });

  it("distToPolylineKm: point on segment ≈ 0", () => {
    const d = distToPolylineKm([-118.3, 34.05], [[-118.4, 34.05], [-118.2, 34.05]]);
    expect(d).toBeLessThan(0.15);
  });

  it("anchorField peaks at the anchor", () => {
    const anchors = [{ lng: -118.25, lat: 34.05, r: 4, activity: 1 }];
    const atAnchor = anchorField([-118.25, 34.05], anchors, (a) => a.activity);
    const far = anchorField([-118.6, 34.3], anchors, (a) => a.activity);
    expect(atAnchor).toBeGreaterThan(0.95);
    expect(far).toBeLessThan(0.05);
  });

  it("noise2d is deterministic, bounded, and spatially smooth", () => {
    const a = noise2d(-118.3, 34.0, 7);
    expect(a).toBe(noise2d(-118.3, 34.0, 7));
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(1);
    const b = noise2d(-118.3005, 34.0005, 7); // ~50m away
    expect(Math.abs(a - b)).toBeLessThan(0.25);
  });

  it("clamp", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-1, 0, 1)).toBe(0);
  });
});

describe("la-mask", () => {
  it("excludes open ocean off Santa Monica", () => {
    expect(isExcluded(-118.6, 33.95)).toBe(true);
  });

  it("keeps DTLA / Long Beach / Sherman Oaks", () => {
    expect(isExcluded(-118.249, 34.048)).toBe(false);
    expect(isExcluded(-118.193, 33.77)).toBe(false);
    expect(isExcluded(-118.451, 34.151)).toBe(false);
  });

  it("excludes Angeles NF high north-east", () => {
    expect(isExcluded(-118.1, 34.32)).toBe(true);
  });

  it("excludes Santa Monica Mountains spine", () => {
    expect(isExcluded(-118.6, 34.1)).toBe(true);
  });
});
