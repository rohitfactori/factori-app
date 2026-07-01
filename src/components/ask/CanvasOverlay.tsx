"use client";

import Link from "next/link";
import { Download, Store, Maximize2, Columns2 } from "lucide-react";
import { useAsk } from "@/lib/store/ask";
import { Segmented } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { DataPanel } from "./DataPanel";
import type { CanvasMode } from "@/lib/store/ask";

/** Split-view overlay: top bar (mode toggle + actions) + right data panel. */
export function CanvasOverlay() {
  const result = useAsk((s) => s.result);
  const mode = useAsk((s) => s.mode);
  const setMode = useAsk((s) => s.setMode);
  if (!result) return null;

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3">
        <div className="pointer-events-auto max-w-[40%] rounded-lg border border-line bg-panel/85 px-3 py-1.5 backdrop-blur-md">
          <div className="label-eyebrow mb-0.5 capitalize">
            {result.kind} · {result.place}
          </div>
          <div className="truncate text-sm font-medium text-ink">{result.title}</div>
        </div>
        <div className="pointer-events-auto flex items-center gap-1.5">
          <Segmented<Exclude<CanvasMode, "console">>
            value={mode === "immersive" ? "immersive" : "split"}
            onChange={(v) => setMode(v)}
            options={[
              { value: "split", icon: <Columns2 />, title: "Split view" },
              { value: "immersive", icon: <Maximize2 />, title: "Full map" },
            ]}
          />
          <Button variant="secondary" className="bg-panel/85 backdrop-blur-md">
            <Download className="size-3.5" />
            Export
          </Button>
          <Link href="/apps/site-selection">
            <Button variant="primary">
              <Store className="size-3.5" />
              Open in Site Selection
            </Button>
          </Link>
        </div>
      </div>

      <DataPanel className="absolute bottom-3 right-3 top-[60px] z-10 w-[286px] max-w-[44vw]" />
    </>
  );
}
