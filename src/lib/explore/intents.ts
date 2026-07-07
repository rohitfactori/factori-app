/** Deterministic demo agent: parses a question into store actions + a reply
 *  composed from real snapshot values, so chat and map always agree. Phase 2
 *  swaps this for a live agent on the Factori MCP behind the same actions. */
import { fmtCompact, fmtUSDCompact } from "@/lib/format";
import type { HexProps } from "@/lib/snapshot/types";
import { METRIC_BY_ID } from "./metrics";
import type { SearchHit } from "./search";

export type IntentAction =
  | { type: "addLayer"; datasetId: string; metricId?: string; variant?: string; poiCat?: string }
  | { type: "removeLayer"; datasetId: string }
  | { type: "clearLayers" }
  | { type: "goTo"; center: [number, number]; zoom: number; h3?: string }
  | { type: "setTime"; index: number }
  | { type: "play" };

export type IntentCtx = {
  hits: (q: string) => SearchHit[];
  topHex: (prop: string) => { label: string; value: number } | null;
  selected: HexProps | null;
  months: string[];
};

export type IntentResult = { reply: string; actions: IntentAction[] };

const SUGGESTIONS =
  'Try "show median income", "QSR foot traffic trends", "coffee shops in Santa Monica", or click a hex and ask "tell me about this area".';

const SEG_LABEL: Record<string, string> = {
  au_hip: "high-income parents",
  au_trv: "frequent travelers",
  au_auto: "auto intenders",
  au_fit: "fitness enthusiasts",
  au_mov: "new movers",
  au_lux: "luxury shoppers",
};

function trendCat(lq: string): string | undefined {
  if (/\bqsr\b|coffee|burger|fast food/.test(lq)) return "qsr";
  if (/retail|shopping/.test(lq)) return "retail";
  if (/grocery|supermarket/.test(lq)) return "grocery";
  if (/fitness|gym/.test(lq)) return "fitness";
  return undefined;
}

function spendCat(lq: string): string {
  if (/food|dining|restaurant/.test(lq)) return "sp_food";
  if (/grocery/.test(lq)) return "sp_grocery";
  if (/fitness|gym/.test(lq)) return "sp_fitness";
  if (/fuel|gas|auto/.test(lq)) return "sp_fuel";
  return "sp_retail";
}

function poiCat(lq: string): string | undefined {
  if (/coffee|restaurant|qsr|dining|food/.test(lq)) return "food";
  if (/grocery|supermarket/.test(lq)) return "grocery";
  if (/pharmacy|health|clinic|gym/.test(lq)) return "health";
  if (/bank|financial|atm/.test(lq)) return "fin";
  if (/shop|store|retail/.test(lq)) return "retail";
  return undefined;
}

function segment(lq: string): string | undefined {
  if (/parent/.test(lq)) return "au_hip";
  if (/travel/.test(lq)) return "au_trv";
  if (/auto intend|car (buyer|shopper)|auto (buyer|audience)/.test(lq)) return "au_auto";
  if (/mover/.test(lq)) return "au_mov";
  if (/luxury/.test(lq)) return "au_lux";
  if (/(fitness|gym).*(audience|people|enthusiast|goer)|(audience|people).*(fitness|gym)/.test(lq)) return "au_fit";
  return undefined;
}

/** the tail after a locative preposition, for place resolution */
function placeTail(lq: string): string | null {
  const m = lq.match(/\b(?:in|near|around|across)\s+([a-z' ]{3,40})\s*[?.!]?$/);
  return m ? m[1].trim() : null;
}

function describeReply(p: HexProps): string {
  const segs = (Object.keys(SEG_LABEL) as (keyof typeof SEG_LABEL)[])
    .map((id) => ({ id, v: (p as unknown as Record<string, number>)[id] ?? 0 }))
    .sort((a, b) => b.v - a.v);
  const topSeg = segs[0];
  const spends: [string, number][] = [
    ["food & dining", p.sp_food],
    ["retail", p.sp_retail],
    ["grocery", p.sp_grocery],
    ["fitness", p.sp_fitness],
    ["fuel & auto", p.sp_fuel],
  ];
  const topSpend = spends.sort((a, b) => b[1] - a[1])[0];
  const brands = p.poi_top.slice(0, 3).join(", ");
  return (
    `${p.label}: ~${fmtCompact(p.mv_visits)} visits/mo with a ${p.mv_dwell}m median dwell. ` +
    `Median HH income ${fmtUSDCompact(p.dm_hhi)}, top segment ${SEG_LABEL[topSeg.id]} at ${topSeg.v.toFixed(0)}%. ` +
    `Spend over-indexes on ${topSpend[0]} (${Math.round(topSpend[1])}).` +
    (brands ? ` Notable brands: ${brands}.` : "")
  );
}

function mappedReply(metricId: string, ctx: IntentCtx, topProp?: string): string {
  const label = METRIC_BY_ID[metricId]?.label ?? metricId;
  const top = ctx.topHex(topProp ?? metricId);
  if (!top) return `Mapped ${label} across the LA snapshot.`;
  const fmt = METRIC_BY_ID[topProp ?? metricId]?.fmt ?? ((v: number) => String(Math.round(v)));
  return `Mapped ${label} — ${top.label} leads at ${fmt(top.value)}.`;
}

export function parseIntent(text: string, ctx: IntentCtx): IntentResult {
  const lq = text.toLowerCase().trim();
  const actions: IntentAction[] = [];

  // 1 · describe the selected hex
  if (/tell me about|describe|what'?s (this|here)|about this (area|hex|place)/.test(lq)) {
    if (ctx.selected) return { reply: describeReply(ctx.selected), actions: [] };
    return { reply: "Click a hex first, then ask again — or ask me to map something.", actions: [] };
  }

  // 2 · clear
  if (/\b(clear|start over|reset)\b/.test(lq)) {
    return { reply: "Cleared the canvas. What should we look at next?", actions: [{ type: "clearLayers" }] };
  }

  // 3 · place resolution (appended to whatever layer intent matches)
  const tail = placeTail(lq);
  const hit = tail ? ctx.hits(tail)[0] : undefined;
  const goActions: IntentAction[] = hit ? [{ type: "goTo", center: hit.center, zoom: hit.zoom, h3: hit.h3 }] : [];
  const placeNote = hit ? ` Zoomed to ${hit.label}.` : "";

  const wantsPlay = /\b(play|animate|animation)\b/.test(lq);

  // 4 · layer intents, most specific first
  const seg = segment(lq);
  if (seg) {
    actions.push({ type: "addLayer", datasetId: "people-audience", metricId: seg });
    return { reply: mappedReply(seg, ctx) + placeNote, actions: [...actions, ...goActions] };
  }
  if (/spend|spending/.test(lq)) {
    const m = spendCat(lq);
    actions.push({ type: "addLayer", datasetId: "consumer-spend", metricId: m });
    return { reply: mappedReply(m, ctx) + placeNote, actions: [...actions, ...goActions] };
  }
  if (/trend|over (the )?(last|past)|12 month|year/.test(lq) || wantsPlay) {
    actions.push({ type: "addLayer", datasetId: "foot-traffic-trends", metricId: "tr", variant: trendCat(lq) ?? "all" });
    if (wantsPlay) actions.push({ type: "play" });
    const reply = wantsPlay
      ? `Playing 12 months of visitation (${ctx.months[0]} → ${ctx.months[11]}). Watch the hotspots shift.${placeNote}`
      : `Mapped the visitation index — scrub or press play to move through the year.${placeNote}`;
    return { reply, actions: [...actions, ...goActions] };
  }
  if (/income|hhi|affluen|wealth/.test(lq)) {
    actions.push({ type: "addLayer", datasetId: "demographics-income", metricId: "dm_hhi" });
    return { reply: mappedReply("dm_hhi", ctx) + placeNote, actions: [...actions, ...goActions] };
  }
  if (/population|people per|density of people/.test(lq)) {
    actions.push({ type: "addLayer", datasetId: "demographics-income", metricId: "dm_pop" });
    return { reply: mappedReply("dm_pop", ctx) + placeNote, actions: [...actions, ...goActions] };
  }
  if (/median age|\bage\b/.test(lq)) {
    actions.push({ type: "addLayer", datasetId: "demographics-income", metricId: "dm_age" });
    return { reply: mappedReply("dm_age", ctx) + placeNote, actions: [...actions, ...goActions] };
  }
  if (/\bpoi|places|stores?|shops?|restaurants?|locations\b|coffee/.test(lq)) {
    const cat = poiCat(lq);
    actions.push({ type: "addLayer", datasetId: "places-poi", variant: "points", ...(cat ? { poiCat: cat } : {}) });
    return {
      reply: `Dropped POIs on the map${cat ? ` (${cat === "food" ? "food & dining" : cat})` : ""} from the Places graph.${placeNote}`,
      actions: [...actions, ...goActions],
    };
  }
  if (/dwell/.test(lq)) {
    actions.push({ type: "addLayer", datasetId: "movement-graph", metricId: "mv_dwell" });
    return { reply: mappedReply("mv_dwell", ctx) + placeNote, actions: [...actions, ...goActions] };
  }
  if (/visit|foot.?traffic|footfall|movement|busiest|busy/.test(lq)) {
    const variant = /evening|night/.test(lq) ? "eve" : /daytime|during the day/.test(lq) ? "day" : "all";
    actions.push({ type: "addLayer", datasetId: "movement-graph", metricId: "mv_visits", variant });
    return { reply: mappedReply("mv_visits", ctx) + placeNote, actions: [...actions, ...goActions] };
  }

  // 5 · bare place ("santa monica")
  const bareHit = ctx.hits(lq)[0];
  if (bareHit && lq.length >= 3) {
    return {
      reply: `Zoomed to ${bareHit.label}.`,
      actions: [{ type: "goTo", center: bareHit.center, zoom: bareHit.zoom, h3: bareHit.h3 }],
    };
  }

  // 6 · fallback
  return { reply: SUGGESTIONS, actions: [] };
}
