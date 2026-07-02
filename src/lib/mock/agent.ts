import {
  CITIES,
  DEFAULT_CITY,
  detectCity,
  scatter,
  isoPolygon,
  MAP,
  type CityDef,
  type LngLat,
} from "./geo";
import { fmtCompact, fmtInt, seeded } from "@/lib/format";

/* ----------------------------- types ----------------------------- */
export type Provenance = {
  dataset: string;
  category: string;
  coverage: string;
  freshness: string;
  credits: number;
};
export type LayerKind = "points" | "choropleth" | "heat";
export type LayerDef = {
  id: string;
  label: string;
  kind: LayerKind;
  color: string;
  visible: boolean;
  count?: number;
};
export type Control =
  | { id: string; kind: "slider"; label: string; min: number; max: number; step: number; value: number; unit?: string }
  | { id: string; kind: "select"; label: string; options: string[]; value: string }
  | { id: string; kind: "toggle"; label: string; value: boolean };

export type Feature = {
  id: string;
  name: string;
  lng: number;
  lat: number;
  category?: string;
  metric: string;
  metricLabel: string;
  sub?: string;
  score?: number;
  value: number;
  polygon?: LngLat[];
};

export type ResultKind = "places" | "areas" | "audience";
export type Column = { key: string; label: string; align?: "left" | "right" };
export type Scorecard = {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "positive" | "accent";
};

export type ResultPayload = {
  kind: ResultKind;
  title: string;
  summary: string;
  place: string;
  center: LngLat;
  zoom: number;
  features: Feature[];
  rankLabel: string;
  scorecards: Scorecard[];
  columns: Column[];
  rows: Record<string, string | number>[];
  layers: LayerDef[];
  controls: Control[];
  provenance: Provenance[];
  followups: string[];
};

export type InsightChart =
  | { type: "area"; data: { label: string; value: number }[] }
  | { type: "bars"; data: { label: string; value: number; color?: string }[] }
  | { type: "donut"; segments: { label: string; value: number; color: string }[]; centerLabel?: string };

export type InsightPayload = {
  kind: "insight";
  title: string;
  place: string;
  headline: { value: string; label: string; delta?: number };
  chart: InsightChart;
  stats: { label: string; value: string }[];
  note?: string;
  provenance: Provenance[];
  followups: string[];
};

export type AgentResponse =
  | { text: string; kind: "map"; result: ResultPayload }
  | { text: string; kind: "insight"; insight: InsightPayload };

/* --------------------------- presets ----------------------------- */
const DS: Record<string, Provenance> = {
  movement: { dataset: "Global Movement Graph", category: "Mobility", coverage: "248 countries", freshness: "Daily", credits: 12 },
  poi: { dataset: "Places & POI Graph", category: "Places", coverage: "232M places", freshness: "Weekly", credits: 6 },
  audience: { dataset: "People & Audience Graph", category: "Audiences", coverage: "1.6B profiles", freshness: "Monthly", credits: 9 },
  demo: { dataset: "Demographics & Income", category: "Census+", coverage: "Block-group", freshness: "Annual", credits: 4 },
  ctv: { dataset: "Cross-Device / CTV Graph", category: "Identity", coverage: "312M profiles", freshness: "Weekly", credits: 8 },
};

const NEIGHBORHOODS = [
  "Downtown", "Midtown", "Westside", "North End", "Harbor", "Uptown",
  "Riverside", "Highland Park", "Lakeview", "Old Town", "Financial District",
  "Eastgate", "Sunset", "Marina", "Brookhaven", "Fairview", "Cedar Heights", "Grandview",
];
const INSURANCE = ["SecureLife Assurance", "Anchor Mutual", "Prime Shield", "Sentinel Insurance", "Vanguard Cover", "Apex Assurance", "Harbor Indemnity", "Bharat Assure", "Meridian Risk", "Crown Guard"];
const CONSULTING = ["Meridian Consulting", "Northpoint Advisory", "Cedar & Vale", "Vantage Partners", "Lattice Group", "Orion Strategy", "Brightpath Consulting", "Kestrel Advisory"];
const FITNESS = ["Apex Fitness", "PulseClub", "IronWorks Gym", "Summit Athletic", "Core Collective", "Vertex Fitness"];
const GROCERY = ["FreshMart", "GreenLeaf Grocers", "Harbor Foods", "DailyBasket", "Cedar Market", "UrbanPantry"];

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

type Subject = {
  label: string;
  category: string;
  name: (i: number, area: string) => string;
};
function brand(base: string, category: string, areaSuffix = false): Subject {
  return { label: base, category, name: (_i, area) => (areaSuffix ? `${base} · ${area}` : base) };
}
function pool(label: string, arr: string[], category: string): Subject {
  return { label, category, name: (i) => arr[i % arr.length] };
}

function detectSubject(lq: string): Subject {
  if (lq.includes("starbucks")) return brand("Starbucks", "Coffee", true);
  if (lq.includes("mcdonald")) return brand("McDonald's", "QSR", true);
  if (lq.includes("insurance") || lq.includes("agenc")) return pool("Insurance agencies", INSURANCE, "Insurance");
  if (lq.includes("consult")) return pool("Consultants", CONSULTING, "Professional svc");
  if (lq.includes("coffee") || lq.includes("cafe") || lq.includes("café")) return brand("Café", "Coffee", true);
  if (lq.includes("gym") || lq.includes("fitness")) return pool("Fitness clubs", FITNESS, "Fitness");
  if (lq.includes("grocery") || lq.includes("supermarket")) return pool("Grocery stores", GROCERY, "Grocery");
  const m = lq.match(/find ([a-z .'&-]+?)(?: in | across | near | within |$)/);
  const label = m ? titleCase(m[1]) : "Places";
  return brand(label, "Places", true);
}

function detectSegment(lq: string): string {
  if (lq.includes("techie") || lq.includes("tech ")) return "Tech professionals";
  if (lq.includes("ceo") || lq.includes("founder") || lq.includes("executive")) return "Executives & founders";
  if (lq.includes("consultant")) return "Management consultants";
  if (lq.includes("parent")) return "High-income parents";
  if (lq.includes("traveler") || lq.includes("traveller")) return "Frequent travelers";
  if (lq.includes("high income") || lq.includes("high-income") || lq.includes("affluent") || lq.includes("wealthy")) return "High-income households";
  return "High-income households";
}

/* --------------------------- builders ----------------------------- */
function spreadFor(city: CityDef) {
  return city.zoom >= 11 ? 7 : city.zoom >= 10 ? 13 : city.zoom >= 9 ? 22 : city.zoom >= 5 ? 240 : 900;
}

function buildPlaces(lq: string, place: string, city: CityDef, rng: () => number): ResultPayload {
  const subject = detectSubject(lq);
  const n = 16;
  const pts = scatter(city.center, n, spreadFor(city), rng);
  const features: Feature[] = pts
    .map((p, i) => {
      const area = NEIGHBORHOODS[Math.floor(rng() * NEIGHBORHOODS.length)];
      const visits = Math.round(1800 + rng() * 46000);
      const dwell = Math.round(7 + rng() * 38);
      const score = Math.round(46 + rng() * 53);
      return {
        id: `p${i}`,
        name: subject.name(i, area),
        lng: p[0],
        lat: p[1],
        category: subject.category,
        metric: fmtCompact(visits),
        metricLabel: "visits/mo",
        sub: `${area} · dwell ${dwell}m`,
        score,
        value: visits,
        _area: area,
        _dwell: dwell,
      } as Feature & { _area: string; _dwell: number };
    })
    .sort((a, b) => b.value - a.value);

  const total = features.reduce((s, f) => s + f.value, 0);
  const top = features[0];
  const rows = features.map((f, i) => ({
    rank: i + 1,
    name: f.name,
    area: (f as Feature & { _area: string })._area,
    visits: fmtCompact(f.value),
    dwell: `${(f as Feature & { _dwell: number })._dwell}m`,
    score: f.score ?? 0,
  }));

  return {
    kind: "places",
    title: `${subject.label} in ${place}`,
    summary: `${features.length} ${subject.label.toLowerCase()} located in ${place}, ranked by estimated monthly visits from the Movement Graph. ${top.name.split(" · ")[1] ?? "The top site"} leads.`,
    place,
    center: city.center,
    zoom: city.zoom,
    features,
    rankLabel: "Ranked by visits/mo",
    scorecards: [
      { label: "Locations", value: fmtInt(features.length), tone: "neutral" },
      { label: "Est. visits / mo", value: fmtCompact(total), tone: "accent" },
      { label: "Top performer", value: fmtCompact(top.value), sub: top.name.length > 18 ? top.name.slice(0, 18) + "…" : top.name },
      { label: "Avg dwell", value: "21m", sub: "min / visit", tone: "neutral" },
    ],
    columns: [
      { key: "rank", label: "#", align: "right" },
      { key: "name", label: "Location" },
      { key: "area", label: "Area" },
      { key: "visits", label: "Visits/mo", align: "right" },
      { key: "score", label: "Score", align: "right" },
    ],
    rows,
    layers: [
      { id: "points", label: `${subject.label}`, kind: "points", color: MAP.point, visible: true, count: features.length },
      { id: "heat", label: "Foot-traffic heat", kind: "heat", color: MAP.amber, visible: false },
      { id: "demo", label: "Median income", kind: "choropleth", color: MAP.violet, visible: false },
    ],
    controls: [
      { id: "category", kind: "select", label: "Category", options: ["All categories", subject.category, "Within 5 mi"], value: "All categories" },
      { id: "radius", kind: "slider", label: "Trade-area radius", min: 1, max: 15, step: 1, value: 5, unit: "mi" },
      { id: "minvisits", kind: "slider", label: "Min visits / mo", min: 0, max: 40000, step: 1000, value: 0 },
      { id: "open", kind: "toggle", label: "Open now only", value: false },
    ],
    provenance: [DS.poi, DS.movement, DS.demo],
    followups: [
      `Show the 12-month footfall trend in ${place}`,
      `Footfall breakdown by device`,
      `Overlay high-income households in ${place}`,
    ],
  };
}

function buildAreas(opts: {
  kind: ResultKind;
  lq: string;
  place: string;
  city: CityDef;
  rng: () => number;
}): ResultPayload {
  const { kind, lq, place, city, rng } = opts;
  const isAudience = kind === "audience";
  const segment = isAudience ? detectSegment(lq) : "";
  let subjectLabel = segment;
  if (!isAudience) {
    const m = lq.match(/most ([a-z' ]+?)(?:\?|$)/);
    subjectLabel = m
      ? titleCase(m[1].trim())
      : /open|next store|expand|white.?space|opportunity/.test(lq)
        ? "Expansion opportunity"
        : /foot.?traffic|busiest|traffic|corridor/.test(lq)
          ? "Foot traffic"
          : /famil/.test(lq)
            ? "Families"
            : /grocery|retail|store|shop/.test(lq)
              ? "Retail demand"
              : "Activity";
  }

  const nAreas = 12;
  const centers = scatter(city.center, nAreas, spreadFor(city) * 0.7, rng);
  const features: Feature[] = centers
    .map((c, i) => {
      const area = NEIGHBORHOODS[i % NEIGHBORHOODS.length];
      const value = Math.round(isAudience ? 4000 + rng() * 88000 : 4 + rng() * 120);
      const income = Math.round(58 + rng() * 145);
      const index = Math.round(80 + rng() * 165);
      const poly = isoPolygon(c, spreadFor(city) * (0.12 + rng() * 0.06), rng);
      return {
        id: `a${i}`,
        name: area,
        lng: c[0],
        lat: c[1],
        category: "Area",
        metric: isAudience ? fmtCompact(value) : fmtInt(value),
        metricLabel: isAudience ? "matched" : "count",
        sub: isAudience ? `idx ${index} · $${income}k HHI` : `${index} vs city avg`,
        score: index,
        value,
        polygon: poly,
        _income: income,
        _index: index,
      } as Feature & { _income: number; _index: number };
    })
    .sort((a, b) => b.value - a.value);

  const total = features.reduce((s, f) => s + f.value, 0);
  const top = features[0];
  const rows = features.map((f, i) => ({
    rank: i + 1,
    area: f.name,
    count: isAudience ? fmtCompact(f.value) : fmtInt(f.value),
    income: `$${(f as Feature & { _income: number })._income}k`,
    index: (f as Feature & { _index: number })._index,
  }));

  return {
    kind,
    title: isAudience ? `${segment} in ${place}` : `Areas in ${place} by ${subjectLabel}`,
    summary: isAudience
      ? `~${fmtCompact(total)} ${segment.toLowerCase()} match across ${place}. Density concentrates in ${top.name} and ${features[1].name} — top block-groups ranked below.`
      : `${top.name} leads ${place} on ${subjectLabel.toLowerCase()} — ${fmtInt(top.value)}. Choropleth ranks all ${features.length} areas.`,
    place,
    center: city.center,
    zoom: city.zoom,
    features,
    rankLabel: isAudience ? "Ranked by audience density" : `Ranked by ${subjectLabel}`,
    scorecards: isAudience
      ? [
          { label: "Audience size", value: fmtCompact(total), tone: "accent" },
          { label: "Match rate", value: "73%", sub: "of addressable", tone: "positive" },
          { label: "Avg HH income", value: "$128k", tone: "neutral" },
          { label: "Top segment", value: "Index 214", sub: top.name },
        ]
      : [
          { label: "Areas analyzed", value: fmtInt(features.length), tone: "neutral" },
          { label: `Total ${subjectLabel}`, value: fmtInt(total), tone: "accent" },
          { label: "Top area", value: fmtInt(top.value), sub: top.name },
          { label: "Avg / area", value: fmtInt(Math.round(total / features.length)), tone: "neutral" },
        ],
    columns: isAudience
      ? [
          { key: "rank", label: "#", align: "right" },
          { key: "area", label: "Block-group" },
          { key: "count", label: "Audience", align: "right" },
          { key: "income", label: "Avg HHI", align: "right" },
          { key: "index", label: "Index", align: "right" },
        ]
      : [
          { key: "rank", label: "#", align: "right" },
          { key: "area", label: "Area" },
          { key: "count", label: subjectLabel, align: "right" },
          { key: "index", label: "vs avg", align: "right" },
        ],
    rows,
    layers: [
      { id: "choropleth", label: isAudience ? "Audience density" : `${subjectLabel} density`, kind: "choropleth", color: MAP.teal, visible: true, count: features.length },
      { id: "labels", label: "Area labels", kind: "points", color: MAP.teal, visible: true },
      ...(isAudience ? [{ id: "ctv", label: "CTV reachable", kind: "heat" as LayerKind, color: MAP.blue, visible: false }] : []),
    ],
    controls: isAudience
      ? [
          { id: "segment", kind: "select", label: "Segment", options: [segment, "All audiences", "Custom…"], value: segment },
          { id: "income", kind: "slider", label: "Min HH income", min: 0, max: 250, step: 10, value: 100, unit: "k" },
          { id: "age", kind: "select", label: "Age band", options: ["All ages", "25–34", "35–44", "45–54"], value: "All ages" },
          { id: "device", kind: "toggle", label: "CTV-reachable only", value: false },
        ]
      : [
          { id: "metric", kind: "select", label: "Measure", options: ["Count", "Per 10k residents", "Density"], value: "Count" },
          { id: "grain", kind: "select", label: "Granularity", options: ["Neighborhood", "ZIP", "Block-group"], value: "Neighborhood" },
          { id: "min", kind: "slider", label: "Min per area", min: 0, max: 100, step: 5, value: 0 },
        ],
    provenance: isAudience ? [DS.audience, DS.demo, DS.ctv] : [DS.poi, DS.movement, DS.demo],
    followups: isAudience
      ? [`Show ${segment} trend over 12 months`, `${segment} breakdown by device`, `Map high-income households in ${place}`]
      : [`Show the footfall trend in ${place}`, `Footfall breakdown by category`, `Find white-space areas in ${place}`],
  };
}

/* --------------------------- insights (non-spatial) --------------------------- */
const INSIGHT_RE =
  /\btrend|over time|last \d|past \d|month over month|year over year|\byoy\b|growth|forecast|how many|how much|number of|\bcompare\b|versus|\bvs\b|share of|breakdown|split|composition|distribution|% of|\baverage\b|\bmedian\b|by device|by category|by daypart/;
const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

function insightSubject(lq: string) {
  if (/spend|sales|revenue/.test(lq)) return "spend";
  if (/audience|people|customer|shopper|household/.test(lq)) return "audience";
  if (/store|site|location/.test(lq)) return "locations";
  return "footfall";
}

function buildInsight(lq: string, place: string, rng: () => number): InsightPayload {
  const subj = insightSubject(lq);
  const Subj = subj[0].toUpperCase() + subj.slice(1);

  if (/share|breakdown|split|composition|distribution|% of|by device|by category/.test(lq)) {
    const byDevice = /device|ctv|mobile|desktop/.test(lq);
    const segments = byDevice
      ? [
          { label: "Mobile", value: 54, color: MAP.teal },
          { label: "CTV", value: 29, color: MAP.violet },
          { label: "Desktop", value: 17, color: MAP.blue },
        ]
      : [
          { label: "Coffee & QSR", value: 34, color: MAP.teal },
          { label: "Grocery", value: 27, color: MAP.violet },
          { label: "Retail", value: 22, color: MAP.amber },
          { label: "Other", value: 17, color: MAP.blue },
        ];
    return {
      kind: "insight",
      title: `${Subj} breakdown · ${place}`,
      place,
      headline: { value: `${segments[0].value}%`, label: `${segments[0].label} — largest share` },
      chart: { type: "donut", segments, centerLabel: byDevice ? "Device" : "Category" },
      stats: segments.slice(0, 3).map((s) => ({ label: s.label, value: `${s.value}%` })),
      note: `${segments[0].label} makes up the largest share of ${subj} in ${place}.`,
      provenance: byDevice ? [DS.ctv, DS.audience] : [DS.movement, DS.poi],
      followups: [`Compare ${place} to national average`, `Show the 12-month trend`, `Activate the top segment`],
    };
  }

  if (/\bcompare\b|versus|\bvs\b/.test(lq)) {
    const cats = ["Coffee", "QSR", "Grocery", "Pharmacy", "Fitness"]
      .map((c, i) => ({ label: c, value: Math.round(6000 + rng() * 44000), color: [MAP.teal, MAP.violet, MAP.amber, MAP.blue, MAP.green][i] }))
      .sort((a, b) => b.value - a.value);
    return {
      kind: "insight",
      title: `Category comparison · ${place}`,
      place,
      headline: { value: fmtCompact(cats[0].value), label: `${cats[0].label} leads visits/mo` },
      chart: { type: "bars", data: cats },
      stats: cats.slice(0, 3).map((c) => ({ label: c.label, value: fmtCompact(c.value) })),
      note: `${cats[0].label} draws the most monthly visits across ${place}.`,
      provenance: [DS.movement, DS.poi],
      followups: [`Map ${cats[0].label} in ${place}`, `Show the 12-month trend`, `Break down by daypart`],
    };
  }

  if (/how many|how much|number of|count of/.test(lq)) {
    const total = Math.round(140000 + rng() * 860000);
    const bars = [
      { label: "25–34", value: Math.round(total * 0.31) },
      { label: "35–44", value: Math.round(total * 0.28) },
      { label: "45–54", value: Math.round(total * 0.22) },
      { label: "55+", value: Math.round(total * 0.19) },
    ];
    return {
      kind: "insight",
      title: `Estimated count · ${place}`,
      place,
      headline: { value: fmtCompact(total), label: `match in ${place}` },
      chart: { type: "bars", data: bars },
      stats: [
        { label: "Match rate", value: "73%" },
        { label: "CTV-reachable", value: fmtCompact(Math.round(total * 0.68)) },
        { label: "Avg HH income", value: "$128k" },
      ],
      note: `~${fmtCompact(total)} match across ${place}, modeled from the People & Demographics graphs.`,
      provenance: [DS.audience, DS.demo],
      followups: [`Build this as an audience`, `Map high-income households in ${place}`, `Break down by device`],
    };
  }

  // default -> trend
  let v = 18000 + rng() * 34000;
  const series = MONTHS.map((label) => {
    v = Math.max(4000, v * (0.965 + rng() * 0.1));
    return { label, value: Math.round(v) };
  });
  const first = series[0].value;
  const last = series[series.length - 1].value;
  const delta = ((last - first) / first) * 100;
  return {
    kind: "insight",
    title: `${Subj} trend · ${place}`,
    place,
    headline: { value: fmtCompact(last), label: `${subj}/mo · latest`, delta },
    chart: { type: "area", data: series },
    stats: [
      { label: "12-mo change", value: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%` },
      { label: "Peak", value: fmtCompact(Math.max(...series.map((s) => s.value))) },
      { label: "Avg / mo", value: fmtCompact(Math.round(series.reduce((s, x) => s + x.value, 0) / series.length)) },
    ],
    note: `${Subj} in ${place} ${delta >= 0 ? "grew" : "declined"} ${Math.abs(delta).toFixed(0)}% over the last 12 months.`,
    provenance: [DS.movement, DS.poi],
    followups: [`Break down by category`, `Compare to last year`, `Forecast next quarter`],
  };
}

/* --------------------------- entrypoint --------------------------- */
export function runAgent(query: string): AgentResponse {
  const lq = query.toLowerCase().trim();
  const city = detectCity(lq)?.def ?? DEFAULT_CITY;
  const place = city.label;
  const rng = seeded(hash(lq) || 7);

  if (INSIGHT_RE.test(lq)) {
    const insight = buildInsight(lq, place, rng);
    return {
      text: insight.note ?? `Here's the ${insight.title.toLowerCase()}.`,
      kind: "insight",
      insight,
    };
  }

  let kind: ResultKind = "places";
  if (
    /which areas|areas? (with|in|have)|most |per capita|density|open |next store|expand|white.?space|foot.?traffic|busiest|corridor|trade area/.test(
      lq
    )
  )
    kind = "areas";
  if (/techie|tech |ceo|founder|executive|consultant|high.?income|affluent|wealthy|audience|people|parents|professional|millennial|travel/.test(lq))
    kind = "audience";
  // "which areas ... most mcdonald's" stays areas even if it mentions people-ish words
  if (/which areas|most /.test(lq) && /mcdonald|starbucks|store|restaurant|coffee|gym|branch/.test(lq)) kind = "areas";

  const result =
    kind === "places"
      ? buildPlaces(lq, place, city, rng)
      : buildAreas({ kind, lq, place, city, rng });

  const text =
    result.summary +
    (result.provenance.length
      ? ` Built from ${result.provenance.map((p) => p.dataset).slice(0, 2).join(" + ")}.`
      : "");

  return { text, kind: "map", result };
}

export const SAMPLE_PROMPTS = [
  "Where should I open my next store in Austin?",
  "Map competitor coffee shops across Los Angeles",
  "Where are high-income families concentrated in Dallas?",
  "Busiest foot-traffic areas in Miami",
  "Find affluent millennials near San Diego",
  "Show grocery stores across Chicago",
];

export const CITY_KEYS = Object.keys(CITIES);
