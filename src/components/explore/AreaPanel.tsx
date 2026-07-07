"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { getSnapshotSync } from "@/lib/snapshot/client";
import { LA } from "@/lib/snapshot/la-meta";
import { POI_COLORS } from "@/lib/explore/metrics";
import { useExplore } from "@/lib/store/explore";
import { fmtCompact, fmtUSDCompact } from "@/lib/format";
import { AreaChart, Bars, Delta, Donut } from "@/components/ui/charts";
import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";

const AGE_LABELS = ["18–24", "25–34", "35–44", "45–54", "55+"];
const INC_LABELS = ["<$50k", "$50–100k", "$100–150k", "$150k+"];

function Section({
  title,
  dataset,
  datasetId,
  children,
}: {
  title: string;
  dataset: string;
  datasetId: string;
  children: React.ReactNode;
}) {
  const openDataSheet = useExplore((s) => s.openDataSheet);
  return (
    <section className="border-b border-line/70 px-3.5 py-3 last:border-0">
      <div className="mb-2 flex items-center gap-2">
        <span className="label-eyebrow flex-1">{title}</span>
        <button
          onClick={() => openDataSheet(datasetId)}
          className="rounded-full border border-line bg-panel-2/60 px-1.5 py-px text-2xs text-ink-faint transition-colors hover:border-line-strong hover:text-ink-muted"
          title={`From ${dataset} — see schema, sample and API`}
        >
          {dataset}
        </button>
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, extra }: { label: string; value: string; extra?: React.ReactNode }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="truncate text-2xs text-ink-faint">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-base font-semibold tabular-nums text-ink">{value}</span>
        {extra}
      </div>
    </div>
  );
}

export function AreaPanel() {
  const selectedHex = useExplore((s) => s.selectedHex);
  const selectHex = useExplore((s) => s.selectHex);
  const setChatOpen = useExplore((s) => s.setChatOpen);
  const submitChat = useExplore((s) => s.submitChat);
  const openDataSheet = useExplore((s) => s.openDataSheet);

  useEffect(() => {
    if (!selectedHex) return;
    const onKey = (e: KeyboardEvent) => {
      // the data sheet owns Escape while it's open
      if (e.key === "Escape" && !useExplore.getState().dataSheetFor) selectHex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedHex, selectHex]);

  const snap = getSnapshotSync();
  const p = selectedHex && snap ? snap.byId.get(selectedHex) : null;
  if (!p || !snap) return null;

  const avg = snap.avg;
  const visitsDelta = avg.mv_visits ? (p.mv_visits / avg.mv_visits - 1) * 100 : 0;
  const topSegments = [...LA.segments]
    .map((s) => ({ ...s, v: (p as unknown as Record<string, number>)[s.id] ?? 0 }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3);

  return (
    <aside className="animate-rise absolute bottom-3 right-3 top-16 z-10 flex w-[380px] flex-col overflow-hidden rounded-xl border border-line bg-panel/95 shadow-pop backdrop-blur-md">
      <header className="flex items-start gap-2 border-b border-line px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <div className="label-eyebrow">Area intelligence</div>
          <div className="mt-0.5 truncate text-sm font-semibold text-ink">{p.label}</div>
          <div className="mt-0.5 font-mono text-2xs text-ink-faint">
            {p.h3} · {p.h3.startsWith("88") ? "res 8 · ~0.7 km²" : "res 7 · ~5 km²"}
          </div>
        </div>
        <IconButton size="xs" aria-label="Close panel" onClick={() => selectHex(null)}>
          <X />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section title="Movement" dataset="Global Movement Graph" datasetId="movement-graph">
          <div className="flex gap-3">
            <Stat label="Visits / month" value={fmtCompact(p.mv_visits)} extra={<Delta value={visitsDelta} />} />
            <Stat label="Median dwell" value={`${p.mv_dwell}m`} />
          </div>
          <div className="mt-2.5">
            <AreaChart data={p.tr.map((v, i) => ({ label: LA.months[i], value: v }))} height={64} />
          </div>
          <div className="mt-2.5">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-panel-3">
              <span className="h-full bg-accent" style={{ width: `${p.mv_day * 100}%` }} />
              <span className="h-full bg-viz-violet" style={{ width: `${p.mv_eve * 100}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-2xs text-ink-faint">
              <span>Daytime {Math.round(p.mv_day * 100)}%</span>
              <span>Evening {Math.round(p.mv_eve * 100)}%</span>
            </div>
          </div>
        </Section>

        <Section title="People" dataset="Demographics & Income" datasetId="demographics-income">
          <div className="flex gap-3">
            <Stat label="Population" value={fmtCompact(p.dm_pop)} />
            <Stat label="Median age" value={String(p.dm_age)} />
            <Stat label="HH income" value={fmtUSDCompact(p.dm_hhi)} />
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-2xs text-ink-faint">Age mix</div>
              <Bars
                labelWidth={44}
                data={p.dm_age_mix.map((v, i) => ({ label: AGE_LABELS[i], value: Math.round(v * 100) }))}
                unit="%"
              />
            </div>
            <div>
              <div className="mb-1 text-2xs text-ink-faint">Income mix</div>
              <Bars
                labelWidth={56}
                data={p.dm_inc_mix.map((v, i) => ({ label: INC_LABELS[i], value: Math.round(v * 100) }))}
                unit="%"
              />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="mb-1 text-2xs text-ink-faint">Top audience segments</div>
            <div className="flex flex-wrap gap-1.5">
              {topSegments.map((s) => (
                <Badge key={s.id} tone="accent">
                  {s.label} · {s.v.toFixed(0)}%
                </Badge>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Spend" dataset="Consumer Spend Signals" datasetId="consumer-spend">
          <Bars
            labelWidth={82}
            data={LA.spendCats.map((c) => ({
              label: c.label,
              value: (p as unknown as Record<string, number>)[c.id] ?? 0,
              color: ((p as unknown as Record<string, number>)[c.id] ?? 0) >= 100 ? undefined : "#5e6a69",
            }))}
          />
          <div className="mt-1.5 text-2xs text-ink-faint">Spend index · metro average = 100</div>
        </Section>

        <Section title="Places" dataset="Places & POI Graph" datasetId="places-poi">
          {p.poi_count === 0 ? (
            <div className="text-2xs text-ink-faint">No tracked POIs in this hex — mostly residential.</div>
          ) : (
            <Donut
              size={84}
              thickness={11}
              centerLabel={String(p.poi_count)}
              centerSub="POIs"
              segments={LA.poiCats
                .map((c) => ({
                  label: c.label,
                  value: (p as unknown as Record<string, number>)[`poi_${c.id}`] ?? 0,
                  color: POI_COLORS[c.id],
                }))
                .filter((s) => s.value > 0)}
            />
          )}
          {p.poi_top.length > 0 && (
            <div className="mt-2.5">
              <div className="mb-1 text-2xs text-ink-faint">Notable brands</div>
              <div className="flex flex-wrap gap-1.5">
                {p.poi_top.map((b) => (
                  <Badge key={b}>{b}</Badge>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Loyalty" dataset="Brand Visitation & Loyalty" datasetId="brand-visitation">
          <div className="mb-1 text-2xs text-ink-faint">Visitors to this area also visit</div>
          <div className="flex flex-wrap gap-1.5">
            {p.bl_top.map((b) => (
              <Badge key={b} tone="violet">
                {b}
              </Badge>
            ))}
          </div>
        </Section>
      </div>

      <footer className="flex gap-2 border-t border-line px-3.5 py-2.5">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => {
            setChatOpen(true);
            submitChat("Tell me about this area");
          }}
        >
          Ask about this area
        </Button>
        <Button variant="primary" className="flex-1" onClick={() => openDataSheet("movement-graph")}>
          Get this data
        </Button>
      </footer>
    </aside>
  );
}
