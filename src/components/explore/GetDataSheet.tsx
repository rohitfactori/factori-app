"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, X } from "lucide-react";
import { generatePreview, getDataset } from "@/lib/mock/platform";
import { useExplore } from "@/lib/store/explore";
import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Segmented } from "@/components/ui/field";
import { cn } from "@/lib/cn";

function inferType(key: string) {
  if (/score|index|visits|population|age|income|hhi|dwell|yoy|count/.test(key)) return "number";
  if (/seen|date|period/.test(key)) return "date";
  return "string";
}

const restCall = (id: string) =>
  `GET https://api.factori.ai/v2/${id}?h3=8829a1d55&limit=100`;
const mcpCall = (id: string) =>
  `factori.query("${id}", { h3: "8829a1d55", limit: 100 })`;

export function GetDataSheet() {
  const dataSheetFor = useExplore((s) => s.dataSheetFor);
  const closeDataSheet = useExplore((s) => s.closeDataSheet);
  const [mode, setMode] = useState<"rest" | "mcp">("rest");
  const [copied, setCopied] = useState(false);

  const ds = dataSheetFor ? getDataset(dataSheetFor) : undefined;
  const rows = useMemo(() => (ds ? generatePreview(ds, 5) : []), [ds]);

  useEffect(() => {
    if (!dataSheetFor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDataSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dataSheetFor, closeDataSheet]);

  if (!ds) return null;
  const call = mode === "rest" ? restCall(ds.id) : mcpCall(ds.id);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45" onClick={closeDataSheet} />
      <aside className="animate-rise fixed inset-y-0 right-0 z-50 flex w-[440px] max-w-[92vw] flex-col border-l border-line bg-panel shadow-pop">
        <header className="flex items-start gap-2 border-b border-line px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="label-eyebrow">{ds.category}</div>
            <div className="mt-0.5 text-sm font-semibold text-ink">{ds.name}</div>
          </div>
          <IconButton size="xs" aria-label="Close" onClick={closeDataSheet}>
            <X />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3.5">
          <p className="text-xs leading-relaxed text-ink-muted">{ds.description}</p>

          <div className="flex flex-wrap gap-1.5">
            <Badge tone="accent">{ds.records} records</Badge>
            <Badge>{ds.coverage.split(" · ")[0]}</Badge>
            <Badge>Refresh: {ds.freshness}</Badge>
            <Badge>From {ds.credits} cr</Badge>
            {ds.channels.map((c) => (
              <Badge key={c} tone="violet">
                {c}
              </Badge>
            ))}
          </div>

          <div>
            <div className="label-eyebrow mb-1.5">Schema</div>
            <div className="overflow-hidden rounded-lg border border-line">
              {ds.columns.map((c) => (
                <div
                  key={c.key}
                  className="flex items-center gap-2 border-b border-line/60 px-2.5 py-1.5 last:border-0"
                >
                  <span className="font-mono text-2xs text-ink">{c.key}</span>
                  <span className="ml-auto text-2xs text-ink-faint">{inferType(c.key)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="label-eyebrow mb-1.5">Sample rows</div>
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-2xs">
                <thead>
                  <tr className="border-b border-line bg-panel-2/50 text-left">
                    {ds.columns.slice(0, 4).map((c) => (
                      <th key={c.key} className="whitespace-nowrap px-2 py-1.5 font-mono font-normal text-ink-faint">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-line/50 last:border-0">
                      {ds.columns.slice(0, 4).map((c) => (
                        <td key={c.key} className="whitespace-nowrap px-2 py-1.5 text-ink-muted">
                          {String(r[c.key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-1 text-2xs text-ink-faint">Masked evaluation rows. Production returns full fidelity.</div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="label-eyebrow">Query it live</span>
              <Segmented<"rest" | "mcp">
                value={mode}
                onChange={setMode}
                options={[
                  { value: "rest", label: "REST" },
                  { value: "mcp", label: "MCP" },
                ]}
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-2.5 py-2">
              <code className={cn("min-w-0 flex-1 font-mono text-2xs text-ink-muted", mode === "mcp" && "text-accent/90")}>
                {call}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(call);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
                className="shrink-0 text-ink-faint transition-colors hover:text-ink"
                title="Copy"
              >
                {copied ? <Check className="size-3.5 text-positive" /> : <Copy className="size-3.5" />}
              </button>
            </div>
            {mode === "mcp" && (
              <div className="mt-1 text-2xs leading-relaxed text-ink-faint">
                Any AI agent — Claude, ChatGPT, your own — can call this dataset as a tool via the Factori MCP server.
              </div>
            )}
          </div>
        </div>

        <footer className="flex gap-2 border-t border-line px-4 py-3">
          <Link href={`/catalog/${ds.id}`} className="flex-1" onClick={closeDataSheet}>
            <Button variant="secondary" className="w-full">
              Open in Catalog
            </Button>
          </Link>
          <Button variant="primary" className="flex-1">
            Get production access
          </Button>
        </footer>
      </aside>
    </>
  );
}
