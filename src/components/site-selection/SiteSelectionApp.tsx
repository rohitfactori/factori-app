"use client";

import { useMemo, useState } from "react";
import {
  Store,
  Plus,
  Download,
  SlidersHorizontal,
  Layers,
  GitCompare,
  Database,
  RotateCcw,
  X,
  Check,
} from "lucide-react";
import {
  buildSites,
  siteDemographics,
  PROJECT,
  SCORE_WEIGHTS,
  type Site,
  type SubScores,
} from "@/lib/mock/sites";
import { SiteMap } from "./SiteMap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { fmtUSDCompact, fmtCompact } from "@/lib/format";
import { Columns } from "@/components/ui/charts";

const scoreHex = (s: number) =>
  s >= 82 ? "#45e0cb" : s >= 68 ? "#33D6C6" : s >= 55 ? "#E3B341" : "#E98AA0";
const scoreLabel = (s: number) =>
  s >= 82 ? "Strong" : s >= 68 ? "Good" : s >= 55 ? "Fair" : "Weak";

const DEFAULT_WEIGHTS: Record<keyof SubScores, number> = {
  demographics: 30,
  footfall: 28,
  competition: 18,
  accessibility: 14,
  cannibalization: 10,
};

export function SiteSelectionApp() {
  const rawSites = useMemo(() => buildSites(), []);
  const [weights, setWeights] = useState<Record<keyof SubScores, number>>(DEFAULT_WEIGHTS);
  const [showModel, setShowModel] = useState(false);

  const totalW = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const sites = useMemo(
    () =>
      rawSites.map((s) =>
        s.kind === "candidate"
          ? {
              ...s,
              score: Math.round(
                SCORE_WEIGHTS.reduce((sum, w) => sum + s.sub[w.key] * weights[w.key], 0) / totalW
              ),
            }
          : s
      ),
    [rawSites, weights, totalW]
  );
  const candidates = useMemo(
    () => sites.filter((s) => s.kind === "candidate").sort((a, b) => b.score - a.score),
    [sites]
  );

  const [selectedId, setSelectedId] = useState<string | null>(rawSites.find((s) => s.kind === "candidate")?.id ?? null);
  const selected = sites.find((s) => s.id === selectedId) ?? null;

  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const toggleCompare = (id: string) =>
    setCompareSet((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else if (n.size < 3) n.add(id);
      return n;
    });
  const compareSites = candidates.filter((c) => compareSet.has(c.id));

  return (
    <div className="relative flex h-full flex-col">
      {/* toolbar */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-7 shrink-0 place-items-center rounded-md bg-accent-tint text-accent">
            <Store className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-ink">{PROJECT.name}</div>
            <div className="truncate text-2xs text-ink-faint">{PROJECT.brand}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant={showModel ? "primary" : "secondary"}
            size="sm"
            onClick={() => setShowModel((v) => !v)}
          >
            <SlidersHorizontal className="size-3.5" />
            Scoring model
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={compareSet.size < 2}
            onClick={() => setShowCompare(true)}
          >
            <GitCompare className="size-3.5" />
            Compare{compareSet.size ? ` (${compareSet.size})` : ""}
          </Button>
          <Button variant="secondary" size="sm">
            <Plus className="size-3.5" />
            Add site
          </Button>
          <Button variant="primary" size="sm">
            <Download className="size-3.5" />
            Export
          </Button>
        </div>
      </div>

      {showModel && (
        <ScoringPopover
          weights={weights}
          totalW={totalW}
          onChange={(k, v) => setWeights((w) => ({ ...w, [k]: v }))}
          onReset={() => setWeights(DEFAULT_WEIGHTS)}
          onClose={() => setShowModel(false)}
        />
      )}

      {/* body */}
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[288px] shrink-0 flex-col border-r border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="label-eyebrow">Candidate sites</span>
            <span className="text-2xs text-ink-faint">{candidates.length} · ranked</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {candidates.map((s, i) => (
              <CandidateRow
                key={s.id}
                site={s}
                rank={i + 1}
                active={s.id === selectedId}
                inCompare={compareSet.has(s.id)}
                onClick={() => setSelectedId(s.id)}
                onToggleCompare={() => toggleCompare(s.id)}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 border-t border-line px-3 py-2 text-2xs text-ink-faint">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-accent" />
              Candidate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-viz-rose" />
              Existing store
            </span>
          </div>
        </aside>

        <div className="relative min-w-0 flex-1">
          <SiteMap sites={sites} selectedId={selectedId} onSelect={setSelectedId} />
          <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-line bg-panel/85 px-2.5 py-1.5 backdrop-blur-md">
            <div className="label-eyebrow flex items-center gap-1.5">
              <Layers className="size-3" />
              {PROJECT.metro}
            </div>
          </div>
        </div>

        <aside className="w-[324px] shrink-0 overflow-y-auto border-l border-line bg-panel">
          {selected ? (
            <SiteDetail site={selected} />
          ) : (
            <div className="p-4 text-sm text-ink-muted">Select a candidate site.</div>
          )}
        </aside>
      </div>

      {showCompare && (
        <CompareOverlay sites={compareSites} onClose={() => setShowCompare(false)} />
      )}
    </div>
  );
}

function ScoringPopover({
  weights,
  totalW,
  onChange,
  onReset,
  onClose,
}: {
  weights: Record<keyof SubScores, number>;
  totalW: number;
  onChange: (k: keyof SubScores, v: number) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-4 top-12 z-30 mt-1 w-[300px] rounded-lg border border-line bg-panel shadow-pop">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="label-eyebrow !text-ink-muted">Scoring model — weights</span>
        <div className="flex items-center gap-0.5">
          <button onClick={onReset} className="flex items-center gap-1 rounded px-1.5 py-1 text-2xs text-ink-faint hover:bg-panel-2 hover:text-ink">
            <RotateCcw className="size-3" />
            Reset
          </button>
          <button onClick={onClose} className="grid size-5 place-items-center rounded text-ink-faint hover:bg-panel-2 hover:text-ink">
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="space-y-2.5 p-3">
        {SCORE_WEIGHTS.map((w) => {
          const pct = Math.round((weights[w.key] / totalW) * 100);
          return (
            <div key={w.key}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">{w.label}</span>
                <span className="tabular-nums text-ink">{pct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={weights[w.key]}
                onChange={(e) => onChange(w.key, Number(e.target.value))}
                className="mt-1.5 h-1 w-full cursor-pointer"
                style={{ accentColor: "var(--color-accent)" }}
              />
            </div>
          );
        })}
        <div className="border-t border-line pt-2 text-2xs text-ink-faint">
          Candidates re-score and re-rank live as you adjust weights.
        </div>
      </div>
    </div>
  );
}

function CandidateRow({
  site,
  rank,
  active,
  inCompare,
  onClick,
  onToggleCompare,
}: {
  site: Site;
  rank: number;
  active: boolean;
  inCompare: boolean;
  onClick: () => void;
  onToggleCompare: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex w-full cursor-pointer items-center gap-2.5 border-b border-line/60 px-3 py-2 transition-colors",
        active ? "bg-panel-3" : "hover:bg-panel-2/50"
      )}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />}
      <span className="w-4 shrink-0 text-right text-[11px] tabular-nums text-ink-faint">{rank}</span>
      <span
        className="grid size-8 shrink-0 place-items-center rounded-md text-xs font-semibold tabular-nums"
        style={{ background: `${scoreHex(site.score)}1f`, color: scoreHex(site.score) }}
      >
        {site.score}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-ink">{site.name}</span>
        <span className="block truncate text-[10px] text-ink-faint">
          {fmtUSDCompact(site.revenue)} est · {scoreLabel(site.score)}
        </span>
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleCompare();
        }}
        title="Add to compare"
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded border transition-colors",
          inCompare
            ? "border-accent-dim bg-accent text-accent-ink"
            : "border-line text-transparent group-hover:text-ink-faint hover:!border-line-strong"
        )}
      >
        <Check className="size-3" />
      </button>
    </div>
  );
}

function CompareOverlay({ sites, onClose }: { sites: Site[]; onClose: () => void }) {
  if (!sites.length) return null;
  const winner = [...sites].sort((a, b) => b.score - a.score)[0];
  const cols = `140px repeat(${sites.length}, minmax(0, 1fr))`;
  const rows: { label: string; fmt: (s: Site) => string; val: (s: Site) => number }[] = [
    { label: "Est. revenue", fmt: (s) => fmtUSDCompact(s.revenue), val: (s) => s.revenue },
    { label: "Est. visits/yr", fmt: (s) => fmtCompact(s.visits), val: (s) => s.visits },
    { label: "Rent / sqft", fmt: (s) => `$${s.rent}`, val: (s) => -s.rent },
  ];
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-canvas">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <GitCompare className="size-4 text-accent" />
          Compare {sites.length} sites
        </div>
        <button
          onClick={onClose}
          className="grid size-7 place-items-center rounded-md text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-accent-dim/40 bg-accent-tint/40 px-3 py-2 text-xs">
            <span className="text-ink-muted">Recommended</span>
            <span className="font-medium text-ink">{winner.name}</span>
            <span className="text-ink-faint">— highest weighted score ({winner.score})</span>
          </div>

          <div className="grid gap-2" style={{ gridTemplateColumns: cols }}>
            <div />
            {sites.map((s) => (
              <div key={s.id} className="rounded-lg border border-line bg-panel p-3 text-center">
                <div className="truncate text-xs font-medium text-ink">{s.name}</div>
                <div
                  className="mx-auto mt-2 grid size-10 place-items-center rounded-lg text-base font-bold tabular-nums"
                  style={{ background: `${scoreHex(s.score)}1f`, color: scoreHex(s.score) }}
                >
                  {s.score}
                </div>
                <div className="mt-1 text-[10px]" style={{ color: scoreHex(s.score) }}>
                  {scoreLabel(s.score)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 divide-y divide-line rounded-lg border border-line">
            {rows.map((r) => {
              const maxVal = Math.max(...sites.map(r.val));
              return (
                <div key={r.label} className="grid items-center gap-2 px-3 py-2.5" style={{ gridTemplateColumns: cols }}>
                  <div className="text-xs text-ink-muted">{r.label}</div>
                  {sites.map((s) => (
                    <div
                      key={s.id}
                      className={cn("text-center text-xs tabular-nums", r.val(s) === maxVal ? "font-semibold text-accent" : "text-ink")}
                    >
                      {r.fmt(s)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="label-eyebrow mb-2">Score breakdown</div>
            <div className="space-y-3 rounded-lg border border-line p-4">
              {SCORE_WEIGHTS.map((w) => {
                const maxVal = Math.max(...sites.map((s) => s.sub[w.key]));
                return (
                  <div key={w.key} className="grid items-center gap-3" style={{ gridTemplateColumns: cols }}>
                    <div className="text-xs text-ink-muted">{w.label}</div>
                    {sites.map((s) => {
                      const v = s.sub[w.key];
                      const best = v === maxVal;
                      return (
                        <div key={s.id} className="flex items-center gap-2">
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-3">
                            <span className="block h-full rounded-full" style={{ width: `${v}%`, background: best ? "#45e0cb" : scoreHex(v) }} />
                          </span>
                          <span className={cn("w-6 text-right text-[11px] tabular-nums", best ? "font-semibold text-accent" : "text-ink-muted")}>
                            {v}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-canvas/40 px-2.5 py-1.5">
      <div className="label-eyebrow truncate">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-ink">{value}</div>
    </div>
  );
}

function SiteDetail({ site }: { site: Site }) {
  const overlap = Math.max(4, 100 - site.sub.cannibalization);
  const demo = siteDemographics(site);
  return (
    <div className="divide-y divide-line">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink">{site.name}</div>
            <div className="mt-0.5 text-xs text-ink-faint">{site.address}</div>
          </div>
          <div
            className="grid size-12 shrink-0 place-items-center rounded-lg text-lg font-bold tabular-nums"
            style={{ background: `${scoreHex(site.score)}1f`, color: scoreHex(site.score) }}
          >
            {site.score}
          </div>
        </div>
        <div className="mt-1 text-2xs" style={{ color: scoreHex(site.score) }}>
          {scoreLabel(site.score)} site · weighted score
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-line">
        <Stat label="Est. revenue" value={fmtUSDCompact(site.revenue)} />
        <Stat label="Est. visits/yr" value={fmtCompact(site.visits)} />
        <Stat label="Rent / sqft" value={`$${site.rent}`} />
      </div>

      <div className="p-4">
        <div className="label-eyebrow mb-2.5">Score breakdown</div>
        <div className="space-y-2.5">
          {SCORE_WEIGHTS.map((w) => {
            const v = site.sub[w.key];
            return (
              <div key={w.key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted">{w.label}</span>
                  <span className="tabular-nums text-ink">{v}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-panel-3">
                  <div className="h-full rounded-full" style={{ width: `${v}%`, background: scoreHex(v) }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        <div className="label-eyebrow mb-2.5">Trade-area demographics</div>
        <div className="grid grid-cols-2 gap-2">
          <DemoStat label="Population" value={fmtCompact(demo.population)} />
          <DemoStat label="Median HHI" value={`$${demo.income}k`} />
          <DemoStat label="Daytime pop" value={fmtCompact(demo.daytime)} />
          <DemoStat label="Median age" value={String(demo.age)} />
        </div>
        <div className="mt-3">
          <div className="mb-1.5 text-[11px] text-ink-muted">Age mix</div>
          <Columns data={demo.ageBands} height={60} />
        </div>
      </div>

      <div className="p-4">
        <div className="rounded-lg border border-line bg-panel-2/40 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-ink">
            <GitCompare className="size-3.5 text-ink-faint" />
            Cannibalization
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
            Trade area overlaps ~<span className="font-medium text-ink">{overlap}%</span> with the
            nearest existing store. Net-new demand stays healthy.
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-2">
          <Button variant="primary" className="flex-1">
            Add to shortlist
          </Button>
          <Button variant="secondary">
            <GitCompare className="size-3.5" />
            Compare
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-2xs text-ink-faint">
          <Database className="size-3" />
          Scored from Demographics, Movement & Places graphs
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5">
      <div className="label-eyebrow truncate">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-ink">{value}</div>
    </div>
  );
}
