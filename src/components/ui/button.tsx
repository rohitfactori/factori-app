import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "xs" | "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover font-medium",
  secondary: "bg-panel-2 text-ink border border-line hover:bg-panel-3 hover:border-line-strong",
  ghost: "text-ink-muted hover:text-ink hover:bg-panel-2",
  outline: "border border-line text-ink-muted hover:text-ink hover:bg-panel-2 hover:border-line-strong",
  danger: "text-negative hover:bg-negative-tint",
};

const sizes: Record<Size, string> = {
  xs: "h-6 px-2 text-2xs gap-1 rounded-md",
  sm: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
  md: "h-8 px-3 text-sm gap-2 rounded-md",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = "secondary",
  size = "sm",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors duration-150 outline-none disabled:opacity-45 disabled:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function IconButton({
  className,
  variant = "ghost",
  size = "sm",
  ...props
}: ButtonProps) {
  const sq = size === "xs" ? "size-6" : size === "md" ? "size-8" : "size-7";
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-colors duration-150 outline-none disabled:opacity-45 disabled:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        variants[variant],
        sq,
        className
      )}
      {...props}
    />
  );
}
