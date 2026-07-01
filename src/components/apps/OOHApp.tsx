"use client";

import { useMemo, useState } from "react";
import { Tv, Plus, Check, Download, Layers, Zap, Lightbulb } from "lucide-react";
import { buildPanels, OOH_CAMPAIGN, type Panel } from "@/lib/mock/ooh";
import { AppMap } from "./AppMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { fmtCompact, fmtUSD, fmtUSDCompact } from "@/lib/format";

const idxHex = (i: number) =>
  i >= 190 ? "#45e0cb" : i >= 150 ? "#33D6C6" : i >= 115 ? "#E3B341" : "#E98AA0";

export function OOHApp() {
  const panels = useMemo(() => buildPanels(), []);
  const [selectedId, setSelectedId] = useState<string | null>(panels[0]?.id ?? null);
  const [plan, setPlan] = useState<Set<string>>(
    () => new Set(panels.slice(0, 4).map((p) => p.id))
  );
  const selected = panels.find((p) => p.id === selectedId) ?? null;

  const togglePlan = (id: string) =>
    setPlan((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const summary = useMemo(() => {
    const inPlan = panels.filter((p) => plan.has(p.id));
    const impressions = inPlan.reduce((s, p) => s + p.impressions, 0);
    const reach = Math.round(inPlan.reduce((s, p) => s + p.reach, 0) * 0.72);
    const budget = inPlan.reduce((s, p) => s + p.price, 0);
    const freq = reach ? +(impressions / reach).toFixed(1) : 0;
    return { count: inPlan.length, impressions, reach, budget, freq };
  }, [panels, plan]);

  const mapPoints = panels.map((p) => ({ id: p.id, lng: p.lng, lat: p.lat, value: p.index }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-7 shrink-0 place-items-center rounded-md bg-accent-tint text-accent">
            <Tv className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-ink">{OOH_CAMPAIGN.name}</div>
            <div className="truncate text-2xs text-ink-faint">{OOH_CAMPAIGN.audience}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge tone="accent">Beta</Badge>
          <Button variant="primary" size="sm">
            <Download className="size-3.5" />
            Export plan
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* inventory */}
        <aside className="flex w-[300px] shrink-0 flex-col border-r border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="label-eyebrow">Inventory</span>
            <span className="text-2xs text-ink-faint">{panels.length} panels · by index</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {panels.map((p) => (
              <PanelRow
                key={p.id}
                panel={p}
                active={p.id === selectedId}
                inPlan={plan.has(p.id)}
                onClick={() => setSelectedId(p.id)}
                onToggle={() => togglePlan(p.id)}
              />
            ))}
          </div>
        </aside>

        {/* map */}
        <div className="relative min-w-0 flex-1">
          <AppMap
            center={[-118.2437, 34.0522]}
            zoom={9.6}
            points={mapPoints}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-line bg-panel/85 px-2.5 py-1.5 backdrop-blur-md">
            <div className="label-eyebrow flex items-center gap-1.5">
              <Layers className="size-3" />
              Audience index · {OOH_CAMPAIGN.market}
            </div>
          </div>
        </div>

        {/* detail + campaign */}
        <aside className="flex w-[320px] shrink-0 flex-col overflow-y-auto border-l border-line bg-panel">
          {selected && (
            <PanelDetail
              panel={selected}
              inPlan={plan.has(selected.id)}
              onToggle={() => togglePlan(selected.id)}
            />
          )}
          <CampaignSummary summary={summary} />
        </aside>
      </div>
    </div>
  );
}

function PanelRow({
  panel,
  active,
  inPlan,
  onClick,
  onToggle,
}: {
  panel: Panel;
  active: boolean;
  inPlan: boolean;
  onClick: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer items-center gap-2.5 border-b border-line/60 px-3 py-2 transition-colors",
        active ? "bg-panel-3" : "hover:bg-panel-2/50"
      )}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />}
      <span
        className="grid size-8 shrink-0 place-items-center rounded-md text-xs font-semibold tabular-nums"
        style={{ background: `${idxHex(panel.index)}1f`, color: idxHex(panel.index) }}
      >
        {panel.index}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-ink">{panel.name}</span>
        <span className="block truncate text-[10px] text-ink-faint">
          {panel.format} · {fmtCompact(panel.impressions)} imp
        </span>
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-md border transition-colors",
          inPlan
            ? "border-accent-dim bg-accent text-accent-ink"
            : "border-line text-ink-faint hover:border-line-strong hover:text-ink"
        )}
        aria-label={inPlan ? "Remove from plan" : "Add to plan"}
      >
        {inPlan ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
      </button>
    </div>
  );
}

function PanelDetail({
  panel,
  inPlan,
  onToggle,
}: {
  panel: Panel;
  inPlan: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-line p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink">{panel.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Badge tone={panel.format === "Digital" ? "accent" : "neutral"}>{panel.format}</Badge>
            {panel.illuminated && (
              <span className="flex items-center gap-1 text-[10px] text-ink-faint">
                <Lightbulb className="size-3" />
                Illuminated
              </span>
            )}
          </div>
        </div>
        <div
          className="grid size-12 shrink-0 place-items-center rounded-lg text-base font-bold tabular-nums"
          style={{ background: `${idxHex(panel.index)}1f`, color: idxHex(panel.index) }}
        >
          {panel.index}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Mini label="Impressions / 4wk" value={fmtCompact(panel.impressions)} />
        <Mini label="Net reach" value={fmtCompact(panel.reach)} />
        <Mini label="Frequency" value={`${panel.frequency}×`} />
        <Mini label="Rate / 4wk" value={fmtUSD(panel.price)} />
      </div>

      <Button
        variant={inPlan ? "secondary" : "primary"}
        className="mt-3 w-full"
        onClick={onToggle}
      >
        {inPlan ? (
          <>
            <Check className="size-3.5" />
            In plan
          </>
        ) : (
          <>
            <Plus className="size-3.5" />
            Add to plan
          </>
        )}
      </Button>
    </div>
  );
}

function CampaignSummary({
  summary,
}: {
  summary: { count: number; impressions: number; reach: number; budget: number; freq: number };
}) {
  const over = summary.budget > OOH_CAMPAIGN.budget;
  const pct = Math.min(100, Math.round((summary.budget / OOH_CAMPAIGN.budget) * 100));
  return (
    <div className="p-4">
      <div className="label-eyebrow mb-2.5 flex items-center gap-1.5">
        <Zap className="size-3 text-accent" />
        Campaign plan · {summary.count} panels
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Mini label="Net reach" value={fmtCompact(summary.reach)} accent />
        <Mini label="Impressions" value={fmtCompact(summary.impressions)} />
        <Mini label="Avg frequency" value={`${summary.freq}×`} />
        <Mini label="Budget" value={fmtUSDCompact(summary.budget)} />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-muted">Budget used</span>
          <span className={cn("tabular-nums", over ? "text-negative" : "text-ink")}>
            {fmtUSDCompact(summary.budget)} / {fmtUSDCompact(OOH_CAMPAIGN.budget)}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel-3">
          <div
            className={cn("h-full rounded-full", over ? "bg-negative" : "bg-accent")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <Button variant="primary" className="mt-4 w-full">
        Activate campaign
      </Button>
      <div className="mt-2.5 text-2xs leading-relaxed text-ink-faint">
        Reach & frequency modeled from the Movement Graph; audience index from the
        People graph.
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-line bg-canvas/40 px-2.5 py-1.5">
      <div className="label-eyebrow truncate">{label}</div>
      <div className={cn("mt-0.5 text-sm font-semibold tabular-nums", accent ? "text-accent" : "text-ink")}>
        {value}
      </div>
    </div>
  );
}
