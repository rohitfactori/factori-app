import * as React from "react";
import { cn } from "@/lib/cn";

/* ---------------- Input ---------------- */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-8 w-full rounded-md border border-line bg-canvas px-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-accent-dim focus:bg-panel",
        className
      )}
      {...props}
    />
  );
});

/* ---------------- Kbd ---------------- */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-4.5 min-w-4.5 items-center justify-center rounded border border-line bg-panel-2 px-1 font-sans text-[10px] font-medium text-ink-faint",
        className
      )}
    >
      {children}
    </kbd>
  );
}

/* ---------------- Avatar ---------------- */
export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full bg-accent-tint text-[10px] font-semibold text-accent select-none",
        className
      )}
    >
      {initials}
    </span>
  );
}

/* ---------------- Segmented control ---------------- */
export type SegOption<T extends string> = {
  value: T;
  label?: string;
  icon?: React.ReactNode;
  title?: string;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-line bg-panel p-0.5",
        className
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex h-6 items-center gap-1.5 rounded-[5px] px-2 text-xs transition-colors [&_svg]:size-3.5",
            value === o.value
              ? "bg-panel-3 text-ink"
              : "text-ink-faint hover:text-ink-muted"
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- TabBar ---------------- */
export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4 border-b border-line", className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "relative -mb-px flex items-center gap-1.5 border-b-2 py-2 text-sm transition-colors",
            value === t.value
              ? "border-accent text-ink"
              : "border-transparent text-ink-faint hover:text-ink-muted"
          )}
        >
          {t.label}
          {t.count != null && (
            <span className="rounded bg-panel-2 px-1 text-2xs text-ink-faint tabular-nums">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Tooltip (CSS hover) ---------------- */
export function Tooltip({
  label,
  children,
  side = "top",
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "right";
  className?: string;
}) {
  const pos =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-1.5"
      : side === "bottom"
        ? "top-full left-1/2 -translate-x-1/2 mt-1.5"
        : "left-full top-1/2 -translate-y-1/2 ml-1.5";
  return (
    <span className={cn("group/tt relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-line bg-panel-3 px-1.5 py-1 text-2xs text-ink opacity-0 shadow-pop transition-opacity duration-100 group-hover/tt:opacity-100",
          pos
        )}
      >
        {label}
      </span>
    </span>
  );
}
