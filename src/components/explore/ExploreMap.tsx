"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { useExplore } from "@/lib/store/explore";
import { colorExpr, formatMetric, LAYER_CONFIGS, METRIC_BY_ID, POI_COLORS, readValue, rendersHex } from "@/lib/explore/metrics";
import { loadSnapshot, resetSnapshotCache, type Snapshot } from "@/lib/snapshot/client";
import { LA } from "@/lib/snapshot/la-meta";
import type { ExploreLayer, HexProps } from "@/lib/snapshot/types";
import { HexTooltip, type TooltipData } from "./HexTooltip";

/* eslint-disable @typescript-eslint/no-explicit-any */
const carto = (s: string) =>
  ["a", "b", "c", "d"].map((h) => `https://${h}.basemaps.cartocdn.com/${s}/{z}/{x}/{y}.png`);

// Self-contained style (same pattern as Ask's MapCanvas): `load` fires
// immediately, data layers always render, tiles enrich when online.
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
const SPLIT = 11.3; // r7 below, r8 above

const fillIds = (l: ExploreLayer) => [`xl-${l.id}-7`, `xl-${l.id}-8`];

/** never hang a demo on a fetch: timeout, reset the cache, retry */
async function loadSnapshotWithRetry(): Promise<Snapshot> {
  for (let i = 0; i < 2; i++) {
    try {
      return await Promise.race([
        loadSnapshot(),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("snapshot timeout")), 8000)),
      ]);
    } catch {
      resetSnapshotCache();
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return loadSnapshot();
}

function applyBasemap(map: any, basemap: string) {
  for (const k of Object.keys(BM)) {
    if (map.getLayer(BM[k])) map.setLayoutProperty(BM[k], "visibility", basemap === k ? "visible" : "none");
  }
}

/** hex-rendered explore layers, bottom→top */
const hexLayers = (layers: ExploreLayer[]) => layers.filter((l) => l.visible && rendersHex(l));

function syncLayers(map: any, layers: ExploreLayer[], timeIndex: number) {
  const desired = hexLayers(layers);
  const desiredIds = new Set(desired.flatMap(fillIds));

  // remove stale fills
  for (const lyr of [...map.getStyle().layers]) {
    if (lyr.id.startsWith("xl-") && !desiredIds.has(lyr.id)) map.removeLayer(lyr.id);
  }

  // add/update in array order (bottom→top), all inserted below poi/selection
  for (const l of desired) {
    const color = colorExpr(l, timeIndex);
    for (const [i, id] of fillIds(l).entries()) {
      const res = i === 0 ? 7 : 8;
      if (!map.getLayer(id)) {
        map.addLayer(
          {
            id,
            type: "fill",
            source: res === 7 ? "hex-r7" : "hex-r8",
            ...(res === 7 ? { maxzoom: SPLIT } : { minzoom: SPLIT }),
            paint: { "fill-color": color, "fill-opacity": l.opacity },
          },
          "poi-circles"
        );
      } else {
        map.setPaintProperty(id, "fill-color", color);
        map.setPaintProperty(id, "fill-opacity", l.opacity);
        map.moveLayer(id, "poi-circles");
      }
    }
  }

  // POI circles: visible iff a places layer is visible in points mode
  const places = layers.find((l) => l.datasetId === "places-poi" && l.visible && l.variant === "points");
  if (map.getLayer("poi-circles")) {
    map.setLayoutProperty("poi-circles", "visibility", places ? "visible" : "none");
    map.setFilter(
      "poi-circles",
      places && places.poiCat && places.poiCat !== "all" ? ["==", ["get", "category"], places.poiCat] : null
    );
  }
}

export function ExploreMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const readyRef = useRef(false); // map loaded AND snapshot sources added
  const [snapReady, setSnapReady] = useState(false);
  const [snapError, setSnapError] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const raf = useRef(0);
  const retryRef = useRef<() => void>(() => {});

  const layers = useExplore((s) => s.layers);
  const timeIndex = useExplore((s) => s.timeIndex);
  const basemap = useExplore((s) => s.basemap);
  const selectedHex = useExplore((s) => s.selectedHex);
  const flyNonce = useExplore((s) => s.flyNonce);

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
        center: LA.camera.center,
        zoom: LA.camera.zoom,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      ro = new ResizeObserver(() => map.resize());
      ro.observe(containerRef.current);

      // Don't gate startup on the `load` event — poll style readiness as a
      // state check instead. Event timing proved fragile; a demo must not
      // depend on it, and this also lets the snapshot download in parallel.
      const styleReady = () =>
        new Promise<void>((resolve) => {
          if (map.isStyleLoaded()) return resolve();
          const t = setInterval(() => {
            if (cancelled || map.isStyleLoaded()) {
              clearInterval(t);
              resolve();
            }
          }, 80);
          map.once("load", () => {
            clearInterval(t);
            resolve();
          });
        });

      const initData = async () => {
        try {
          setSnapError(false);
          const snap = await loadSnapshotWithRetry();
          await styleReady();
          if (cancelled) return;
          if (!map.getSource("hex-r7")) {
            map.addSource("hex-r7", { type: "geojson", data: snap.r7 });
            map.addSource("hex-r8", { type: "geojson", data: snap.r8 });
            map.addSource("poi-src", { type: "geojson", data: snap.poi });
            addDataLayers(map);
          }
          readyRef.current = true;
          setSnapReady(true);
          if (process.env.NODE_ENV !== "production") (window as any).__exploreMap = map;
          const st = useExplore.getState();
          syncLayers(map, st.layers, st.timeIndex);
          applyBasemap(map, st.basemap);
        } catch {
          if (!cancelled) setSnapError(true);
        }
      };
      retryRef.current = () => void initData();

      const addDataLayers = (map: any) => {
        map.addLayer({
          id: "poi-circles",
          type: "circle",
          source: "poi-src",
          layout: { visibility: "none" },
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 1.6, 12, 3, 14.5, 5.5],
            "circle-color": [
              "match", ["get", "category"],
              "food", POI_COLORS.food,
              "retail", POI_COLORS.retail,
              "grocery", POI_COLORS.grocery,
              "health", POI_COLORS.health,
              "fin", POI_COLORS.fin,
              "#8a9a98",
            ],
            "circle-opacity": 0.9,
            "circle-stroke-color": "#0C0F10",
            "circle-stroke-width": 1,
          },
        });
        for (const res of [7, 8] as const) {
          map.addLayer({
            id: `hex-sel-${res}`,
            type: "line",
            source: `hex-r${res}`,
            ...(res === 7 ? { maxzoom: SPLIT } : { minzoom: SPLIT }),
            filter: ["==", ["get", "h3"], "__none__"],
            paint: { "line-color": "#EAF6F4", "line-width": 2 },
          });
        }
      };

      void initData();

      {
        /* ---- pointer interactions (query top hex fill under cursor) ---- */
        const topFillIds = () => {
          const hl = hexLayers(useExplore.getState().layers);
          const z = map.getZoom();
          return hl.map((l) => `xl-${l.id}-${z >= SPLIT ? 8 : 7}`).filter((id) => map.getLayer(id));
        };
        const hitAt = (point: any) => {
          const ids = topFillIds();
          if (!ids.length) return null;
          const feats = map.queryRenderedFeatures(point, { layers: ids });
          return feats.length ? feats[0] : null;
        };

        map.on("mousemove", (e: any) => {
          cancelAnimationFrame(raf.current);
          const { point } = e;
          raf.current = requestAnimationFrame(() => {
            const f = hitAt(point);
            if (!f) {
              setTooltip(null);
              map.getCanvas().style.cursor = "";
              return;
            }
            map.getCanvas().style.cursor = "pointer";
            const st = useExplore.getState();
            const instanceId = String(f.layer.id).replace(/^xl-/, "").replace(/-(7|8)$/, "");
            const layer = st.layers.find((l) => l.id === instanceId);
            if (!layer) return setTooltip(null);
            // geojson round-trips arrays as JSON strings — parse for readValue
            const props = { ...f.properties } as Record<string, unknown>;
            for (const k of ["tr", "tr_qsr", "tr_retail", "tr_grocery", "tr_fitness", "dm_age_mix", "dm_inc_mix", "poi_top", "bl_top"]) {
              if (typeof props[k] === "string") {
                try { props[k] = JSON.parse(props[k] as string); } catch { /* leave as-is */ }
              }
            }
            const value = readValue(layer, props as unknown as HexProps, st.timeIndex);
            setTooltip({
              x: point.x,
              y: point.y,
              label: String(props.label ?? ""),
              metric: METRIC_BY_ID[layer.metricId].label,
              value: formatMetric(layer, value),
            });
          });
        });
        map.on("mouseout", () => setTooltip(null));
        map.on("click", (e: any) => {
          const f = hitAt(e.point);
          useExplore.getState().selectHex(f ? String(f.properties.h3) : null);
        });
        map.on("moveend", () => {
          const c = map.getCenter();
          useExplore.getState().setCamera({ center: [c.lng, c.lat], zoom: map.getZoom() });
        });
      }
    })();
    return () => {
      cancelled = true;
      readyRef.current = false;
      cancelAnimationFrame(raf.current);
      ro?.disconnect();
      if (map) map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    syncLayers(map, layers, timeIndex);
  }, [layers, timeIndex]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    for (const res of [7, 8]) {
      map.setFilter(`hex-sel-${res}`, ["==", ["get", "h3"], selectedHex ?? "__none__"]);
    }
  }, [selectedHex]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyBasemap(map, basemap);
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || flyNonce === 0) return;
    const target = useExplore.getState().flyTo;
    if (target) map.flyTo({ center: target.center, zoom: target.zoom, duration: 800 });
  }, [flyNonce]);

  return (
    <div className="relative h-full w-full">
      {/* maplibre-gl.css forces position:relative on the container — size with h/w-full */}
      <div ref={containerRef} className="h-full w-full" />
      {!snapReady && (
        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-line bg-panel/90 px-3 py-1.5 text-xs backdrop-blur">
          {snapError ? (
            <>
              <span className="text-negative">Snapshot failed to load.</span>
              <button className="font-medium text-accent hover:underline" onClick={() => retryRef.current()}>
                Retry
              </button>
            </>
          ) : (
            <span className="text-ink-muted">Loading LA snapshot…</span>
          )}
        </div>
      )}
      <HexTooltip data={tooltip} />
    </div>
  );
}
