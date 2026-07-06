"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useExplore } from "@/lib/store/explore";
import { LAYER_CONFIGS } from "@/lib/explore/metrics";
import { ExploreMap } from "./ExploreMap";

export function ExploreSurface() {
  const params = useSearchParams();

  // seed the first layer (catalog handoff via ?dataset=…, else Movement visits)
  useEffect(() => {
    const st = useExplore.getState();
    if (st.layers.length) return;
    const ds = params.get("dataset");
    st.addLayer(ds && LAYER_CONFIGS[ds] ? ds : "movement-graph");
  }, [params]);

  return (
    <div className="relative h-full">
      <ExploreMap />
      {/* top strip (search · views · market · basemap) — Tasks 10/12 */}
      {/* <LayerRail /> Task 7 · <AreaPanel /> Task 8 · <TimeScrubber /> Task 9 · <ChatDock /> Task 11 · <GetDataSheet /> Task 12 */}
    </div>
  );
}
