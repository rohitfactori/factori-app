"use client";

import { Eye, EyeOff, X } from "lucide-react";
import { getDataset } from "@/lib/mock/platform";
import { LAYER_CONFIGS, METRIC_BY_ID, rampFor, rendersHex } from "@/lib/explore/metrics";
import { LA } from "@/lib/snapshot/la-meta";
import type { ExploreLayer, PoiCategory } from "@/lib/snapshot/types";
import { useExplore } from "@/lib/store/explore";
import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { RampLegend } from "./RampLegend";

function MiniSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <label className="block min-w-0 flex-1">
      <div className="label-eyebrow mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-full rounded-md border border-line bg-canvas px-1.5 text-xs text-ink outline-none focus:border-accent-dim"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LayerCard({ layer }: { layer: ExploreLayer }) {
  const updateLayer = useExplore((s) => s.updateLayer);
  const toggleVisible = useExplore((s) => s.toggleVisible);
  const removeLayer = useExplore((s) => s.removeLayer);
  const openDataSheet = useExplore((s) => s.openDataSheet);

  const cfg = LAYER_CONFIGS[layer.datasetId];
  const ds = getDataset(layer.datasetId);
  if (!cfg || !ds) return null;

  const hexed = rendersHex(layer);
  const dot = rampFor(layer)[4];
  const showPoiCat = layer.datasetId === "places-poi";

  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-panel/90 p-2.5 shadow-panel backdrop-blur-md transition-opacity",
        !layer.visible && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="size-2 shrink-0 rounded-full" style={{ background: dot }} />
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">{ds.name}</span>
        <span className="shrink-0 text-2xs text-ink-faint">{ds.freshness}</span>
        <IconButton
          size="xs"
          aria-label={layer.visible ? "Hide layer" : "Show layer"}
          onClick={() => toggleVisible(layer.id)}
        >
          {layer.visible ? <Eye /> : <EyeOff />}
        </IconButton>
        <IconButton size="xs" aria-label="Remove layer" onClick={() => removeLayer(layer.id)}>
          <X />
        </IconButton>
      </div>

      <div className="mt-2 flex gap-2">
        {cfg.metricIds.length > 1 && (
          <MiniSelect
            label={cfg.metricLabel}
            value={layer.metricId}
            onChange={(v) => updateLayer(layer.id, { metricId: v })}
            options={cfg.metricIds.map((m) => ({ id: m, label: METRIC_BY_ID[m].label }))}
          />
        )}
        {cfg.variants && (
          <MiniSelect
            label={cfg.variantLabel ?? "Variant"}
            value={layer.variant ?? cfg.defaultVariant ?? cfg.variants[0].id}
            onChange={(v) => updateLayer(layer.id, { variant: v })}
            options={cfg.variants}
          />
        )}
        {showPoiCat && (
          <MiniSelect
            label="Category"
            value={layer.poiCat ?? "all"}
            onChange={(v) => updateLayer(layer.id, { poiCat: v as PoiCategory | "all" })}
            options={[{ id: "all", label: "All categories" }, ...LA.poiCats]}
          />
        )}
      </div>

      {hexed && (
        <div className="mt-2 flex items-center gap-2">
          <span className="label-eyebrow w-12 shrink-0">Opacity</span>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={layer.opacity}
            onChange={(e) => updateLayer(layer.id, { opacity: Number(e.target.value) })}
            className="h-1 min-w-0 flex-1"
            style={{ accentColor: "var(--color-accent)" }}
          />
          <span className="w-8 shrink-0 text-right text-2xs tabular-nums text-ink-faint">
            {Math.round(layer.opacity * 100)}%
          </span>
        </div>
      )}

      {hexed && (
        <div className="mt-2">
          <RampLegend layer={layer} />
        </div>
      )}

      <button
        onClick={() => openDataSheet(layer.datasetId)}
        className="mt-2 text-2xs font-medium text-accent hover:underline"
      >
        Get this data
      </button>
    </div>
  );
}
