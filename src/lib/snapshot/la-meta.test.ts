import { describe, expect, it } from "vitest";
import { LA } from "./la-meta";

describe("LA meta", () => {
  it("has 12 month labels ending Jun 26", () => {
    expect(LA.months).toHaveLength(12);
    expect(LA.months[11]).toBe("Jun 26");
  });

  it("anchors sit inside bounds", () => {
    const [w, s, e, n] = LA.bounds;
    for (const a of LA.anchors) {
      expect(a.lng).toBeGreaterThan(w);
      expect(a.lng).toBeLessThan(e);
      expect(a.lat).toBeGreaterThan(s);
      expect(a.lat).toBeLessThan(n);
    }
  });

  it("defines 6 audience segments and 5 spend categories", () => {
    expect(LA.segments).toHaveLength(6);
    expect(LA.spendCats).toHaveLength(5);
  });

  it("curated views reference plausible cameras and layers", () => {
    expect(LA.views.length).toBeGreaterThanOrEqual(4);
    for (const v of LA.views) {
      expect(v.layers.length).toBeGreaterThan(0);
      expect(v.camera.zoom).toBeGreaterThan(8);
    }
  });
});
