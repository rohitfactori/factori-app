"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, BookText, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/cn";
import { workNav, accountNav, type NavItem, type NavChild } from "@/lib/nav";
import { useUI } from "@/lib/store/ui";
import { FactoriMark, Wordmark } from "@/components/brand";
import { Tooltip } from "@/components/ui/field";

function isActive(item: NavItem | NavChild, path: string) {
  if ("match" in item && item.match) return item.match(path);
  return path === item.href || path.startsWith(item.href + "/");
}

export function Sidebar() {
  const path = usePathname();
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const toggle = useUI((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "relative z-20 flex shrink-0 flex-col border-r border-line bg-panel transition-[width] duration-200",
        collapsed ? "w-[56px]" : "w-[228px]"
      )}
    >
      {/* brand */}
      <div className={cn("flex h-12 items-center gap-2 px-3", collapsed && "justify-center px-0")}>
        <FactoriMark className="size-6 shrink-0" />
        {!collapsed && <Wordmark className="text-[15px]" />}
        {!collapsed && (
          <button
            onClick={toggle}
            className="ml-auto grid size-6 place-items-center rounded-md text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="size-4" />
          </button>
        )}
      </div>

      <nav className={cn("flex-1 px-2 py-1.5", collapsed ? "overflow-visible" : "overflow-y-auto")}>
        <Section>
          {workNav.map((item) => (
            <NavRow key={item.href} item={item} path={path} collapsed={collapsed} />
          ))}
        </Section>

        <div className="my-2 h-px bg-line" />

        <Section>
          {accountNav.map((item) => (
            <NavRow key={item.href} item={item} path={path} collapsed={collapsed} />
          ))}
        </Section>
      </nav>

      {/* footer */}
      <div className="space-y-2 border-t border-line p-2">
        {!collapsed ? (
          <WalletChip />
        ) : (
          <button
            onClick={toggle}
            className="mx-auto grid size-9 place-items-center rounded-md text-ink-faint hover:bg-panel-2 hover:text-ink"
            aria-label="Expand sidebar"
          >
            <ChevronsLeft className="size-4 rotate-180" />
          </button>
        )}
        <div className={cn("flex", collapsed ? "flex-col items-center gap-1" : "items-center gap-1")}>
          <FooterLink icon={BookText} label="Docs" collapsed={collapsed} />
          <FooterLink icon={LifeBuoy} label="Support" collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="space-y-0.5">{children}</div>;
}

function NavRow({
  item,
  path,
  collapsed,
}: {
  item: NavItem;
  path: string;
  collapsed: boolean;
}) {
  const active = isActive(item, path);
  const Icon = item.icon;
  const row = (
    <Link
      href={item.href}
      className={cn(
        "group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-sm transition-colors",
        active
          ? "bg-panel-2 text-ink"
          : "text-ink-muted hover:bg-panel-2/60 hover:text-ink",
        collapsed && "justify-center px-0"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />
      )}
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-accent" : "text-ink-faint group-hover:text-ink-muted"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="ml-auto rounded bg-panel-3 px-1 text-[10px] text-ink-faint">
          {item.badge}
        </span>
      )}
    </Link>
  );

  return (
    <div>
      {collapsed ? (
        <Tooltip label={item.label} side="right" className="block w-full">
          {row}
        </Tooltip>
      ) : (
        row
      )}
      {!collapsed && item.children && (
        <div className="mb-0.5 ml-[15px] mt-0.5 space-y-0.5 border-l border-line pl-2">
          {item.children.map((c) => {
            const ca = isActive(c, path);
            const CI = c.icon;
            return (
              <Link
                key={c.href}
                href={c.href}
                className={cn(
                  "flex h-7 items-center gap-2 rounded-md px-2 text-[12.5px] transition-colors",
                  ca
                    ? "bg-panel-2 text-ink"
                    : "text-ink-faint hover:bg-panel-2/50 hover:text-ink-muted"
                )}
              >
                <CI className={cn("size-3.5 shrink-0", ca && "text-accent")} />
                <span className="truncate">{c.label}</span>
                {c.badge && (
                  <span className="ml-auto rounded bg-panel-3 px-1 text-[10px] text-ink-faint">
                    {c.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WalletChip() {
  const used = 9240;
  const total = 15000;
  const pct = Math.round((used / total) * 100);
  return (
    <Link
      href="/billing"
      className="block rounded-lg border border-line bg-panel-2/50 p-2.5 transition-colors hover:border-line-strong"
    >
      <div className="flex items-center justify-between">
        <span className="label-eyebrow">Growth plan</span>
        <span className="text-[11px] text-accent">Manage</span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-sm font-medium tabular-nums text-ink">
          {(total - used).toLocaleString()}
        </span>
        <span className="text-[11px] text-ink-faint">credits left</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-panel-3">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}

function FooterLink({
  icon: Icon,
  label,
  collapsed,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
}) {
  return (
    <button
      className={cn(
        "flex items-center gap-2 rounded-md text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink-muted",
        collapsed ? "size-8 justify-center" : "h-7 flex-1 px-2 text-xs"
      )}
    >
      <Icon className="size-3.5" />
      {!collapsed && label}
    </button>
  );
}
