"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, ChevronDown } from "lucide-react";
import { workNav, accountNav } from "@/lib/nav";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/cn";
import { Kbd, Avatar } from "@/components/ui/field";
import { IconButton } from "@/components/ui/button";

function crumbs(path: string) {
  if (path === "/") return [{ label: "Ask", href: "/" }];
  const all = [...workNav, ...accountNav].filter((n) => n.href !== "/");
  const top = all.find((n) =>
    n.match ? n.match(path) : path.startsWith(n.href)
  );
  const out: { label: string; href: string }[] = [];
  if (top) {
    out.push({ label: top.label, href: top.href });
    const child = top.children?.find((c) => path.startsWith(c.href));
    if (child) out.push({ label: child.label, href: child.href });
  } else {
    out.push({ label: "Factori", href: "/" });
  }
  return out;
}

export function TopBar() {
  const path = usePathname();
  const setCmdk = useUI((s) => s.setCmdk);
  const cr = crumbs(path);

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-panel/50 px-3 backdrop-blur">
      <nav className="flex min-w-0 items-center gap-1.5 text-sm">
        {cr.map((c, i) => (
          <span key={c.href + i} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <span className="text-ink-faint">/</span>}
            <Link
              href={c.href}
              className={cn(
                "truncate",
                i === cr.length - 1
                  ? "font-medium text-ink"
                  : "text-ink-faint hover:text-ink-muted"
              )}
            >
              {c.label}
            </Link>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => setCmdk(true)}
          className="flex h-8 w-[160px] items-center gap-2 rounded-md border border-line bg-canvas px-2.5 text-ink-faint transition-colors hover:border-line-strong md:w-[260px]"
        >
          <Search className="size-3.5 shrink-0" />
          <span className="hidden text-xs md:inline">Ask or jump to…</span>
          <span className="ml-auto flex items-center gap-0.5">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
        <IconButton aria-label="Notifications">
          <Bell />
        </IconButton>
        <div className="mx-0.5 h-5 w-px bg-line" />
        <button className="flex items-center gap-1.5 rounded-md py-1 pl-1 pr-1.5 transition-colors hover:bg-panel-2">
          <Avatar name="Rohit Maheswaran" />
          <span className="hidden text-xs text-ink-muted sm:block">Rohit</span>
          <ChevronDown className="size-3.5 text-ink-faint" />
        </button>
      </div>
    </header>
  );
}
