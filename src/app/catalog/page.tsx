"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Database, Plus, ArrowRight } from "lucide-react";
import { DATASETS, type Dataset } from "@/lib/mock/platform";
import { Page, PageHeader, PageBody } from "@/components/shell/Page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const CATEGORIES = ["All", ...Array.from(new Set(DATASETS.map((d) => d.category)))];

export default function CatalogPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const items = DATASETS.filter(
    (d) =>
      (cat === "All" || d.category === cat) &&
      (d.name + d.category + d.tags.join()).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Page>
      <PageHeader
        icon={<Database />}
        title="Catalog"
        sub="License Factori's real-world datasets. Use any dataset as self-serve cuts, via REST API & MCP, or delivered to your warehouse."
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search datasets…"
                className="h-8 w-[220px] rounded-md border border-line bg-canvas pl-8 pr-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-accent-dim"
              />
            </div>
            <Button variant="primary">
              <Plus className="size-3.5" />
              Request dataset
            </Button>
          </>
        }
      />
      <PageBody>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                cat === c
                  ? "border-accent-dim bg-accent-tint text-accent"
                  : "border-line text-ink-muted hover:bg-panel-2 hover:text-ink"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((d) => (
            <DatasetCard key={d.id} d={d} />
          ))}
        </div>
      </PageBody>
    </Page>
  );
}

function DatasetCard({ d }: { d: Dataset }) {
  return (
    <Link
      href={`/catalog/${d.id}`}
      className="group flex flex-col rounded-lg border border-line bg-panel p-3.5 transition-colors hover:border-line-strong hover:bg-panel-2/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-ink">{d.name}</div>
          <div className="mt-0.5 text-2xs text-ink-faint">{d.category}</div>
        </div>
        <ArrowRight className="size-4 shrink-0 text-ink-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-muted">
        {d.description}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-2.5">
        <Stat label="Records" value={d.records} />
        <Stat label="Refresh" value={d.freshness} />
        <Stat label="From" value={`${d.credits} cr`} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1">
        {d.channels.map((c) => (
          <Badge key={c} tone={c === "MCP" ? "accent" : "neutral"}>
            {c}
          </Badge>
        ))}
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-eyebrow">{label}</div>
      <div className="mt-0.5 truncate text-xs font-medium tabular-nums text-ink">
        {value}
      </div>
    </div>
  );
}
