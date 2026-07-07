"use client";

import { domainFor, formatMetric, rampFor } from "@/lib/explore/metrics";
import type { ExploreLayer } from "@/lib/snapshot/types";

export function RampLegend({ layer }: { layer: ExploreLayer }) {
  const ramp = rampFor(layer);
  const [lo, hi] = domainFor(layer);
  return (
    <div>
      <div
        className="h-1.5 w-full rounded-full"
        style={{ background: `linear-gradient(to right, ${ramp.join(", ")})` }}
      />
      <div className="mt-1 flex justify-between text-2xs tabular-nums text-ink-faint">
        <span>{formatMetric(layer, lo)}</span>
        <span>{formatMetric(layer, hi)}</span>
      </div>
    </div>
  );
}
