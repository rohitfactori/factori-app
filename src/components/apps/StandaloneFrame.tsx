import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FactoriMark } from "@/components/brand";
import { Badge } from "@/components/ui/badge";

/** Chrome for an app opened as an independent, standalone product (no Factori shell). */
export function StandaloneFrame({
  name,
  backHref,
  children,
}: {
  name: string;
  backHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas">
      <header className="flex h-11 shrink-0 items-center gap-2.5 border-b border-line px-4">
        <FactoriMark className="size-5" />
        <span className="text-sm font-semibold text-ink">{name}</span>
        <Badge tone="neutral">Standalone</Badge>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden font-mono text-xs text-ink-faint sm:block">
            {backHref.split("/").pop()}.factori.ai
          </span>
          <Link
            href={backHref}
            className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-panel-2 hover:text-ink"
          >
            Open in Factori
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </header>
      <main className="relative min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
