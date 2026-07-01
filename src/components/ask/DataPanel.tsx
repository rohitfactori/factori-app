"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowUpRight, X } from "lucide-react";
import { useAsk } from "@/lib/store/ask";
import { cn } from "@/lib/cn";
import { fmtInt } from "@/lib/format";
import { TabBar } from "@/components/ui/field";

type Tab = "results" | "layers" | "data";

export function DataPanel({
  onClose,
  className,
}: {
  onClose?: () => void;
  className?: string;
}) {
  const result = useAsk((s) => s.result);
  const [tab, setTab] = useState<Tab>("results");
  if (!result) return null;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-line bg-panel/92 backdrop-blur-md",
        className
      )}
    >
      {onClose && (
        <div className="flex h-8 shrink-0 items-center justify-between border-b border-line px-3">
          <div className="label-eyebrow capitalize">
            {result.kind} · {result.place}
          </div>
          <button
            onClick={onClose}
            className="grid size-5 place-items-center rounded text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink"
            aria-label="Hide data panel"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="grid shrink-0 grid-cols-2 gap-px bg-line">
        {result.scorecards.map((c) => (
          <div key={c.label} className="bg-panel px-3 py-2">
            <div className="label-eyebrow truncate">{c.label}</div>
            <div
              className={cn(
                "mt-0.5 text-[15px] font-semibold tabular-nums",
                c.tone === "accent"
                  ? "text-accent"
                  : c.tone === "positive"
                    ? "text-positive"
                    : "text-ink"
              )}
            >
              {c.value}
            </div>
            {c.sub && <div className="truncate text-[10px] text-ink-faint">{c.sub}</div>}
          </div>
        ))}
      </div>

      <div className="shrink-0 px-2.5">
        <TabBar<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "results", label: "Results", count: result.features.length },
            { value: "layers", label: "Layers" },
            { value: "data", label: "Data" },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "results" && <ResultsList />}
        {tab === "layers" && <LayersControls />}
        {tab === "data" && <DataProvenance />}
      </div>
    </div>
  );
}

function ResultsList() {
  const result = useAsk((s) => s.result!);
  const selectedId = useAsk((s) => s.selectedId);
  const select = useAsk((s) => s.selectFeature);
  const max = Math.max(...result.features.map((f) => f.value));
  return (
    <div>
      <div className="label-eyebrow px-3 py-1.5">{result.rankLabel}</div>
      {result.features.map((f, i) => {
        const active = selectedId === f.id;
        return (
          <button
            key={f.id}
            onClick={() => select(active ? null : f.id)}
            className={cn(
              "relative flex w-full items-center gap-2.5 border-t border-line/60 px-3 py-1.5 text-left transition-colors",
              active ? "bg-panel-3" : "hover:bg-panel-2/60"
            )}
          >
            {active && <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-accent" />}
            <span className="w-4 shrink-0 text-right text-[11px] tabular-nums text-ink-faint">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs text-ink">{f.name}</span>
              <span className="block truncate text-[10px] text-ink-faint">{f.sub}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-xs font-medium tabular-nums text-ink">{f.metric}</span>
              <span className="mt-0.5 block h-0.5 w-12 overflow-hidden rounded-full bg-panel-3">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round((f.value / max) * 100)}%` }} />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function LayersControls() {
  const layers = useAsk((s) => s.layers);
  const toggle = useAsk((s) => s.toggleLayer);
  const controls = useAsk((s) => s.controls);
  const setControl = useAsk((s) => s.setControl);
  return (
    <div className="space-y-3 p-2.5">
      <div className="space-y-0.5">
        <div className="label-eyebrow px-1 pb-1">Map layers</div>
        {layers.map((l) => (
          <button
            key={l.id}
            onClick={() => toggle(l.id)}
            className="flex w-full items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-panel-2/60"
          >
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: l.color, opacity: l.visible ? 1 : 0.25 }} />
            <span className={cn("truncate text-xs", l.visible ? "text-ink" : "text-ink-faint")}>{l.label}</span>
            {l.count != null && <span className="ml-auto text-[10px] tabular-nums text-ink-faint">{fmtInt(l.count)}</span>}
            {l.visible ? (
              <Eye className={cn("size-3.5 text-ink-faint", l.count == null && "ml-auto")} />
            ) : (
              <EyeOff className={cn("size-3.5 text-ink-faint", l.count == null && "ml-auto")} />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-2.5 border-t border-line pt-2.5">
        <div className="label-eyebrow px-1">Filters</div>
        {controls.map((c) => {
          if (c.kind === "slider") {
            return (
              <div key={c.id} className="px-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-muted">{c.label}</span>
                  <span className="text-xs tabular-nums text-ink">
                    {c.value.toLocaleString()}
                    {c.unit ?? ""}
                  </span>
                </div>
                <input
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={c.value}
                  onChange={(e) => setControl(c.id, Number(e.target.value))}
                  className="mt-1.5 h-1 w-full cursor-pointer"
                  style={{ accentColor: "var(--color-accent)" }}
                />
              </div>
            );
          }
          if (c.kind === "select") {
            return (
              <label key={c.id} className="block px-1">
                <span className="mb-1 block text-xs text-ink-muted">{c.label}</span>
                <select
                  value={c.value}
                  onChange={(e) => setControl(c.id, e.target.value)}
                  className="h-7 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent-dim"
                >
                  {c.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
            );
          }
          return (
            <button key={c.id} onClick={() => setControl(c.id, !c.value)} className="flex w-full items-center justify-between px-1">
              <span className="text-xs text-ink-muted">{c.label}</span>
              <span className={cn("relative h-4 w-7 rounded-full transition-colors", c.value ? "bg-accent" : "bg-panel-3")}>
                <span className={cn("absolute top-0.5 size-3 rounded-full bg-canvas transition-all", c.value ? "left-3.5" : "left-0.5")} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DataProvenance() {
  const prov = useAsk((s) => s.result!.provenance);
  const credits = prov.reduce((s, p) => s + p.credits, 0);
  return (
    <div className="space-y-2 p-2.5">
      <div className="flex items-center justify-between px-1">
        <span className="label-eyebrow">Datasets behind this answer</span>
        <span className="rounded bg-accent-tint px-1 text-[10px] font-medium text-accent">{credits} cr</span>
      </div>
      {prov.map((p) => (
        <Link
          key={p.dataset}
          href="/catalog"
          className="group block rounded-md border border-line/60 px-2 py-1.5 transition-colors hover:border-line-strong hover:bg-panel-2/50"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-xs text-ink">{p.dataset}</span>
            <ArrowUpRight className="size-3 shrink-0 text-ink-faint transition-colors group-hover:text-accent" />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10px] text-ink-faint">
            <span>{p.category}</span>
            <span>·</span>
            <span>{p.coverage}</span>
            <span>·</span>
            <span>{p.freshness}</span>
          </div>
        </Link>
      ))}
      <div className="rounded-md border border-dashed border-line px-2 py-2 text-[11px] leading-relaxed text-ink-faint">
        Use the same data programmatically via <span className="text-ink-muted">REST API</span>,{" "}
        <span className="text-ink-muted">MCP server</span>, or <span className="text-ink-muted">cloud delivery</span> →
      </div>
    </div>
  );
}
