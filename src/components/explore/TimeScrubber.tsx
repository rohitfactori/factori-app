"use client";

import { useEffect } from "react";
import { Pause, Play } from "lucide-react";
import { isTemporal } from "@/lib/explore/metrics";
import { LA } from "@/lib/snapshot/la-meta";
import { useExplore } from "@/lib/store/explore";
import { IconButton } from "@/components/ui/button";

export function TimeScrubber() {
  const layers = useExplore((s) => s.layers);
  const timeIndex = useExplore((s) => s.timeIndex);
  const setTimeIndex = useExplore((s) => s.setTimeIndex);
  const playing = useExplore((s) => s.playing);
  const setPlaying = useExplore((s) => s.setPlaying);

  const active = layers.some((l) => l.visible && isTemporal(l));

  useEffect(() => {
    if (!playing || !active) return;
    const t = setInterval(() => {
      const s = useExplore.getState();
      s.setTimeIndex((s.timeIndex + 1) % 12);
    }, 600);
    return () => clearInterval(t);
  }, [playing, active]);

  // pause when the temporal layer disappears
  useEffect(() => {
    if (!active && playing) setPlaying(false);
  }, [active, playing, setPlaying]);

  if (!active) return null;

  return (
    <div className="animate-rise absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-line bg-panel/90 py-1.5 pl-1.5 pr-3.5 shadow-panel backdrop-blur-md">
      <IconButton
        size="sm"
        aria-label={playing ? "Pause" : "Play 12 months"}
        className="rounded-full bg-accent text-accent-ink hover:bg-accent-hover"
        onClick={() => setPlaying(!playing)}
      >
        {playing ? <Pause /> : <Play />}
      </IconButton>
      <input
        type="range"
        min={0}
        max={11}
        step={1}
        value={timeIndex}
        onChange={(e) => {
          setPlaying(false);
          setTimeIndex(Number(e.target.value));
        }}
        className="h-1 w-56"
        style={{ accentColor: "var(--color-accent)" }}
        aria-label="Month"
      />
      <span className="w-12 text-right text-xs font-medium tabular-nums text-ink">
        {LA.months[timeIndex]}
      </span>
    </div>
  );
}
