import { beforeEach, describe, expect, it } from "vitest";
import { useExplore } from "./explore";

beforeEach(() => useExplore.getState().reset());

describe("explore store", () => {
  it("addLayer applies dataset defaults and dedupes by dataset", () => {
    useExplore.getState().addLayer("movement-graph");
    useExplore.getState().addLayer("movement-graph", "mv_dwell");
    const layers = useExplore.getState().layers;
    expect(layers).toHaveLength(1);
    expect(layers[0].metricId).toBe("mv_dwell");
    expect(layers[0].visible).toBe(true);
    expect(layers[0].opacity).toBeCloseTo(0.7);
    expect(layers[0].variant).toBe("all");
  });

  it("places layer gets points variant + poiCat default", () => {
    useExplore.getState().addLayer("places-poi");
    const l = useExplore.getState().layers[0];
    expect(l.variant).toBe("points");
    expect(l.poiCat).toBe("all");
  });

  it("updateLayer patches and toggleVisible flips", () => {
    useExplore.getState().addLayer("consumer-spend");
    const id = useExplore.getState().layers[0].id;
    useExplore.getState().updateLayer(id, { opacity: 0.4 });
    expect(useExplore.getState().layers[0].opacity).toBe(0.4);
    useExplore.getState().toggleVisible(id);
    expect(useExplore.getState().layers[0].visible).toBe(false);
  });

  it("applyView replaces layers, camera and time", () => {
    useExplore.getState().addLayer("consumer-spend");
    useExplore.getState().applyView({
      id: "v",
      name: "V",
      layers: [{ datasetId: "demographics-income", metricId: "dm_hhi", opacity: 0.6, visible: true }],
      camera: { center: [-118.4, 34.0], zoom: 11 },
      timeIndex: 3,
    });
    const s = useExplore.getState();
    expect(s.layers).toHaveLength(1);
    expect(s.layers[0].datasetId).toBe("demographics-income");
    expect(s.timeIndex).toBe(3);
    expect(s.flyTo?.zoom).toBe(11);
  });

  it("selectHex sets selection; goTo bumps nonce", () => {
    const n0 = useExplore.getState().flyNonce;
    useExplore.getState().goTo([-118.3, 34.05], 12);
    expect(useExplore.getState().flyNonce).toBe(n0 + 1);
    useExplore.getState().selectHex("88abc");
    expect(useExplore.getState().selectedHex).toBe("88abc");
    useExplore.getState().selectHex(null);
    expect(useExplore.getState().selectedHex).toBeNull();
  });

  it("data sheet + chat open state", () => {
    useExplore.getState().openDataSheet("movement-graph");
    expect(useExplore.getState().dataSheetFor).toBe("movement-graph");
    useExplore.getState().closeDataSheet();
    expect(useExplore.getState().dataSheetFor).toBeNull();
    useExplore.getState().submitChat("hello");
    expect(useExplore.getState().chatMessages[0].role).toBe("user");
  });
});
