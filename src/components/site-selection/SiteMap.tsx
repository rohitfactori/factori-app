"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { Site } from "@/lib/mock/sites";

/* eslint-disable @typescript-eslint/no-explicit-any */
const STYLE: any = {
  version: 8,
  sources: {
    basemap: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© CARTO © OpenStreetMap",
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#0b0e0f" } },
    {
      id: "basemap",
      type: "raster",
      source: "basemap",
      paint: { "raster-opacity": 0.9, "raster-saturation": -0.12 },
    },
  ],
};

const EMPTY = { type: "FeatureCollection", features: [] };

export function SiteMap({
  sites,
  selectedId,
  onSelect,
}: {
  sites: Site[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const loaded = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

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
        center: [-97.7431, 30.2672],
        zoom: 10.5,
        attributionControl: false,
        dragRotate: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      ro = new ResizeObserver(() => map.resize());
      if (containerRef.current) ro.observe(containerRef.current);

      map.on("load", () => {
        loaded.current = true;
        const cand = sites.filter((s) => s.kind === "candidate");
        const ex = sites.filter((s) => s.kind === "existing");

        map.addSource("cand", { type: "geojson", data: fc(cand) });
        map.addSource("ex", { type: "geojson", data: fc(ex) });
        map.addSource("trade", { type: "geojson", data: EMPTY });

        map.addLayer({
          id: "trade-fill",
          type: "fill",
          source: "trade",
          paint: { "fill-color": "#33D6C6", "fill-opacity": 0.12 },
        });
        map.addLayer({
          id: "trade-line",
          type: "line",
          source: "trade",
          paint: { "line-color": "#33D6C6", "line-width": 1.5, "line-dasharray": [2, 1.5], "line-opacity": 0.7 },
        });

        // existing stores
        map.addLayer({
          id: "ex",
          type: "circle",
          source: "ex",
          paint: {
            "circle-radius": 5,
            "circle-color": "#E98AA0",
            "circle-opacity": 0.85,
            "circle-stroke-color": "#0b0e0f",
            "circle-stroke-width": 1.5,
          },
        });

        // candidate glow + dots
        map.addLayer({
          id: "cand-glow",
          type: "circle",
          source: "cand",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["get", "score"], 50, 12, 95, 28],
            "circle-color": "#33D6C6",
            "circle-opacity": 0.1,
            "circle-blur": 0.8,
          },
        });
        map.addLayer({
          id: "cand",
          type: "circle",
          source: "cand",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["get", "score"], 50, 6, 95, 14],
            "circle-color": [
              "interpolate", ["linear"], ["get", "score"],
              50, "#247a6c", 75, "#2da08d", 95, "#45e0cb",
            ],
            "circle-opacity": 0.95,
            "circle-stroke-color": "#0b0e0f",
            "circle-stroke-width": 1.5,
          },
        });
        map.addLayer({
          id: "cand-sel",
          type: "circle",
          source: "cand",
          filter: ["==", ["get", "id"], "__none__"],
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["get", "score"], 50, 9, 95, 17],
            "circle-color": "#45e0cb",
            "circle-stroke-color": "#EAF6F4",
            "circle-stroke-width": 2.5,
          },
        });

        map.on("click", "cand", (e: any) => {
          const id = e.features?.[0]?.properties?.id;
          if (id) onSelectRef.current(id);
        });
        map.on("mouseenter", "cand", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "cand", () => (map.getCanvas().style.cursor = ""));

        // fit to all
        let w = 180, s = 90, ee = -180, n = -90;
        for (const st of sites) {
          w = Math.min(w, st.lng); ee = Math.max(ee, st.lng);
          s = Math.min(s, st.lat); n = Math.max(n, st.lat);
        }
        map.fitBounds([[w, s], [ee, n]], { padding: 80, duration: 0, maxZoom: 12 });

        applySelection(map, sites, selectedId, false);
      });
    })();
    return () => {
      cancelled = true;
      loaded.current = false;
      ro?.disconnect();
      if (map) map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded.current) return;
    applySelection(map, sites, selectedId, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // live re-score: refresh candidate source when scores change
  const scoreSig = sites
    .filter((s) => s.kind === "candidate")
    .map((s) => `${s.id}:${s.score}`)
    .join(",");
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded.current) return;
    map.getSource("cand")?.setData(fc(sites.filter((s) => s.kind === "candidate")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreSig]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function fc(sites: Site[]) {
  return {
    type: "FeatureCollection",
    features: sites.map((s) => ({
      type: "Feature",
      properties: { id: s.id, score: s.score },
      geometry: { type: "Point", coordinates: [s.lng, s.lat] },
    })),
  };
}

function applySelection(map: any, sites: Site[], selectedId: string | null, fly: boolean) {
  if (map.getLayer("cand-sel"))
    map.setFilter("cand-sel", ["==", ["get", "id"], selectedId ?? "__none__"]);
  const sel = sites.find((s) => s.id === selectedId);
  const tradeSrc = map.getSource("trade");
  if (tradeSrc) {
    tradeSrc.setData(
      sel
        ? {
            type: "FeatureCollection",
            features: [
              { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [sel.tradeArea] } },
            ],
          }
        : EMPTY
    );
  }
  if (fly && sel) {
    map.flyTo({ center: [sel.lng, sel.lat], zoom: Math.max(map.getZoom(), 11.5), duration: 650 });
  }
}
