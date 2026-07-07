"use client";

import { useState } from "react";
import { Layers, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useExplore } from "@/lib/store/explore";
import { IconButton } from "@/components/ui/button";
import { AddLayerPicker } from "./AddLayerPicker";
import { LayerCard } from "./LayerCard";

const QUICK_ADDS: { label: string; datasetId: string; metricId?: string }[] = [
  { label: "Movement · visits", datasetId: "movement-graph" },
  { label: "Median income", datasetId: "demographics-income" },
  { label: "Points of interest", datasetId: "places-poi" },
];

export function LayerRail() {
  const layers = useExplore((s) => s.layers);
  const addLayer = useExplore((s) => s.addLayer);
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="absolute left-3 top-16 z-10">
        <IconButton
          aria-label="Show layers"
          className="border border-line bg-panel/90 shadow-panel backdrop-blur-md"
          onClick={() => setCollapsed(false)}
        >
          <PanelLeftOpen />
        </IconButton>
      </div>
    );
  }

  return (
    <div className="absolute bottom-3 left-3 top-16 z-10 flex w-[300px] flex-col">
      <div className="flex items-center gap-2 pb-2">
        <Layers className="size-3.5 text-ink-faint" />
        <span className="label-eyebrow flex-1">
          Layers{layers.length > 0 && <span className="ml-1 text-ink-muted">· {layers.length}</span>}
        </span>
        <AddLayerPicker />
        <IconButton size="xs" aria-label="Hide layers" onClick={() => setCollapsed(true)}>
          <PanelLeftClose />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-1 pr-0.5">
        {layers.map((l) => (
          <LayerCard key={l.id} layer={l} />
        ))}

        {layers.length === 0 && (
          <div className="rounded-lg border border-line bg-panel/90 p-3.5 shadow-panel backdrop-blur-md">
            <div className="text-xs font-medium text-ink">Nothing on the map yet</div>
            <p className="mt-1 text-2xs leading-relaxed text-ink-muted">
              Add a Factori dataset as a map layer, or ask the agent below.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {QUICK_ADDS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => addLayer(q.datasetId, q.metricId)}
                  className="rounded-full border border-line bg-panel px-2 py-1 text-2xs text-ink-muted transition-colors hover:border-line-strong hover:bg-panel-2 hover:text-ink"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
