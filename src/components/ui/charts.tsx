import { cn } from "@/lib/cn";

const TEAL = "#33D6C6";
const TRACK = "#242a2b";

/* ---------------- Horizontal bars ---------------- */
export function Bars({
  data,
  unit = "",
  labelWidth = 96,
  className,
}: {
  data: { label: string; value: number; color?: string }[];
  unit?: string;
  labelWidth?: number;
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn("space-y-1.5", className)}>
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <span
            className="shrink-0 truncate text-[11px] text-ink-faint"
            style={{ width: labelWidth }}
          >
            {d.label}
          </span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-3">
            <span
              className="block h-full rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color ?? TEAL }}
            />
          </span>
          <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-ink-muted">
            {d.value.toLocaleString()}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Area / line ---------------- */
export function AreaChart({
  data,
  color = TEAL,
  height = 120,
  className,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  className?: string;
}) {
  const H = 40;
  const PAD = 4;
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const x = (i: number) => (i / (data.length - 1)) * 100;
  const y = (v: number) => PAD + (1 - (v - min) / (max - min || 1)) * (H - 2 * PAD);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${y(d.value).toFixed(2)}`).join(" ");
  const area = `${line} L100,${H} L0,${H} Z`;
  const gid = `ac-${color.replace("#", "")}`;
  return (
    <div className={className}>
      <svg
        viewBox={`0 0 100 ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.3" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/* ---------------- Vertical columns ---------------- */
export function Columns({
  data,
  color = TEAL,
  height = 96,
  className,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={className}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d) => (
          <div
            key={d.label}
            className="group flex-1 rounded-t transition-colors"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: 2, background: color }}
            title={`${d.label}: ${d.value.toLocaleString()}`}
          />
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">
        {data.map((d) => (
          <span key={d.label} className="flex-1 truncate text-center text-[10px] text-ink-faint">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Donut ---------------- */
export function Donut({
  segments,
  size = 96,
  thickness = 13,
  centerLabel,
  centerSub,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TRACK} strokeWidth={thickness} />
          {segments.map((seg, i) => {
            const frac = seg.value / total;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${frac * c} ${c}`}
                strokeDashoffset={-acc * c}
              />
            );
            acc += frac;
            return el;
          })}
        </svg>
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-semibold tabular-nums text-ink">{centerLabel}</span>
            {centerSub && <span className="text-[10px] text-ink-faint">{centerSub}</span>}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-[11px]">
            <span className="size-2 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="truncate text-ink-muted">{s.label}</span>
            <span className="ml-auto tabular-nums text-ink">
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Delta chip ---------------- */
export function Delta({ value, className }: { value: number; className?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums",
        up ? "text-positive" : "text-negative",
        className
      )}
    >
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
    </span>
  );
}
