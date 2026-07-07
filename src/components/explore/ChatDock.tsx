"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Minus, Sparkles } from "lucide-react";
import { useExplore } from "@/lib/store/explore";
import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const CHIPS = [
  "Where do high-income parents live?",
  "Show QSR foot traffic trends and play",
  "Median income around Santa Monica",
  "Tell me about this area",
];

export function ChatDock() {
  const open = useExplore((s) => s.chatOpen);
  const setOpen = useExplore((s) => s.setChatOpen);
  const messages = useExplore((s) => s.chatMessages);
  const thinking = useExplore((s) => s.chatThinking);
  const submit = useExplore((s) => s.submitChat);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking, open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="animate-rise absolute bottom-3 left-3 z-30 flex items-center gap-2 rounded-full border border-line bg-panel/90 py-2 pl-3 pr-4 text-xs text-ink-muted shadow-panel backdrop-blur-md transition-colors hover:border-line-strong hover:text-ink"
      >
        <Sparkles className="size-3.5 text-accent" />
        Ask the data…
      </button>
    );
  }

  function send(text: string) {
    submit(text);
    setDraft("");
  }

  return (
    <div className="animate-rise absolute bottom-3 left-3 z-30 flex h-[430px] w-[330px] flex-col overflow-hidden rounded-xl border border-line bg-panel/95 shadow-pop backdrop-blur-md">
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-line px-3">
        <Sparkles className="size-3.5 text-accent" />
        <span className="text-xs font-medium text-ink">Demo agent</span>
        <span className="label-eyebrow">offline · scripted</span>
        <IconButton size="xs" aria-label="Minimize chat" className="ml-auto" onClick={() => setOpen(false)}>
          <Minus />
        </IconButton>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div>
            <p className="text-2xs leading-relaxed text-ink-muted">
              I drive the same controls you see — layers, filters, the camera. Ask in plain English.
            </p>
            <div className="mt-2.5 flex flex-col gap-1.5">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="rounded-lg border border-line bg-panel px-2.5 py-1.5 text-left text-2xs text-ink-muted transition-colors hover:border-line-strong hover:bg-panel-2 hover:text-ink"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[86%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed",
              m.role === "user"
                ? "ml-auto bg-accent-tint text-ink"
                : "border border-line bg-panel-2/60 text-ink-muted"
            )}
          >
            {m.text}
          </div>
        ))}

        {thinking && (
          <div className="flex w-14 items-center justify-center gap-1 rounded-lg border border-line bg-panel-2/60 px-2.5 py-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1 animate-pulse rounded-full bg-ink-faint"
                style={{ animationDelay: `${i * 160}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-line p-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-2 transition-colors focus-within:border-accent-dim">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) send(draft);
            }}
            placeholder="Map something, or ask about an area…"
            className="h-8 min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-faint"
          />
          <IconButton
            size="xs"
            variant="primary"
            aria-label="Send"
            disabled={!draft.trim() || thinking}
            onClick={() => draft.trim() && send(draft)}
          >
            <ArrowUp />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
