import { describe, expect, it } from "vitest";
import type { SearchHit } from "./search";
import { searchPlaces } from "./search";

const INDEX: SearchHit[] = [
  { id: "a1", label: "Santa Monica", sub: "Neighborhood", kind: "area", center: [-118.492, 34.017], zoom: 12 },
  { id: "a2", label: "Downtown LA", sub: "Neighborhood", kind: "area", center: [-118.249, 34.048], zoom: 12 },
  { id: "b1", label: "Trader Joe's", sub: "Brand · 12 locations", kind: "brand", center: [-118.4, 34.02], zoom: 12.5 },
  { id: "p1", label: "Starbucks · Venice", sub: "Food & dining", kind: "poi", center: [-118.47, 33.99], zoom: 14, h3: "88ff" },
];

describe("searchPlaces", () => {
  it("prefix match ranks first", () => {
    const hits = searchPlaces("santa", INDEX);
    expect(hits[0].label).toBe("Santa Monica");
  });

  it("finds brands and pois by substring", () => {
    expect(searchPlaces("trader", INDEX)[0].kind).toBe("brand");
    expect(searchPlaces("starbucks", INDEX)[0].h3).toBe("88ff");
  });

  it("empty/nonsense yields empty", () => {
    expect(searchPlaces("", INDEX)).toHaveLength(0);
    expect(searchPlaces("zzzz", INDEX)).toHaveLength(0);
  });

  it("respects limit", () => {
    expect(searchPlaces("a", INDEX, 2)).toHaveLength(2);
  });
});
