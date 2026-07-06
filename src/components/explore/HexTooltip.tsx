"use client";

export type TooltipData = {
  x: number;
  y: number;
  label: string;
  metric: string;
  value: string;
};

export function HexTooltip({ data }: { data: TooltipData | null }) {
  if (!data) return null;
  return (
    <div
      className="pointer-events-none absolute z-20 rounded-md border border-line bg-panel-2/95 px-2 py-1.5 shadow-pop"
      style={{ left: data.x + 12, top: data.y + 12 }}
    >
      <div className="text-xs font-medium text-ink">{data.label}</div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="label-eyebrow">{data.metric}</span>
        <span className="text-sm font-semibold tabular-nums text-ink">{data.value}</span>
      </div>
    </div>
  );
}
