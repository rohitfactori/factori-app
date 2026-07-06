"use client";
import { create } from "zustand";
import { LAYER_CONFIGS } from "@/lib/explore/metrics";
import type { ExploreLayer, SavedView } from "@/lib/snapshot/types";

export type ExploreChatMsg = { id: string; role: "user" | "assistant"; text: string };
export type Basemap = "dark" | "light" | "satellite";

const VIEWS_KEY = "factori-explore-views";

let _n = 0;
const nextId = (p: string) => `${p}${++_n}`;

function defaultsFor(datasetId: string, metricId?: string): Omit<ExploreLayer, "id"> {
  const cfg = LAYER_CONFIGS[datasetId];
  return {
    datasetId,
    metricId: metricId ?? cfg.defaultMetric,
    variant: cfg.defaultVariant,
    poiCat: cfg.kind === "poi" ? "all" : undefined,
    opacity: 0.7,
    visible: true,
  };
}

export function loadUserViews(): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VIEWS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type ExploreState = {
  layers: ExploreLayer[];
  selectedHex: string | null;
  timeIndex: number; // 0..11, default latest month
  playing: boolean;
  basemap: Basemap;
  chatOpen: boolean;
  chatMessages: ExploreChatMsg[];
  chatThinking: boolean;
  dataSheetFor: string | null;
  flyTo: { center: [number, number]; zoom: number } | null;
  flyNonce: number;
  /** last camera the map reported (used when saving views) */
  camera: { center: [number, number]; zoom: number } | null;

  addLayer: (datasetId: string, metricId?: string) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, patch: Partial<ExploreLayer>) => void;
  toggleVisible: (id: string) => void;
  selectHex: (h3: string | null) => void;
  setTimeIndex: (i: number) => void;
  setPlaying: (b: boolean) => void;
  setBasemap: (b: Basemap) => void;
  setChatOpen: (b: boolean) => void;
  setCamera: (c: { center: [number, number]; zoom: number }) => void;
  goTo: (center: [number, number], zoom: number) => void;
  applyView: (v: SavedView) => void;
  saveViewAs: (name: string) => SavedView;
  openDataSheet: (datasetId: string) => void;
  closeDataSheet: () => void;
  submitChat: (text: string) => void;
  reset: () => void;
};

export const useExplore = create<ExploreState>((set, get) => ({
  layers: [],
  selectedHex: null,
  timeIndex: 11,
  playing: false,
  basemap: "dark",
  chatOpen: false,
  chatMessages: [],
  chatThinking: false,
  dataSheetFor: null,
  flyTo: null,
  flyNonce: 0,
  camera: null,

  addLayer: (datasetId, metricId) => {
    if (!LAYER_CONFIGS[datasetId]) return;
    set((s) => {
      const existing = s.layers.find((l) => l.datasetId === datasetId);
      if (existing) {
        return {
          layers: s.layers.map((l) =>
            l.id === existing.id
              ? { ...l, metricId: metricId ?? l.metricId, visible: true }
              : l
          ),
        };
      }
      return { layers: [...s.layers, { id: nextId("xl"), ...defaultsFor(datasetId, metricId) }] };
    });
  },

  removeLayer: (id) => set((s) => ({ layers: s.layers.filter((l) => l.id !== id) })),

  updateLayer: (id, patch) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),

  toggleVisible: (id) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)) })),

  selectHex: (h3) => set({ selectedHex: h3 }),
  setTimeIndex: (i) => set({ timeIndex: i }),
  setPlaying: (b) => set({ playing: b }),
  setBasemap: (b) => set({ basemap: b }),
  setChatOpen: (b) => set({ chatOpen: b }),
  setCamera: (c) => set({ camera: c }),

  goTo: (center, zoom) => set((s) => ({ flyTo: { center, zoom }, flyNonce: s.flyNonce + 1 })),

  applyView: (v) =>
    set((s) => ({
      layers: v.layers.map((l) => ({ ...l, id: nextId("xl") })),
      timeIndex: v.timeIndex ?? s.timeIndex,
      playing: v.playing ?? false,
      selectedHex: null,
      flyTo: v.camera,
      flyNonce: s.flyNonce + 1,
    })),

  saveViewAs: (name) => {
    const s = get();
    const view: SavedView = {
      id: nextId("uv-"),
      name,
      layers: s.layers.map(({ id: _id, ...rest }) => rest),
      camera: s.camera ?? { center: [-118.33, 34.02], zoom: 9.7 },
      timeIndex: s.timeIndex,
    };
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(VIEWS_KEY, JSON.stringify([...loadUserViews(), view]));
      } catch {
        /* storage full/blocked — view still returned for this session */
      }
    }
    return view;
  },

  openDataSheet: (datasetId) => set({ dataSheetFor: datasetId }),
  closeDataSheet: () => set({ dataSheetFor: null }),

  // Placeholder agent — replaced by the intent parser in the chat task.
  submitChat: (text) => {
    const q = text.trim();
    if (!q || get().chatThinking) return;
    set((s) => ({
      chatMessages: [...s.chatMessages, { id: nextId("m"), role: "user", text: q }],
      chatThinking: true,
    }));
    setTimeout(() => {
      set((s) => ({
        chatMessages: [
          ...s.chatMessages,
          { id: nextId("m"), role: "assistant", text: "The demo agent arrives in a later task." },
        ],
        chatThinking: false,
      }));
    }, 500);
  },

  reset: () => {
    _n = 0;
    set({
      layers: [],
      selectedHex: null,
      timeIndex: 11,
      playing: false,
      basemap: "dark",
      chatOpen: false,
      chatMessages: [],
      chatThinking: false,
      dataSheetFor: null,
      flyTo: null,
      flyNonce: 0,
      camera: null,
    });
  },
}));
