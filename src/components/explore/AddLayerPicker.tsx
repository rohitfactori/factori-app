"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { getDataset } from "@/lib/mock/platform";
import { EXPLORABLE, rampFor, LAYER_CONFIGS } from "@/lib/explore/metrics";
import { useExplore } from "@/lib/store/explore";
import { Button } from "@/components/ui/button";

export function AddLayerPicker() {
  const layers = useExplore((s) => s.layers);
  const addLayer = useExplore((s) => s.addLayer);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const available = EXPLORABLE.filter((id) => !layers.some((l) => l.datasetId === id));

  return (
    <div ref={ref} className="relative">
      <Button variant="primary" size="sm" onClick={() => setOpen((v) => !v)} disabled={!available.length}>
        <Plus />
        Add layer
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-72 overflow-hidden rounded-lg border border-line bg-panel shadow-pop">
          {available.map((id) => {
            const ds = getDataset(id)!;
            const dot = rampFor({
              id: "preview",
              datasetId: id,
              metricId: LAYER_CONFIGS[id].defaultMetric,
              opacity: 1,
              visible: true,
            })[4];
            return (
              <button
                key={id}
                onClick={() => {
                  addLayer(id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 border-b border-line/60 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-panel-2"
              >
                <span className="size-2 shrink-0 rounded-full" style={{ background: dot }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-ink">{ds.name}</span>
                  <span className="label-eyebrow">{ds.category}</span>
                </span>
                <span className="shrink-0 text-2xs tabular-nums text-ink-faint">{ds.records}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
