"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { MAP, type LngLat } from "@/lib/mock/geo";

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
    { id: "basemap", type: "raster", source: "basemap", paint: { "raster-opacity": 0.9, "raster-saturation": -0.12 } },
  ],
};

const EMPTY = { type: "FeatureCollection", features: [] };

export type MapPoint = { id: string; lng: number; lat: number; value: number };
export type MapArea = { id: string; polygon: LngLat[]; value: number };

export function AppMap({
  center,
  zoom,
  points = [],
  areas = [],
  selectedId = null,
  onSelect,
}: {
  center: LngLat;
  zoom: number;
  points?: MapPoint[];
  areas?: MapArea[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const loaded = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  // keep latest data for handlers / re-sync
  const dataRef = useRef({ points, areas });
  dataRef.current = { points, areas };

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
        center,
        zoom,
        attributionControl: false,
        dragRotate: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      ro = new ResizeObserver(() => map.resize());
      if (containerRef.current) ro.observe(containerRef.current);

      map.on("load", () => {
        loaded.current = true;
        buildLayers(map);
        syncData(map, dataRef.current.points, dataRef.current.areas);
        fit(map, dataRef.current.points, dataRef.current.areas);
        applySel(map, selectedId, dataRef.current, false);

        const sel = (e: any) => {
          const id = e.features?.[0]?.properties?.id;
          if (id) onSelectRef.current?.(id);
        };
        map.on("click", "pts", sel);
        map.on("click", "areas-fill", sel);
        for (const l of ["pts", "areas-fill"]) {
          map.on("mouseenter", l, () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", l, () => (map.getCanvas().style.cursor = ""));
        }
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

  // re-sync when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded.current) return;
    syncData(map, points, areas);
    applySel(map, selectedId, { points, areas }, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, areas]);

  // selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded.current) return;
    applySel(map, selectedId, { points, areas }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function norm(v: number, min: number, max: number) {
  return max === min ? 0.5 : (v - min) / (max - min);
}

function buildLayers(map: any) {
  map.addSource("pts", { type: "geojson", data: EMPTY });
  map.addSource("areas", { type: "geojson", data: EMPTY });
  map.addSource("sel-area", { type: "geojson", data: EMPTY });

  const ramp = MAP.ramp;
  map.addLayer({
    id: "areas-fill",
    type: "fill",
    source: "areas",
    paint: {
      "fill-color": ["interpolate", ["linear"], ["get", "n"], 0, ramp[0], 0.25, ramp[1], 0.5, ramp[2], 0.75, ramp[3], 1, ramp[4]],
      "fill-opacity": 0.55,
    },
  });
  map.addLayer({ id: "areas-line", type: "line", source: "areas", paint: { "line-color": MAP.teal, "line-width": 1, "line-opacity": 0.5 } });
  map.addLayer({ id: "sel-area-line", type: "line", source: "sel-area", paint: { "line-color": "#EAF6F4", "line-width": 2 } });

  map.addLayer({
    id: "pts-glow",
    type: "circle",
    source: "pts",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "n"], 0, 10, 1, 26],
      "circle-color": MAP.teal,
      "circle-opacity": 0.1,
      "circle-blur": 0.8,
    },
  });
  map.addLayer({
    id: "pts",
    type: "circle",
    source: "pts",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "n"], 0, 5, 1, 13],
      "circle-color": ["interpolate", ["linear"], ["get", "n"], 0, "#247a6c", 0.6, "#2da08d", 1, "#45e0cb"],
      "circle-opacity": 0.95,
      "circle-stroke-color": "#0b0e0f",
      "circle-stroke-width": 1.4,
    },
  });
  map.addLayer({
    id: "pts-sel",
    type: "circle",
    source: "pts",
    filter: ["==", ["get", "id"], "__none__"],
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "n"], 0, 8, 1, 16],
      "circle-color": "#45e0cb",
      "circle-stroke-color": "#EAF6F4",
      "circle-stroke-width": 2.5,
    },
  });
}

function syncData(map: any, points: MapPoint[], areas: MapArea[]) {
  const pv = points.map((p) => p.value);
  const pmin = Math.min(...pv), pmax = Math.max(...pv);
  map.getSource("pts")?.setData({
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      properties: { id: p.id, n: norm(p.value, pmin, pmax) },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    })),
  });

  const av = areas.map((a) => a.value);
  const amin = Math.min(...av), amax = Math.max(...av);
  map.getSource("areas")?.setData({
    type: "FeatureCollection",
    features: areas.map((a) => ({
      type: "Feature",
      properties: { id: a.id, n: norm(a.value, amin, amax) },
      geometry: { type: "Polygon", coordinates: [a.polygon] },
    })),
  });
}

function fit(map: any, points: MapPoint[], areas: MapArea[]) {
  const coords: LngLat[] = [
    ...points.map((p) => [p.lng, p.lat] as LngLat),
    ...areas.flatMap((a) => a.polygon),
  ];
  if (!coords.length) return;
  let w = 180, s = 90, e = -180, n = -90;
  for (const [lng, lat] of coords) {
    w = Math.min(w, lng); e = Math.max(e, lng);
    s = Math.min(s, lat); n = Math.max(n, lat);
  }
  map.fitBounds([[w, s], [e, n]], { padding: 70, duration: 0, maxZoom: 12 });
}

function applySel(
  map: any,
  selectedId: string | null,
  data: { points: MapPoint[]; areas: MapArea[] },
  fly: boolean
) {
  if (map.getLayer("pts-sel"))
    map.setFilter("pts-sel", ["==", ["get", "id"], selectedId ?? "__none__"]);

  const area = data.areas.find((a) => a.id === selectedId);
  map.getSource("sel-area")?.setData(
    area
      ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [area.polygon] } }] }
      : EMPTY
  );

  if (fly && selectedId) {
    const p = data.points.find((x) => x.id === selectedId);
    if (p) map.flyTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 12), duration: 600 });
    else if (area) {
      const c = centroid(area.polygon);
      map.flyTo({ center: c, zoom: Math.max(map.getZoom(), 10.5), duration: 600 });
    }
  }
}

function centroid(poly: LngLat[]): LngLat {
  let x = 0, y = 0;
  for (const [lng, lat] of poly) {
    x += lng;
    y += lat;
  }
  return [x / poly.length, y / poly.length];
}
