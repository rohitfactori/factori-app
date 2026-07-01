import { cn } from "@/lib/cn";

export function Page({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full flex-col">{children}</div>;
}

export function PageHeader({
  title,
  sub,
  actions,
  icon,
  children,
}: {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="shrink-0 border-b border-line px-6 py-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-panel-2 text-accent [&_svg]:size-4">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-ink">
              {title}
            </h1>
            {sub && <p className="mt-0.5 max-w-2xl text-xs text-ink-muted">{sub}</p>}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {children}
    </div>
  );
}

export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-5", className)}>
      {children}
    </div>
  );
}

/** Inline banner used for cross-sell / API+MCP callouts. */
export function Callout({
  icon,
  title,
  children,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-accent-dim/40 bg-accent-tint/40 px-3.5 py-3">
      {icon && (
        <div className="grid size-8 shrink-0 place-items-center rounded-md bg-canvas/40 text-accent [&_svg]:size-4">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">{title}</div>
        {children && (
          <div className="mt-0.5 text-xs text-ink-muted">{children}</div>
        )}
      </div>
      {action}
    </div>
  );
}
