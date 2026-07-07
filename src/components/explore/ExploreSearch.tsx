"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, Store, Tag } from "lucide-react";
import { getSearchIndex, searchPlaces, type SearchHit } from "@/lib/explore/search";
import { useExplore } from "@/lib/store/explore";
import { Kbd } from "@/components/ui/field";
import { cn } from "@/lib/cn";

const KIND_ICON = { area: MapPin, poi: Store, brand: Tag } as const;

export function ExploreSearch() {
  const goTo = useExplore((s) => s.goTo);
  const selectHex = useExplore((s) => s.selectHex);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const hits = q.trim().length >= 2 ? searchPlaces(q, getSearchIndex()) : [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  function choose(hit: SearchHit) {
    goTo(hit.center, hit.zoom);
    if (hit.h3) selectHex(hit.h3);
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
  }

  return (
    <div ref={wrapRef} className="relative w-[280px]">
      <div className="flex items-center gap-2 rounded-lg border border-line bg-panel/90 px-2.5 shadow-panel backdrop-blur-md transition-colors focus-within:border-accent-dim">
        <Search className="size-3.5 shrink-0 text-ink-faint" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            else if (e.key === "Enter" && hits[active]) choose(hits[active]);
            else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
          }}
          placeholder="Search places, brands, areas…"
          className="h-8 min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-faint"
        />
        <Kbd>/</Kbd>
      </div>

      {open && hits.length > 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border border-line bg-panel shadow-pop">
          {hits.map((h, i) => {
            const Icon = KIND_ICON[h.kind];
            return (
              <button
                key={h.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(h)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors",
                  i === active ? "bg-panel-2" : "hover:bg-panel-2/60"
                )}
              >
                <Icon className="size-3.5 shrink-0 text-ink-faint" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-ink">{h.label}</span>
                  <span className="block truncate text-2xs text-ink-faint">{h.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      {open && q.trim().length >= 2 && hits.length === 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 rounded-lg border border-line bg-panel px-3 py-2.5 text-2xs text-ink-faint shadow-pop">
          No matches in the LA snapshot.
        </div>
      )}
    </div>
  );
}
