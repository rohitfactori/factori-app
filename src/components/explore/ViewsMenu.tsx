"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, ChevronDown, Check } from "lucide-react";
import { LA } from "@/lib/snapshot/la-meta";
import type { SavedView } from "@/lib/snapshot/types";
import { loadUserViews, useExplore } from "@/lib/store/explore";
import { Button } from "@/components/ui/button";

export function ViewsMenu() {
  const applyView = useExplore((s) => s.applyView);
  const saveViewAs = useExplore((s) => s.saveViewAs);
  const [open, setOpen] = useState(false);
  const [userViews, setUserViews] = useState<SavedView[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [savedTick, setSavedTick] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setUserViews(loadUserViews());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function save() {
    const n = name.trim();
    if (!n) return;
    saveViewAs(n);
    setUserViews(loadUserViews());
    setName("");
    setSaving(false);
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 1200);
  }

  function ViewRow({ v }: { v: SavedView }) {
    return (
      <button
        onClick={() => {
          applyView(v);
          setOpen(false);
        }}
        className="block w-full border-b border-line/60 px-3 py-2 text-left transition-colors last:border-0 hover:bg-panel-2"
      >
        <span className="block truncate text-xs font-medium text-ink">{v.name}</span>
        {v.description && (
          <span className="mt-0.5 block truncate text-2xs leading-relaxed text-ink-faint">{v.description}</span>
        )}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <Button variant="secondary" className="bg-panel/90 shadow-panel backdrop-blur-md" onClick={() => setOpen((v) => !v)}>
        <Bookmark />
        Views
        {savedTick ? <Check className="text-positive" /> : <ChevronDown />}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-80 overflow-hidden rounded-lg border border-line bg-panel shadow-pop">
          <div className="label-eyebrow border-b border-line px-3 py-2">Demo stories</div>
          {LA.views.map((v) => (
            <ViewRow key={v.id} v={v} />
          ))}

          {userViews.length > 0 && (
            <>
              <div className="label-eyebrow border-y border-line px-3 py-2">Your views</div>
              {userViews.map((v) => (
                <ViewRow key={v.id} v={v} />
              ))}
            </>
          )}

          <div className="border-t border-line p-2">
            {saving ? (
              <div className="flex gap-1.5">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") save();
                    if (e.key === "Escape") setSaving(false);
                  }}
                  placeholder="View name…"
                  className="h-7 min-w-0 flex-1 rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none placeholder:text-ink-faint focus:border-accent-dim"
                />
                <Button variant="primary" size="sm" onClick={save} disabled={!name.trim()}>
                  Save
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setSaving(true)}
                className="w-full rounded-md px-2 py-1.5 text-left text-xs text-ink-muted transition-colors hover:bg-panel-2 hover:text-ink"
              >
                Save current view…
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
