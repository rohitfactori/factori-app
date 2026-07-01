"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  Store,
  Columns2,
  PanelRight,
  MessageSquareText,
  Crosshair,
  Ruler,
  Map as MapIcon,
  Check,
  X,
} from "lucide-react";
import { useAsk } from "@/lib/store/ask";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { DataPanel } from "./DataPanel";
import { MAP } from "@/lib/mock/geo";
import { fmtCompact, fmtUSD, seeded } from "@/lib/format";
import type { Basemap } from "@/lib/store/ask";

export function ImmersiveOverlay() {
  const result = useAsk((s) => s.result);
  const setMode = useAsk((s) => s.setMode);
  const panelOpen = useAsk((s) => s.panelOpen);
  const setPanelOpen = useAsk((s) => s.setPanelOpen);
  const chatOpen = useAsk((s) => s.chatOpen);
  const setChatOpen = useAsk((s) => s.setChatOpen);
  if (!result) return null;

  return (
    <>
      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3">
        <div className="pointer-events-auto flex items-center gap-2">
          <SearchBox />
          <div className="hidden rounded-lg border border-line bg-panel/85 px-2.5 py-1.5 backdrop-blur-md xl:block">
            <div className="label-eyebrow capitalize">{result.kind} · {result.place}</div>
            <div className="max-w-[220px] truncate text-xs font-medium text-ink">{result.title}</div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 rounded-md border border-line bg-panel/85 p-0.5 backdrop-blur-md">
            <Toggle active={chatOpen} onClick={() => setChatOpen(!chatOpen)} title="Toggle chat">
              <MessageSquareText />
            </Toggle>
            <Toggle active={panelOpen} onClick={() => setPanelOpen(!panelOpen)} title="Toggle data panel">
              <PanelRight />
            </Toggle>
          </div>
          <Button variant="secondary" className="bg-panel/85 backdrop-blur-md" onClick={() => setMode("split")}>
            <Columns2 className="size-3.5" />
            Exit map
          </Button>
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

      <ToolRail />
      <RadiusReadout />
      <Legend />

      {panelOpen && (
        <DataPanel
          onClose={() => setPanelOpen(false)}
          className="absolute bottom-3 right-3 top-[60px] z-10 w-[286px] max-w-[40vw]"
        />
      )}
    </>
  );
}

function SearchBox() {
  const submit = useAsk((s) => s.submit);
  const [v, setV] = useState("");
  return (
    <div className="flex h-9 w-[240px] items-center gap-2 rounded-lg border border-line bg-panel/90 px-2.5 backdrop-blur-md transition-colors focus-within:border-accent-dim md:w-[300px]">
      <Search className="size-3.5 shrink-0 text-ink-faint" />
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && v.trim()) {
            submit(v);
            setV("");
          }
        }}
        placeholder="Search a place or ask Factori…"
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
      />
    </div>
  );
}

function Toggle({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "grid size-7 place-items-center rounded-[5px] transition-colors [&_svg]:size-4",
        active ? "bg-panel-3 text-accent" : "text-ink-faint hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function ToolRail() {
  const tool = useAsk((s) => s.tool);
  const setTool = useAsk((s) => s.setTool);
  const recenter = useAsk((s) => s.recenter);
  const basemap = useAsk((s) => s.basemap);
  const setBasemap = useAsk((s) => s.setBasemap);
  const [bmOpen, setBmOpen] = useState(false);

  return (
    <div className="absolute left-3 top-[60px] z-10">
      <div className="flex flex-col gap-0.5 rounded-lg border border-line bg-panel/90 p-1 backdrop-blur-md">
        <RailBtn title="Recenter" onClick={recenter}>
          <Crosshair />
        </RailBtn>
        <div className="relative">
          <RailBtn title="Basemap" active={bmOpen} onClick={() => setBmOpen((o) => !o)}>
            <MapIcon />
          </RailBtn>
          {bmOpen && (
            <div className="absolute left-full top-0 z-20 ml-1.5 w-36 rounded-lg border border-line bg-panel p-1 shadow-pop">
              {(["dark", "light", "satellite"] as Basemap[]).map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setBasemap(b);
                    setBmOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs capitalize transition-colors",
                    basemap === b ? "bg-panel-2 text-ink" : "text-ink-muted hover:bg-panel-2/60"
                  )}
                >
                  {b}
                  {basemap === b && <Check className="size-3.5 text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <RailBtn
          title="Radius / trade area"
          active={tool === "radius"}
          onClick={() => setTool(tool === "radius" ? "pan" : "radius")}
        >
          <Ruler />
        </RailBtn>
      </div>
    </div>
  );
}

function RailBtn({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "grid size-8 place-items-center rounded-md transition-colors [&_svg]:size-4",
        active ? "bg-accent-tint text-accent" : "text-ink-muted hover:bg-panel-2 hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function computeRadiusStats(r: { lng: number; lat: number; miles: number }) {
  const seed = Math.abs(Math.round(r.lng * 1000 + r.lat * 1000)) % 9973;
  const rng = seeded(seed || 7);
  const areaKm2 = Math.PI * Math.pow(r.miles * 1.60934, 2);
  const density = 900 + rng() * 4200;
  const pop = Math.round(areaKm2 * density);
  return {
    pop,
    places: Math.round(pop / (180 + rng() * 220)),
    income: Math.round(58000 + rng() * 120000),
  };
}

function RadiusReadout() {
  const radius = useAsk((s) => s.radius);
  const setRadius = useAsk((s) => s.setRadius);
  if (!radius) return null;
  const stats = computeRadiusStats(radius);
  return (
    <div className="absolute left-[60px] top-[60px] z-10 w-[224px] rounded-lg border border-line bg-panel/95 p-3 shadow-pop backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="label-eyebrow flex items-center gap-1.5 !text-ink-muted">
          <Ruler className="size-3 text-accent" />
          Trade area
        </div>
        <button
          onClick={() => setRadius(null)}
          className="grid size-5 place-items-center rounded text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink"
          aria-label="Clear radius"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-ink-muted">Radius</span>
        <span className="tabular-nums text-ink">{radius.miles.toFixed(2)} mi</span>
      </div>
      <input
        type="range"
        min={0.25}
        max={10}
        step={0.25}
        value={radius.miles}
        onChange={(e) => setRadius({ ...radius, miles: Number(e.target.value) })}
        className="mt-1.5 h-1 w-full cursor-pointer"
        style={{ accentColor: "var(--color-accent)" }}
      />
      <div className="mt-2.5 space-y-1.5 border-t border-line pt-2.5">
        <ReadoutRow label="Population" value={fmtCompact(stats.pop)} />
        <ReadoutRow label="Places" value={fmtCompact(stats.places)} />
        <ReadoutRow label="Median HHI" value={fmtUSD(stats.income)} />
      </div>
      <div className="mt-2 text-[10px] leading-relaxed text-ink-faint">
        Click the map to move · drag to resize. Estimated from Demographics +
        Places.
      </div>
    </div>
  );
}

function ReadoutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="text-xs font-medium tabular-nums text-ink">{value}</span>
    </div>
  );
}

function Legend() {
  const result = useAsk((s) => s.result!);
  const isPoints = result.kind === "places";
  return (
    <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-lg border border-line bg-panel/90 px-3 py-2 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <span className="label-eyebrow">{isPoints ? "Visits / mo" : "Density"}</span>
        <span className="text-[10px] text-ink-faint">Low</span>
        {isPoints ? (
          <span className="flex items-center gap-1.5">
            {[4, 6, 8, 11].map((s, i) => (
              <span
                key={i}
                className="rounded-full bg-accent"
                style={{ width: s, height: s, opacity: 0.45 + i * 0.18 }}
              />
            ))}
          </span>
        ) : (
          <span
            className="h-2 w-28 rounded-full"
            style={{ background: `linear-gradient(90deg, ${MAP.ramp.join(", ")})` }}
          />
        )}
        <span className="text-[10px] text-ink-faint">High</span>
      </div>
    </div>
  );
}
