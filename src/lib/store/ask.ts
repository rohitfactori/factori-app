"use client";
import { create } from "zustand";
import {
  runAgent,
  type ResultPayload,
  type LayerDef,
  type Control,
  type InsightPayload,
} from "@/lib/mock/agent";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  insight?: InsightPayload;
};
export type CanvasMode = "console" | "split" | "immersive";
export type Basemap = "dark" | "light" | "satellite";
export type MapTool = "pan" | "radius";
export type RadiusSel = { lng: number; lat: number; miles: number };

let _id = 0;
const nextId = () => `m${++_id}`;

type AskState = {
  messages: ChatMessage[];
  isThinking: boolean;
  mode: CanvasMode;
  result: ResultPayload | null;
  insight: InsightPayload | null;
  answerKind: "map" | "insight" | null;
  layers: LayerDef[];
  controls: Control[];
  selectedId: string | null;
  // immersive / map-app state
  basemap: Basemap;
  tool: MapTool;
  radius: RadiusSel | null;
  chatOpen: boolean;
  panelOpen: boolean;
  fitNonce: number;

  submit: (q: string) => void;
  setMode: (m: CanvasMode) => void;
  toggleLayer: (id: string) => void;
  setControl: (id: string, value: number | string | boolean) => void;
  selectFeature: (id: string | null) => void;
  setBasemap: (b: Basemap) => void;
  setTool: (t: MapTool) => void;
  setRadius: (r: RadiusSel | null) => void;
  setChatOpen: (b: boolean) => void;
  setPanelOpen: (b: boolean) => void;
  recenter: () => void;
  reset: () => void;
};

export const useAsk = create<AskState>((set, get) => ({
  messages: [],
  isThinking: false,
  mode: "console",
  result: null,
  insight: null,
  answerKind: null,
  layers: [],
  controls: [],
  selectedId: null,
  basemap: "dark",
  tool: "pan",
  radius: null,
  chatOpen: true,
  panelOpen: true,
  fitNonce: 0,

  submit: (q) => {
    const query = q.trim();
    if (!query || get().isThinking) return;
    set((s) => ({
      messages: [...s.messages, { id: nextId(), role: "user", text: query }],
      isThinking: true,
      mode: s.mode === "console" ? "split" : s.mode,
      selectedId: null,
    }));
    setTimeout(() => {
      const res = runAgent(query);
      if (res.kind === "insight") {
        set((s) => ({
          isThinking: false,
          insight: res.insight,
          answerKind: "insight",
          mode: "split",
          messages: [
            ...s.messages,
            { id: nextId(), role: "assistant", text: res.text, insight: res.insight },
          ],
        }));
      } else {
        set((s) => ({
          isThinking: false,
          result: res.result,
          answerKind: "map",
          layers: res.result.layers.map((l) => ({ ...l })),
          controls: res.result.controls.map((c) => ({ ...c })),
          messages: [...s.messages, { id: nextId(), role: "assistant", text: res.text }],
        }));
      }
    }, 850);
  },

  setMode: (m) => set({ mode: m, tool: "pan", radius: null }),
  toggleLayer: (id) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      ),
    })),
  setControl: (id, value) =>
    set((s) => ({
      controls: s.controls.map((c) =>
        c.id === id ? ({ ...c, value } as Control) : c
      ),
    })),
  selectFeature: (id) => set({ selectedId: id }),
  setBasemap: (b) => set({ basemap: b }),
  setTool: (t) => set({ tool: t }),
  setRadius: (r) => set({ radius: r }),
  setChatOpen: (b) => set({ chatOpen: b }),
  setPanelOpen: (b) => set({ panelOpen: b }),
  recenter: () => set((s) => ({ fitNonce: s.fitNonce + 1 })),
  reset: () =>
    set({
      messages: [],
      isThinking: false,
      mode: "console",
      result: null,
      insight: null,
      answerKind: null,
      layers: [],
      controls: [],
      selectedId: null,
      tool: "pan",
      radius: null,
      chatOpen: true,
      panelOpen: true,
    }),
}));
