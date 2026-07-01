"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpRight, Sparkles, CornerDownLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUI } from "@/lib/store/ui";
import { useAsk } from "@/lib/store/ask";
import { allNav } from "@/lib/nav";
import { SAMPLE_PROMPTS } from "@/lib/mock/agent";
import { cn } from "@/lib/cn";
import { Kbd } from "@/components/ui/field";

type Item = { type: "ask" | "nav"; label: string; href?: string; icon?: LucideIcon };

export function CommandMenu() {
  const open = useUI((s) => s.cmdkOpen);
  const setOpen = useUI((s) => s.setCmdk);
  const router = useRouter();
  const submit = useAsk((s) => s.submit);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { askF, navF, flat } = useMemo(() => {
    const lq = q.toLowerCase().trim();
    const nav: Item[] = allNav
      .filter((n) => n.label.toLowerCase().includes(lq))
      .map((n) => ({ type: "nav", label: n.label, href: n.href, icon: n.icon }));
    const base: Item[] = SAMPLE_PROMPTS.filter((p) =>
      p.toLowerCase().includes(lq)
    ).map((p) => ({ type: "ask", label: p }));
    const ask: Item[] = lq
      ? [{ type: "ask", label: q }, ...base.filter((b) => b.label.toLowerCase() !== lq)]
      : base;
    return { askF: ask, navF: nav, flat: [...ask, ...nav] };
  }, [q]);

  useEffect(() => {
    setIdx(0);
  }, [q]);
  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  function run(item: Item) {
    setOpen(false);
    if (item.type === "ask") {
      submit(item.label);
      router.push("/");
    } else if (item.href) {
      router.push(item.href);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[idx]) run(flat[idx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      onMouseDown={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-canvas/70 backdrop-blur-sm" />
      <div
        className="animate-rise relative w-full max-w-[560px] overflow-hidden rounded-xl border border-line bg-panel shadow-pop"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-3.5">
          <Search className="size-4 shrink-0 text-ink-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask Factori anything, or jump to…"
            className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <Kbd>esc</Kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-1.5">
          {askF.length > 0 && (
            <Group label="Ask Factori">
              {askF.map((it) => {
                const i = flat.indexOf(it);
                return (
                  <Row
                    key={"a" + it.label}
                    active={i === idx}
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => run(it)}
                  >
                    <Sparkles className="size-4 shrink-0 text-accent" />
                    <span className="truncate text-ink">{it.label}</span>
                    <CornerDownLeft className="ml-auto size-3.5 shrink-0 text-ink-faint opacity-0 group-hover/row:opacity-100" />
                  </Row>
                );
              })}
            </Group>
          )}
          {navF.length > 0 && (
            <Group label="Go to">
              {navF.map((it) => {
                const i = flat.indexOf(it);
                const Icon = it.icon;
                return (
                  <Row
                    key={"n" + it.href}
                    active={i === idx}
                    onMouseEnter={() => setIdx(i)}
                    onClick={() => run(it)}
                  >
                    {Icon && <Icon className="size-4 shrink-0 text-ink-faint" />}
                    <span className="truncate text-ink-muted">{it.label}</span>
                    <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-ink-faint opacity-0 group-hover/row:opacity-100" />
                  </Row>
                );
              })}
            </Group>
          )}
          {flat.length === 0 && (
            <div className="px-3 py-8 text-center text-xs text-ink-faint">
              No matches. Press <Kbd>↵</Kbd> to ask Factori directly.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="label-eyebrow px-2 py-1.5">{label}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Row({
  active,
  children,
  onClick,
  onMouseEnter,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "group/row flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
        active ? "bg-panel-2" : "hover:bg-panel-2/60"
      )}
    >
      {children}
    </button>
  );
}
