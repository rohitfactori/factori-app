"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Plus, MapPin, X } from "lucide-react";
import { useAsk } from "@/lib/store/ask";
import { FactoriMark } from "@/components/brand";
import { cn } from "@/lib/cn";
import { InsightCard } from "./InsightCard";
import type { ChatMessage } from "@/lib/store/ask";

export function ChatPane({ onHide }: { onHide?: () => void } = {}) {
  const messages = useAsk((s) => s.messages);
  const isThinking = useAsk((s) => s.isThinking);
  const submit = useAsk((s) => s.submit);
  const result = useAsk((s) => s.result);
  const reset = useAsk((s) => s.reset);
  const [val, setVal] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [messages.length, isThinking]);

  function send() {
    if (!val.trim()) return;
    submit(val);
    setVal("");
  }

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-line px-3">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <FactoriMark className="size-4" />
          Ask Factori
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={reset}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink"
          >
            <Plus className="size-3.5" />
            New
          </button>
          {onHide && (
            <button
              onClick={onHide}
              className="grid size-6 place-items-center rounded-md text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink"
              aria-label="Hide chat"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3.5 overflow-y-auto px-3 py-3.5">
        {messages.map((m) => (
          <Bubble key={m.id} m={m} hasResult={!!result} />
        ))}
        {isThinking && <Thinking />}
      </div>

      {result && !isThinking && result.followups.length > 0 && (
        <div className="flex shrink-0 flex-wrap gap-1.5 px-3 pb-2">
          {result.followups.map((f) => (
            <button
              key={f}
              onClick={() => submit(f)}
              className="rounded-full border border-line bg-panel-2/60 px-2.5 py-1 text-xs text-ink-muted transition-colors hover:border-accent-dim hover:text-ink"
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <div className="shrink-0 border-t border-line p-2.5">
        <div className="flex items-end gap-2 rounded-lg border border-line bg-canvas p-2 transition-colors focus-within:border-accent-dim">
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Ask about places, people, movement…"
            className="max-h-32 flex-1 resize-none bg-transparent text-sm leading-5 text-ink outline-none placeholder:text-ink-faint"
          />
          <button
            onClick={send}
            disabled={!val.trim()}
            className="grid size-7 shrink-0 place-items-center rounded-md bg-accent text-accent-ink transition-opacity disabled:opacity-35"
            aria-label="Send"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ m, hasResult }: { m: ChatMessage; hasResult: boolean }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] rounded-lg rounded-br-sm border border-line bg-panel-2 px-3 py-1.5 text-sm text-ink">
          {m.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border border-line bg-canvas">
        <FactoriMark className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-sm leading-[1.5] text-ink-muted">{m.text}</p>
        {m.insight ? (
          <InsightCard insight={m.insight} variant="chat" />
        ) : hasResult ? (
          <div className="inline-flex items-center gap-1.5 text-xs text-accent">
            <MapPin className="size-3.5" />
            Rendered on the canvas
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border border-line bg-canvas">
        <FactoriMark className="size-3.5" />
      </div>
      <div className="flex items-center gap-2 pt-1 text-xs text-ink-faint">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-bounce rounded-full bg-accent"
              style={{ animationDelay: `${i * 140}ms`, animationDuration: "1s" }}
            />
          ))}
        </span>
        Reading movement, places & audience graphs…
      </div>
    </div>
  );
}
