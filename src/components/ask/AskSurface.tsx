"use client";

import { useEffect, useState } from "react";
import { Compass, ArrowUp } from "lucide-react";
import { useAsk } from "@/lib/store/ask";
import { SAMPLE_PROMPTS } from "@/lib/mock/agent";
import { FactoriMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ChatPane } from "./ChatPane";
import { MapCanvas } from "./MapCanvas";
import { CanvasOverlay } from "./CanvasOverlay";
import { ImmersiveOverlay } from "./ImmersiveOverlay";

export function AskSurface() {
  const mode = useAsk((s) => s.mode);
  const [chatW, setChatW] = useState(424);

  function startDrag(e: React.PointerEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = chatW;
    const move = (ev: PointerEvent) =>
      setChatW(Math.min(620, Math.max(336, startW + (ev.clientX - startX))));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  if (mode === "console") return <Console />;

  return (
    <div className="flex h-full">
      {mode === "split" && (
        <>
          <div style={{ width: chatW }} className="h-full shrink-0">
            <ChatPane />
          </div>
          <div
            onPointerDown={startDrag}
            className="group relative w-px shrink-0 cursor-col-resize bg-line"
          >
            <div className="absolute inset-y-0 -left-1 -right-1 transition-colors group-hover:bg-accent/30" />
          </div>
        </>
      )}
      <div className="relative min-w-0 flex-1">
        <MapCanvas />
        {mode === "immersive" ? <ImmersiveOverlay /> : <CanvasOverlay />}
        {mode === "immersive" && <FloatingChat />}
      </div>
    </div>
  );
}

/* ---------------- Console (empty state) ---------------- */
const WELCOME_LINES = [
  "Find your next store. Reach your next customer.",
  "Put the real world into every decision.",
  "Know every place. Reach every person. Map every move.",
  "Real-world answers, at the speed of a question.",
];

function Console() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % WELCOME_LINES.length), 4600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative h-full overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_60%_60%_at_center,black,transparent_78%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-accent/[0.04] to-transparent" />
      <div className="relative z-10 mx-auto flex h-full max-w-[660px] flex-col items-center justify-center px-6">
        <div className="grid size-12 place-items-center rounded-2xl border border-line bg-panel">
          <FactoriMark className="size-7" />
        </div>
        <div className="label-eyebrow mt-4">Welcome back, Rohit</div>
        <h1
          key={i}
          className="animate-rise mt-2 max-w-xl text-balance text-center text-[26px] font-semibold leading-tight tracking-tight text-ink"
        >
          {WELCOME_LINES[i]}
        </h1>
        <div className="mt-6 w-full">
          <ConsoleInput />
        </div>
        <div className="mt-3.5 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          {SAMPLE_PROMPTS.map((p) => (
            <SampleChip key={p} prompt={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ConsoleInput() {
  const submit = useAsk((s) => s.submit);
  const [v, setV] = useState("");
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-panel p-2 shadow-panel transition-colors focus-within:border-accent-dim">
      <Compass className="ml-1.5 size-4 shrink-0 text-ink-faint" />
      <input
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && v.trim()) submit(v);
        }}
        placeholder="Ask anything about places, people, and movement…"
        className="h-9 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
      />
      <Button
        variant="primary"
        size="md"
        onClick={() => submit(v)}
        disabled={!v.trim()}
      >
        Ask
        <ArrowUp className="size-3.5" />
      </Button>
    </div>
  );
}

function SampleChip({ prompt }: { prompt: string }) {
  const submit = useAsk((s) => s.submit);
  return (
    <button
      onClick={() => submit(prompt)}
      className="flex items-center gap-2.5 rounded-lg border border-line bg-panel/60 px-3 py-2 text-left text-xs text-ink-muted transition-colors hover:border-line-strong hover:bg-panel-2 hover:text-ink"
    >
      <Compass className="size-3.5 shrink-0 text-ink-faint" />
      <span className="truncate">{prompt}</span>
    </button>
  );
}

/* ---------------- Immersive floating chat (hideable) ---------------- */
function FloatingChat() {
  const chatOpen = useAsk((s) => s.chatOpen);
  const setChatOpen = useAsk((s) => s.setChatOpen);
  if (!chatOpen) return null;
  return (
    <div className="absolute bottom-3 left-3 top-[60px] z-20 w-[360px] max-w-[60vw]">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-panel/95 shadow-pop backdrop-blur-md">
        <ChatPane onHide={() => setChatOpen(false)} />
      </div>
    </div>
  );
}
