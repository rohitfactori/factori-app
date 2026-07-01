"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { useAsk } from "@/lib/store/ask";
import { MAP } from "@/lib/mock/geo";
import type { ResultPayload, LayerDef } from "@/lib/mock/agent";

/* eslint-disable @typescript-eslint/no-explicit-any */
const carto = (s: string) =>
  ["a", "b", "c", "d"].map((h) => `https://${h}.basemaps.cartocdn.com/${s}/{z}/{x}/{y}.png`);

// Self-contained style with three switchable basemaps. `load` fires immediately
// (no remote style.json) so data layers always render; tiles enrich when online.
const STYLE: any = {
  version: 8,
  sources: {
    "carto-dark": { type: "raster", tiles: carto("dark_all"), tileSize: 256, attribution: "© CARTO © OSM" },
    "carto-light": { type: "raster", tiles: carto("light_all"), tileSize: 256, attribution: "© CARTO © OSM" },
    "esri-sat": {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "© Esri",
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#0b0e0f" } },
    { id: "bm-dark", type: "raster", source: "carto-dark", paint: { "raster-opacity": 0.9, "raster-saturation": -0.12, "raster-contrast": 0.04 } },
    { id: "bm-light", type: "raster", source: "carto-light", layout: { visibility: "none" } },
    { id: "bm-sat", type: "raster", source: "esri-sat", layout: { visibility: "none" }, paint: { "raster-opacity": 0.95 } },
  ],
};

const BM: Record<string, string> = { dark: "bm-dark", light: "bm-light", satellite: "bm-sat" };
const EMPTY = { type: "FeatureCollection", features: [] };

const LAYER_MAP: Record<string, string[]> = {
  points: ["pts", "pts-glow"],
  choropleth: ["areas-fill", "areas-line"],
  heat: ["heat"],
};

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const loaded = useRef(false);

  const result = useAsk((s) => s.result);
  const layers = useAsk((s) => s.layers);
  const selectedId = useAsk((s) => s.selectedId);
  const basemap = useAsk((s) => s.basemap);
  const tool = useAsk((s) => s.tool);
  const radius = useAsk((s) => s.radius);
  const fitNonce = useAsk((s) => s.fitNonce);

  useEffect(() => {
    let map: any;
    let ro: ResizeObserver | undefined;
    let cancelled = false;
    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !containerRef.current) return;
      map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE,
        center: [-96, 38.5],
        zoom: 3.4,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      ro = new ResizeObserver(() => map.resize());
      if (containerRef.current) ro.observe(containerRef.current);

      map.on("load", () => {
        loaded.current = true;
        const st = useAsk.getState();
        if (st.result) {
          buildData(map, st.result);
          applyVisibility(map, st.layers);
          applySelection(map, st.selectedId, st.result, false);
        }
        applyBasemap(map, st.basemap);

        const selPt = (e: any) => {
          if (useAsk.getState().tool === "radius") return;
          const id = e.features?.[0]?.properties?.id;
          if (id) useAsk.getState().selectFeature(id);
        };
        map.on("click", "pts", selPt);
        map.on("click", "areas-fill", selPt);
        for (const lid of ["pts", "areas-fill"]) {
          map.on("mouseenter", lid, () => {
            if (useAsk.getState().tool !== "radius") map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", lid, () => {
            if (useAsk.getState().tool !== "radius") map.getCanvas().style.cursor = "";
          });
        }
        // radius / trade-area drop
        map.on("click", (e: any) => {
          const s = useAsk.getState();
          if (s.tool === "radius") {
            s.setRadius({ lng: e.lngLat.lng, lat: e.lngLat.lat, miles: s.radius?.miles ?? 1.5 });
          }
        });
      });
    })();
    return () => {
      cancelled = true;
      loaded.current = false;
      ro?.disconnect();
      if (map) map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded.current || !result) return;
    buildData(map, result);
    applyVisibility(map, useAsk.getState().layers);
    applySelection(map, useAsk.getState().selectedId, result, false);
  }, [result]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded.current) return;
    applyVisibility(map, layers);
  }, [layers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded.current || !result) return;
    applySelection(map, selectedId, result, true);
  }, [selectedId, result]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded.current) return;
    applyBasemap(map, basemap);
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded.current) return;
    map.getCanvas().style.cursor = tool === "radius" ? "crosshair" : "";
  }, [tool]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded.current) return;
    map.getSource("radius-src")?.setData(radius ? radiusFC(radius) : EMPTY);
    map.getSource("radius-ctr-src")?.setData(radius ? radiusCtrFC(radius) : EMPTY);
  }, [radius]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded.current || fitNonce === 0) return;
    const r = useAsk.getState().result;
    if (r) fitToResult(map, r);
  }, [fitNonce]);

  // maplibre-gl.css forces position:relative on the container, beating Tailwind's
  // `absolute` — size with h/w-full instead.
  return <div ref={containerRef} className="h-full w-full" />;
}

/* ----------------------------- helpers ----------------------------- */
function norm(v: number, min: number, max: number) {
  return max === min ? 0.5 : (v - min) / (max - min);
}

function applyBasemap(map: any, basemap: string) {
  for (const k of Object.keys(BM)) {
    if (map.getLayer(BM[k]))
      map.setLayoutProperty(BM[k], "visibility", basemap === k ? "visible" : "none");
  }
}

function circleMiles(center: [number, number], miles: number, steps = 72): [number, number][] {
  const [lng, lat] = center;
  const km = miles * 1.60934;
  const dLat = 1 / 110.574;
  const dLng = 1 / (111.32 * Math.cos((lat * Math.PI) / 180));
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ring.push([lng + km * Math.cos(a) * dLng, lat + km * Math.sin(a) * dLat]);
  }
  return ring;
}
const radiusFC = (r: { lng: number; lat: number; miles: number }) => ({
  type: "FeatureCollection",
  features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [circleMiles([r.lng, r.lat], r.miles)] } }],
});
const radiusCtrFC = (r: { lng: number; lat: number }) => ({
  type: "FeatureCollection",
  features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [r.lng, r.lat] } }],
});

function fitToResult(map: any, result: ResultPayload) {
  if (!result.features.length) return;
  const st = useAsk.getState();
  let w = 180, s = 90, e = -180, n = -90;
  for (const f of result.features) {
    w = Math.min(w, f.lng); e = Math.max(e, f.lng);
    s = Math.min(s, f.lat); n = Math.max(n, f.lat);
  }
  const right = st.panelOpen ? 300 : 64;
  const left = st.mode === "immersive" && st.chatOpen ? 396 : 64;
  map.fitBounds([[w, s], [e, n]], { padding: { top: 76, bottom: 76, left, right }, duration: 700, maxZoom: 13 });
}

function buildData(map: any, result: ResultPayload) {
  const vals = result.features.map((f) => f.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);

  upsert(map, "pts-src", {
    type: "FeatureCollection",
    features: result.features.map((f) => ({
      type: "Feature",
      properties: { id: f.id, n: norm(f.value, min, max) },
      geometry: { type: "Point", coordinates: [f.lng, f.lat] },
    })),
  });
  upsert(map, "areas-src", {
    type: "FeatureCollection",
    features: result.features
      .filter((f) => f.polygon)
      .map((f) => ({
        type: "Feature",
        properties: { id: f.id, n: norm(f.value, min, max) },
        geometry: { type: "Polygon", coordinates: [f.polygon] },
      })),
  });

  ensureLayers(map);
  fitToResult(map, result);
}

function upsert(map: any, id: string, data: any) {
  const src = map.getSource(id);
  if (src) src.setData(data);
  else map.addSource(id, { type: "geojson", data });
}

function ensureLayers(map: any) {
  if (map.getLayer("areas-fill")) return;
  map.addSource("radius-src", { type: "geojson", data: EMPTY });
  map.addSource("radius-ctr-src", { type: "geojson", data: EMPTY });

  const ramp = MAP.ramp;
  map.addLayer({
    id: "areas-fill",
    type: "fill",
    source: "areas-src",
    paint: {
      "fill-color": ["interpolate", ["linear"], ["get", "n"], 0, ramp[0], 0.25, ramp[1], 0.5, ramp[2], 0.75, ramp[3], 1, ramp[4]],
      "fill-opacity": 0.5,
    },
  });
  map.addLayer({ id: "areas-line", type: "line", source: "areas-src", paint: { "line-color": MAP.teal, "line-width": 1, "line-opacity": 0.55 } });
  map.addLayer({ id: "areas-sel", type: "line", source: "areas-src", filter: ["==", ["get", "id"], "__none__"], paint: { "line-color": "#EAF6F4", "line-width": 2 } });

  map.addLayer({ id: "radius-fill", type: "fill", source: "radius-src", paint: { "fill-color": "#33D6C6", "fill-opacity": 0.12 } });
  map.addLayer({ id: "radius-line", type: "line", source: "radius-src", paint: { "line-color": "#33D6C6", "line-width": 1.5, "line-dasharray": [2, 1.5] } });

  map.addLayer({
    id: "heat",
    type: "heatmap",
    source: "pts-src",
    layout: { visibility: "none" },
    paint: {
      "heatmap-weight": ["interpolate", ["linear"], ["get", "n"], 0, 0.2, 1, 1],
      "heatmap-radius": 36,
      "heatmap-intensity": 1.1,
      "heatmap-opacity": 0.72,
      "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,0,0)", 0.3, "#1c574f", 0.6, "#2da08d", 1, "#5ff0db"],
    },
  });
  map.addLayer({
    id: "pts-glow",
    type: "circle",
    source: "pts-src",
    paint: { "circle-radius": ["interpolate", ["linear"], ["get", "n"], 0, 9, 1, 26], "circle-color": MAP.teal, "circle-opacity": 0.1, "circle-blur": 0.7 },
  });
  map.addLayer({
    id: "pts",
    type: "circle",
    source: "pts-src",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "n"], 0, 3.5, 1, 11],
      "circle-color": MAP.teal,
      "circle-opacity": 0.92,
      "circle-stroke-color": "#0C0F10",
      "circle-stroke-width": 1.2,
    },
  });
  map.addLayer({
    id: "pts-sel",
    type: "circle",
    source: "pts-src",
    filter: ["==", ["get", "id"], "__none__"],
    paint: { "circle-radius": ["interpolate", ["linear"], ["get", "n"], 0, 6, 1, 13], "circle-color": MAP.teal, "circle-stroke-color": "#EAF6F4", "circle-stroke-width": 2.5 },
  });
  map.addLayer({ id: "radius-ctr", type: "circle", source: "radius-ctr-src", paint: { "circle-radius": 5, "circle-color": "#45e0cb", "circle-stroke-color": "#0b0e0f", "circle-stroke-width": 2 } });
}

function applyVisibility(map: any, layers: LayerDef[]) {
  for (const l of layers) {
    const ids = LAYER_MAP[l.id];
    if (!ids) continue;
    for (const id of ids) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", l.visible ? "visible" : "none");
    }
  }
}

function applySelection(map: any, selectedId: string | null, result: ResultPayload, fly: boolean) {
  const filt = ["==", ["get", "id"], selectedId ?? "__none__"];
  if (map.getLayer("pts-sel")) map.setFilter("pts-sel", filt);
  if (map.getLayer("areas-sel")) map.setFilter("areas-sel", filt);
  if (fly && selectedId) {
    const f = result.features.find((x) => x.id === selectedId);
    if (f) map.flyTo({ center: [f.lng, f.lat], zoom: Math.max(map.getZoom(), result.kind === "places" ? 12 : 10.5), duration: 700 });
  }
}
