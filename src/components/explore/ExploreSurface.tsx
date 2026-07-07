"use client";

import { useEffect } from "react";
import { Globe, Moon, Sun } from "lucide-react";
import { useExplore, type Basemap } from "@/lib/store/explore";
import { LAYER_CONFIGS } from "@/lib/explore/metrics";
import { Segmented } from "@/components/ui/field";
import { Tooltip } from "@/components/ui/field";
import { AreaPanel } from "./AreaPanel";
import { ChatDock } from "./ChatDock";
import { ExploreMap } from "./ExploreMap";
import { ExploreSearch } from "./ExploreSearch";
import { GetDataSheet } from "./GetDataSheet";
import { LayerRail } from "./LayerRail";
import { TimeScrubber } from "./TimeScrubber";
import { ViewsMenu } from "./ViewsMenu";

export function ExploreSurface() {
  // Seed the first layer (catalog handoff via ?dataset=…, else Movement visits).
  // Plain location.search instead of useSearchParams: no Suspense boundary, so a
  // stalled stream can never leave the demo on a blank screen.
  useEffect(() => {
    const st = useExplore.getState();
    if (st.layers.length) return;
    const ds = new URLSearchParams(window.location.search).get("dataset");
    st.addLayer(ds && LAYER_CONFIGS[ds] ? ds : "movement-graph");
  }, []);

  return (
    <div className="relative h-full">
      <ExploreMap />

      {/* top strip */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-2">
        <div className="pointer-events-auto">
          <ExploreSearch />
        </div>
        <div className="pointer-events-auto flex items-center gap-1.5">
          <MarketChip />
          <ViewsMenu />
          <BasemapToggle />
        </div>
      </div>

      <LayerRail />
      <AreaPanel />
      <TimeScrubber />
      <ChatDock />
      <GetDataSheet />
    </div>
  );
}

function MarketChip() {
  return (
    <Tooltip
      side="bottom"
      label={
        <span className="block max-w-56 whitespace-normal text-left leading-relaxed">
          This demo runs on an LA snapshot. Production covers all of the US — every metro, updated continuously.
        </span>
      }
    >
      <span className="flex h-8 cursor-default items-center gap-1.5 rounded-md border border-line bg-panel/90 px-2.5 text-xs text-ink-muted shadow-panel backdrop-blur-md">
        <span className="size-1.5 rounded-full bg-accent" />
        Los Angeles
        <span className="text-2xs text-ink-faint">· demo snapshot</span>
      </span>
    </Tooltip>
  );
}

function BasemapToggle() {
  const basemap = useExplore((s) => s.basemap);
  const setBasemap = useExplore((s) => s.setBasemap);
  return (
    <Segmented<Basemap>
      className="bg-panel/90 shadow-panel backdrop-blur-md"
      value={basemap}
      onChange={setBasemap}
      options={[
        { value: "dark", icon: <Moon />, title: "Dark basemap" },
        { value: "light", icon: <Sun />, title: "Light basemap" },
        { value: "satellite", icon: <Globe />, title: "Satellite" },
      ]}
    />
  );
}
