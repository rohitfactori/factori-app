"use client";

import { useMemo, useState } from "react";
import { Target, Check, Plus, Save, Zap, Layers, Lock, Sparkles } from "lucide-react";
import {
  RULES,
  estimateSize,
  buildGeos,
  PROFILE,
  DESTINATIONS,
  AUDIENCE,
  INDEX,
  type RuleGroup,
} from "@/lib/mock/audience";
import { AppMap } from "./AppMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { fmtCompact, fmtPct } from "@/lib/format";

const GROUPS: RuleGroup[] = ["Geography", "Demographics", "Behavior", "Device"];

export function AudienceApp() {
  const geos = useMemo(() => buildGeos(), []);
  const [enabled, setEnabled] = useState<Set<string>>(
    () => new Set(["income", "age", "fitness", "ctv"])
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setEnabled((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const size = useMemo(() => estimateSize(enabled), [enabled]);
  const pctOfCA = size / AUDIENCE.base;
  const ctvReach = Math.round(size * 0.68);

  const [expansion, setExpansion] = useState(0);
  const expanded = Math.round(size * (1 + (expansion / 100) * 3));
  const precision = Math.max(40, Math.round(100 - expansion * 0.5));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-7 shrink-0 place-items-center rounded-md bg-accent-tint text-accent">
            <Target className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-ink">{AUDIENCE.name}</div>
            <div className="truncate text-2xs text-ink-faint">
              {fmtCompact(size)} people · {fmtPct(pctOfCA, 1)} of California
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge tone="accent">Beta</Badge>
          <Button variant="secondary" size="sm">
            <Save className="size-3.5" />
            Save
          </Button>
          <Button variant="primary" size="sm">
            <Zap className="size-3.5" />
            Activate
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* definition */}
        <aside className="flex w-[316px] shrink-0 flex-col border-r border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="label-eyebrow">Definition</span>
            <button className="flex items-center gap-1 text-2xs text-accent hover:underline">
              <Plus className="size-3" />
              Add rule
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {GROUPS.map((g) => {
              const rules = RULES.filter((r) => r.group === g);
              if (!rules.length) return null;
              return (
                <div key={g}>
                  <div className="label-eyebrow mb-1.5">{g}</div>
                  <div className="space-y-1">
                    {rules.map((r) => {
                      const on = r.locked || enabled.has(r.id);
                      return (
                        <button
                          key={r.id}
                          disabled={r.locked}
                          onClick={() => toggle(r.id)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors",
                            on
                              ? "border-accent-dim/50 bg-accent-tint/40"
                              : "border-line bg-canvas/40 hover:border-line-strong",
                            r.locked && "opacity-90"
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-4 shrink-0 place-items-center rounded border",
                              on ? "border-accent bg-accent text-accent-ink" : "border-line-strong"
                            )}
                          >
                            {on && <Check className="size-3" />}
                          </span>
                          <span className={cn("flex-1 text-xs", on ? "text-ink" : "text-ink-muted")}>
                            {r.label}
                          </span>
                          {r.locked && <Lock className="size-3 shrink-0 text-ink-faint" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-line p-3">
            <div className="rounded-lg border border-accent-dim/40 bg-accent-tint/40 p-3">
              <div className="label-eyebrow">Estimated audience</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-accent">
                {fmtCompact(size)}
              </div>
              <div className="mt-0.5 text-2xs text-ink-muted">
                people · {fmtPct(pctOfCA, 1)} of California · 73% match rate
              </div>
            </div>
          </div>
        </aside>

        {/* map */}
        <div className="relative min-w-0 flex-1">
          <AppMap
            center={[-119.4179, 36.7783]}
            zoom={5.4}
            areas={geos}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-line bg-panel/85 px-2.5 py-1.5 backdrop-blur-md">
            <div className="label-eyebrow flex items-center gap-1.5">
              <Layers className="size-3" />
              Audience density · California
            </div>
          </div>
        </div>

        {/* summary */}
        <aside className="flex w-[320px] shrink-0 flex-col divide-y divide-line overflow-y-auto border-l border-line bg-panel">
          <div className="grid grid-cols-3 divide-x divide-line">
            <Stat label="Audience" value={fmtCompact(size)} accent />
            <Stat label="Match rate" value="73%" />
            <Stat label="CTV reach" value={fmtCompact(ctvReach)} />
          </div>

          <div className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="label-eyebrow flex items-center gap-1.5">
                <Sparkles className="size-3 text-accent" />
                Lookalike expansion
              </div>
              <span className="text-xs tabular-nums text-ink">
                {expansion === 0 ? "Seed" : `+${expansion}%`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={expansion}
              onChange={(e) => setExpansion(Number(e.target.value))}
              className="h-1 w-full cursor-pointer"
              style={{ accentColor: "var(--color-accent)" }}
            />
            <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
              <span>Precise</span>
              <span>Broad reach</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-md border border-line bg-canvas/40 px-2.5 py-1.5">
                <div className="label-eyebrow">Expanded reach</div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-accent">
                  {fmtCompact(expanded)}
                </div>
              </div>
              <div className="rounded-md border border-line bg-canvas/40 px-2.5 py-1.5">
                <div className="label-eyebrow">Precision</div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-ink">{precision}%</div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="label-eyebrow mb-2.5">Over-index vs. average (100)</div>
            <IndexBars data={INDEX} />
          </div>

          <div className="p-4">
            <div className="label-eyebrow mb-2.5">Audience profile</div>
            <div className="space-y-3">
              <MiniBars title="Age" data={PROFILE.age} />
              <MiniBars title="Household income" data={PROFILE.income} />
              <MiniBars title="Primary device" data={PROFILE.device} />
            </div>
          </div>

          <div className="p-4">
            <div className="label-eyebrow mb-2.5">Activate to</div>
            <div className="space-y-1.5">
              {DESTINATIONS.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center gap-2.5 rounded-md border border-line px-2.5 py-2"
                >
                  <span className="flex-1 truncate text-xs text-ink">{d.name}</span>
                  <span className="text-2xs tabular-nums text-ink-faint">{d.reach}% reach</span>
                </div>
              ))}
            </div>
            <Button variant="primary" className="mt-3 w-full">
              <Zap className="size-3.5" />
              Activate audience
            </Button>
            <div className="mt-2.5 text-2xs leading-relaxed text-ink-faint">
              Built from Movement, People & Demographics graphs; resolved to devices
              via the Cross-Device / CTV graph.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="px-3 py-2.5">
      <div className="label-eyebrow truncate">{label}</div>
      <div className={cn("mt-0.5 text-sm font-semibold tabular-nums", accent ? "text-accent" : "text-ink")}>
        {value}
      </div>
    </div>
  );
}

function IndexBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 120);
  const basePct = (100 / max) * 100;
  return (
    <div className="space-y-1.5">
      {data.map((d) => {
        const over = d.value >= 100;
        return (
          <div key={d.label} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate text-[11px] text-ink-faint">{d.label}</span>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-panel-3">
              <span
                className="block h-full rounded-full"
                style={{ width: `${(d.value / max) * 100}%`, background: over ? "#33D6C6" : "#E3B341" }}
              />
              <span className="absolute inset-y-0 w-px bg-ink-faint/70" style={{ left: `${basePct}%` }} />
            </div>
            <span
              className={cn("w-8 shrink-0 text-right text-[11px] font-medium tabular-nums", over ? "text-accent" : "text-warning")}
            >
              {d.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MiniBars({ title, data }: { title: string; data: { label: string; v: number }[] }) {
  const max = Math.max(...data.map((d) => d.v));
  return (
    <div>
      <div className="mb-1 text-xs text-ink-muted">{title}</div>
      <div className="space-y-1">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="w-20 shrink-0 truncate text-[11px] text-ink-faint">{d.label}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-3">
              <span
                className="block h-full rounded-full bg-accent"
                style={{ width: `${(d.v / max) * 100}%` }}
              />
            </span>
            <span className="w-7 shrink-0 text-right text-[11px] tabular-nums text-ink-muted">
              {d.v}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
