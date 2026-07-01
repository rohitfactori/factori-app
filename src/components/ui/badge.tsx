import * as React from "react";
import { cn } from "@/lib/cn";

type Tone =
  | "neutral"
  | "accent"
  | "positive"
  | "warning"
  | "negative"
  | "violet";

const tones: Record<Tone, string> = {
  neutral: "bg-panel-2 text-ink-muted border-line",
  accent: "bg-accent-tint text-accent border-accent-dim/50",
  positive: "bg-positive-tint text-positive border-positive/25",
  warning: "bg-warning-tint text-warning border-warning/25",
  negative: "bg-negative-tint text-negative border-negative/25",
  violet: "bg-violet-tint text-viz-violet border-viz-violet/25",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-2xs font-medium leading-4 whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const dotTones: Record<Tone, string> = {
  neutral: "bg-ink-faint",
  accent: "bg-accent",
  positive: "bg-positive",
  warning: "bg-warning",
  negative: "bg-negative",
  violet: "bg-viz-violet",
};

export function Dot({
  tone = "neutral",
  className,
  pulse,
}: {
  tone?: Tone;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex size-1.5", className)}>
      {pulse && (
        <span
          className={cn(
            "absolute inset-0 animate-ping rounded-full opacity-60",
            dotTones[tone]
          )}
        />
      )}
      <span
        className={cn("relative size-1.5 rounded-full", dotTones[tone])}
      />
    </span>
  );
}
