import { describe, expect, it } from "vitest";
import type { HexProps } from "@/lib/snapshot/types";
import type { SearchHit } from "./search";
import { parseIntent, type IntentCtx } from "./intents";

const SM_HIT: SearchHit = {
  id: "a-sm",
  label: "Santa Monica",
  sub: "Neighborhood",
  kind: "area",
  center: [-118.492, 34.017],
  zoom: 12,
};

const SELECTED = {
  h3: "88aa",
  label: "Koreatown",
  mv_visits: 41250,
  mv_dwell: 22,
  mv_day: 0.6,
  mv_eve: 0.4,
  tr: Array(12).fill(110),
  tr_qsr: Array(12).fill(115),
  tr_retail: Array(12).fill(105),
  tr_grocery: Array(12).fill(100),
  tr_fitness: Array(12).fill(120),
  dm_hhi: 61400,
  dm_pop: 5200,
  dm_age: 33,
  dm_age_mix: [0.15, 0.3, 0.25, 0.15, 0.15],
  dm_inc_mix: [0.35, 0.35, 0.18, 0.12],
  sp_food: 140,
  sp_retail: 96,
  sp_grocery: 104,
  sp_fitness: 88,
  sp_fuel: 72,
  au_hip: 9,
  au_trv: 14,
  au_auto: 22,
  au_fit: 12,
  au_mov: 19,
  au_lux: 6,
  poi_count: 34,
  poi_food: 18,
  poi_retail: 8,
  poi_grocery: 4,
  poi_health: 3,
  poi_fin: 1,
  poi_top: ["Starbucks", "CVS", "Chipotle"],
  bl_top: ["Target", "Ralphs"],
} as HexProps;

function ctx(over: Partial<IntentCtx> = {}): IntentCtx {
  return {
    hits: (q) => (q.toLowerCase().includes("santa") ? [SM_HIT] : []),
    topHex: () => ({ label: "Downtown LA", value: 52000 }),
    selected: null,
    months: ["Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26"],
    ...over,
  };
}

const acts = (r: { actions: { type: string }[] }) => r.actions.map((a) => a.type);

describe("parseIntent", () => {
  it("income query maps demographics HHI and names the top area", () => {
    const r = parseIntent("show median income across the city", ctx());
    expect(r.actions[0]).toMatchObject({ type: "addLayer", datasetId: "demographics-income", metricId: "dm_hhi" });
    expect(r.reply).toContain("Downtown LA");
  });

  it("qsr trends + play", () => {
    const r = parseIntent("show QSR foot traffic trends and play the year", ctx());
    expect(r.actions).toContainEqual(
      expect.objectContaining({ type: "addLayer", datasetId: "foot-traffic-trends", variant: "qsr" })
    );
    expect(acts(r)).toContain("play");
  });

  it("coffee shops in santa monica → POIs + flyTo", () => {
    const r = parseIntent("map coffee shops in Santa Monica", ctx());
    expect(r.actions).toContainEqual(
      expect.objectContaining({ type: "addLayer", datasetId: "places-poi", poiCat: "food" })
    );
    const go = r.actions.find((a) => a.type === "goTo") as { center: [number, number] };
    expect(go).toBeTruthy();
    expect(go.center[0]).toBeCloseTo(-118.492, 1);
    expect(r.reply).toContain("Santa Monica");
  });

  it("audience segment query maps the right segment", () => {
    const r = parseIntent("where do high-income parents live?", ctx());
    expect(r.actions[0]).toMatchObject({ type: "addLayer", datasetId: "people-audience", metricId: "au_hip" });
  });

  it("describe with a selected hex narrates real values", () => {
    const r = parseIntent("tell me about this area", ctx({ selected: SELECTED }));
    expect(r.actions).toHaveLength(0);
    expect(r.reply).toContain("Koreatown");
    expect(r.reply).toContain("41.3K"); // fmtCompact(41250)
    expect(r.reply).toContain("$61.4K"); // fmtUSDCompact(61400)
  });

  it("describe without selection asks to click", () => {
    const r = parseIntent("what's here?", ctx());
    expect(r.actions).toHaveLength(0);
    expect(r.reply.toLowerCase()).toContain("click");
  });

  it("clear resets layers", () => {
    const r = parseIntent("clear the map", ctx());
    expect(acts(r)).toEqual(["clearLayers"]);
  });

  it("gibberish falls back with suggestions and no actions", () => {
    const r = parseIntent("flurble wumpus", ctx());
    expect(r.actions).toHaveLength(0);
    expect(r.reply).toContain("Try");
  });
});
