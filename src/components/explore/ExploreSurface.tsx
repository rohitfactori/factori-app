"use client";

import { useEffect } from "react";
import { useExplore } from "@/lib/store/explore";
import { LAYER_CONFIGS } from "@/lib/explore/metrics";
import { AreaPanel } from "./AreaPanel";
import { ExploreMap } from "./ExploreMap";
import { LayerRail } from "./LayerRail";
import { TimeScrubber } from "./TimeScrubber";

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
      <LayerRail />
      <AreaPanel />
      <TimeScrubber />
      {/* top strip (search · views · market · basemap) — Tasks 10/12 */}
      {/* <ChatDock /> Task 11 · <GetDataSheet /> Task 12 */}
    </div>
  );
}
