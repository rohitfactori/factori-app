"use client";

import Link from "next/link";
import { Sparkles, Database } from "lucide-react";
import { useAsk } from "@/lib/store/ask";
import { cn } from "@/lib/cn";
import { Bars, AreaChart, Donut, Delta } from "@/components/ui/charts";
import type { InsightPayload, InsightChart } from "@/lib/mock/agent";

function ChartView({ chart, height }: { chart: InsightChart; height: number }) {
  if (chart.type === "area") return <AreaChart data={chart.data} height={height} />;
  if (chart.type === "bars") return <Bars data={chart.data} labelWidth={72} />;
  return <Donut segments={chart.segments} centerLabel={chart.centerLabel} />;
}

export function InsightCard({
  insight,
  variant = "chat",
}: {
  insight: InsightPayload;
  variant?: "chat" | "canvas";
}) {
  const canvas = variant === "canvas";
  return (
    <div className={cn("rounded-xl border border-line bg-panel", canvas ? "p-4" : "mt-1 p-3")}>
      <div className="min-w-0">
        <div className="label-eyebrow truncate">{insight.headline.label}</div>
        <div className="mt-0.5 flex items-center gap-2">
          <span
            className={cn(
              "font-semibold tabular-nums text-ink",
              canvas ? "text-3xl" : "text-2xl"
            )}
          >
            {insight.headline.value}
          </span>
          {insight.headline.delta != null && <Delta value={insight.headline.delta} />}
        </div>
      </div>

      <div className={canvas ? "mt-4" : "mt-3"}>
        <ChartView chart={insight.chart} height={canvas ? 150 : 92} />
      </div>

      <div
        className={cn(
          "mt-3 grid gap-px overflow-hidden rounded-lg bg-line",
          insight.stats.length >= 3 ? "grid-cols-3" : "grid-cols-2"
        )}
      >
        {insight.stats.map((s) => (
          <div key={s.label} className="bg-panel px-2.5 py-1.5">
            <div className="label-eyebrow truncate">{s.label}</div>
            <div className="mt-0.5 text-xs font-medium tabular-nums text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      {canvas && insight.note && (
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">{insight.note}</p>
      )}

      {canvas && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
          <Database className="size-3 text-ink-faint" />
          {insight.provenance.map((p) => (
            <Link
              key={p.dataset}
              href="/catalog"
              className="rounded-full border border-line px-2 py-0.5 text-[10px] text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              {p.dataset}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Full-canvas insight view (covers the map when an answer needs no map). */
export function InsightCanvas() {
  const insight = useAsk((s) => s.insight);
  const submit = useAsk((s) => s.submit);
  if (!insight) return null;
  return (
    <div className="absolute inset-0 z-10 overflow-y-auto bg-canvas">
      <div className="mx-auto max-w-[560px] px-6 py-8">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-accent-tint">
            <Sparkles className="size-3.5 text-accent" />
          </span>
          <div className="text-sm font-medium text-ink">{insight.title}</div>
          <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[10px] text-ink-faint">
            No map needed
          </span>
        </div>
        <InsightCard insight={insight} variant="canvas" />
        {insight.followups.length > 0 && (
          <div className="mt-4">
            <div className="label-eyebrow mb-2">Follow up</div>
            <div className="flex flex-wrap gap-1.5">
              {insight.followups.map((f) => (
                <button
                  key={f}
                  onClick={() => submit(f)}
                  className="rounded-full border border-line bg-panel px-2.5 py-1 text-xs text-ink-muted transition-colors hover:border-accent-dim hover:text-ink"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
