import { seeded } from "@/lib/format";

export type Channel = "API" | "MCP" | "Cloud" | "Files";

export type Dataset = {
  id: string;
  name: string;
  category: string;
  records: string;
  coverage: string;
  freshness: string;
  channels: Channel[];
  credits: number;
  description: string;
  columns: { key: string; label: string; align?: "right" }[];
  tags: string[];
};

export const DATASETS: Dataset[] = [
  {
    id: "cross-device-ctv",
    name: "Cross-Device / CTV Graph",
    category: "Identity",
    records: "312M",
    coverage: "Global · 14 device types",
    freshness: "Weekly",
    channels: ["API", "MCP", "Cloud"],
    credits: 8,
    description:
      "Deterministic + probabilistic identity graph linking mobile, desktop, and CTV devices to households and segments — the backbone for cross-channel measurement and activation.",
    columns: [
      { key: "profile_id", label: "profile_id" },
      { key: "segment", label: "segment" },
      { key: "category", label: "category" },
      { key: "interest", label: "interest" },
      { key: "intent_score", label: "intent_score", align: "right" },
      { key: "device_type", label: "device_type" },
      { key: "city", label: "city" },
      { key: "country", label: "country" },
      { key: "last_seen", label: "last_seen" },
    ],
    tags: ["Marketing & Advertising", "Identity", "CTV"],
  },
  {
    id: "movement-graph",
    name: "Global Movement Graph",
    category: "Mobility",
    records: "248 countries",
    coverage: "Global · GPS + dwell",
    freshness: "Daily",
    channels: ["API", "MCP", "Cloud", "Files"],
    credits: 12,
    description:
      "Privacy-safe visitation and movement signals — trade areas, footfall, dwell time, and origin-destination flows for any place on earth.",
    columns: [
      { key: "place_id", label: "place_id" },
      { key: "brand", label: "brand" },
      { key: "visits", label: "visits", align: "right" },
      { key: "dwell_min", label: "dwell_min", align: "right" },
      { key: "city", label: "city" },
      { key: "country", label: "country" },
      { key: "period", label: "period" },
    ],
    tags: ["Retail", "Mobility", "Footfall"],
  },
  {
    id: "places-poi",
    name: "Places & POI Graph",
    category: "Places",
    records: "232M",
    coverage: "Global · 5,400 categories",
    freshness: "Weekly",
    channels: ["API", "MCP", "Cloud", "Files"],
    credits: 6,
    description:
      "Verified points of interest with geometry, categories, hours, brand chains, and open/closed status — the canonical place index behind every Factori app.",
    columns: [
      { key: "place_id", label: "place_id" },
      { key: "name", label: "name" },
      { key: "category", label: "category" },
      { key: "brand", label: "brand" },
      { key: "city", label: "city" },
      { key: "country", label: "country" },
      { key: "status", label: "status" },
    ],
    tags: ["Places", "Retail", "Real estate"],
  },
  {
    id: "people-audience",
    name: "People & Audience Graph",
    category: "Audiences",
    records: "1.6B",
    coverage: "Global · 2,100 segments",
    freshness: "Monthly",
    channels: ["API", "MCP", "Cloud"],
    credits: 9,
    description:
      "Modeled consumer audiences — demographics, interests, intent, and life events — ready to count, build, and activate to ad platforms or CTV.",
    columns: [
      { key: "profile_id", label: "profile_id" },
      { key: "segment", label: "segment" },
      { key: "age_band", label: "age_band" },
      { key: "income", label: "income", align: "right" },
      { key: "city", label: "city" },
      { key: "country", label: "country" },
    ],
    tags: ["Audiences", "Marketing & Advertising"],
  },
  {
    id: "demographics-income",
    name: "Demographics & Income",
    category: "Census+",
    records: "Block-group",
    coverage: "US · EU · APAC",
    freshness: "Annual",
    channels: ["API", "Cloud", "Files"],
    credits: 4,
    description:
      "Small-area demographics, household income, education, and housing — the enrichment layer for site selection and trade-area scoring.",
    columns: [
      { key: "geo_id", label: "geo_id" },
      { key: "median_hhi", label: "median_hhi", align: "right" },
      { key: "population", label: "population", align: "right" },
      { key: "median_age", label: "median_age", align: "right" },
      { key: "city", label: "city" },
    ],
    tags: ["Census+", "Real estate"],
  },
  {
    id: "consumer-spend",
    name: "Consumer Spend Signals",
    category: "Transactions",
    records: "84M",
    coverage: "US · category-level",
    freshness: "Monthly",
    channels: ["API", "Cloud"],
    credits: 11,
    description:
      "Aggregated, anonymized spend by merchant category and geography — share-of-wallet and category demand for catchment analysis.",
    columns: [
      { key: "geo_id", label: "geo_id" },
      { key: "category", label: "category" },
      { key: "spend_index", label: "spend_index", align: "right" },
      { key: "yoy", label: "yoy", align: "right" },
      { key: "city", label: "city" },
    ],
    tags: ["Transactions", "Retail"],
  },
  {
    id: "foot-traffic-trends",
    name: "Foot Traffic Trends",
    category: "Mobility",
    records: "Weekly index",
    coverage: "Global · by category & geo",
    freshness: "Weekly",
    channels: ["API", "MCP", "Cloud"],
    credits: 7,
    description:
      "Indexed visitation trends over time for brands, categories, and geographies — track recovery, seasonality, and share shifts.",
    columns: [
      { key: "brand", label: "brand" },
      { key: "category", label: "category" },
      { key: "visits", label: "visits", align: "right" },
      { key: "yoy", label: "yoy", align: "right" },
      { key: "city", label: "city" },
      { key: "period", label: "period" },
    ],
    tags: ["Mobility", "Retail", "Trends"],
  },
  {
    id: "business-firmographics",
    name: "Business Firmographics",
    category: "B2B",
    records: "64M",
    coverage: "Global · NAICS + size",
    freshness: "Monthly",
    channels: ["API", "Cloud", "Files"],
    credits: 5,
    description:
      "Company-level firmographics — industry, employee count, revenue band, and HQ geography — to size markets and target accounts.",
    columns: [
      { key: "place_id", label: "company_id" },
      { key: "name", label: "name" },
      { key: "category", label: "industry" },
      { key: "median_hhi", label: "revenue_band", align: "right" },
      { key: "city", label: "city" },
      { key: "country", label: "country" },
    ],
    tags: ["B2B", "Firmographics"],
  },
  {
    id: "brand-visitation",
    name: "Brand Visitation & Loyalty",
    category: "Mobility",
    records: "11K brands",
    coverage: "Global · chain-level",
    freshness: "Weekly",
    channels: ["API", "MCP", "Cloud"],
    credits: 10,
    description:
      "Cross-shopping and loyalty signals between brands — who visits your stores and where else they go.",
    columns: [
      { key: "brand", label: "brand" },
      { key: "category", label: "category" },
      { key: "visits", label: "visits", align: "right" },
      { key: "dwell_min", label: "dwell_min", align: "right" },
      { key: "city", label: "city" },
    ],
    tags: ["Mobility", "Loyalty", "Retail"],
  },
];

export function getDataset(id: string) {
  return DATASETS.find((d) => d.id === id);
}

/* ---- preview rows ---- */
const SEGMENTS = ["High-income parents", "Frequent travelers", "Auto intenders", "Fitness enthusiasts", "New movers", "Luxury shoppers", "Tech professionals", "Empty nesters"];
const CATS = ["Restaurant", "Retail", "Grocery", "Pharmacy", "Bank", "Gym", "Hotel", "Electronics", "Apparel", "Cafe"];
const INTERESTS = ["Travel", "Automotive", "Fitness", "Home improvement", "Electronics", "Fashion", "Dining", "Finance"];
const DEVICES = ["iOS", "Android", "Desktop", "CTV"];
const PLACES: [string, string][] = [
  ["Austin", "United States"], ["Mumbai", "India"], ["Tokyo", "Japan"], ["Berlin", "Germany"],
  ["São Paulo", "Brazil"], ["Toronto", "Canada"], ["Singapore", "Singapore"], ["London", "United Kingdom"],
  ["Chicago", "United States"], ["Sydney", "Australia"], ["Seoul", "South Korea"], ["Dubai", "UAE"],
];
const BRANDS = ["Starbucks", "McDonald's", "Target", "CVS", "Chase", "Planet Fitness", "Marriott", "Best Buy"];
const STATUS = ["Open", "Open", "Open", "Temporarily closed"];

export function generatePreview(ds: Dataset, n = 18) {
  const rng = seeded(ds.id.length * 131 + 7);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
  const rows: Record<string, string | number>[] = [];
  for (let i = 0; i < n; i++) {
    const [city, country] = pick(PLACES);
    const base: Record<string, string | number> = {
      profile_id: `prf_${(rng().toString(36) + "000000").slice(2, 8)}`,
      place_id: `plc_${(rng().toString(36) + "000000").slice(2, 8)}`,
      geo_id: `${Math.floor(10000 + rng() * 89999)}`,
      segment: pick(SEGMENTS),
      category: pick(CATS),
      interest: pick(INTERESTS),
      intent_score: (rng() * 0.85 + 0.1).toFixed(2),
      device_type: pick(DEVICES),
      name: `${pick(BRANDS)} ${pick(["Downtown", "Midtown", "Harbor", "Westside"])}`,
      brand: pick(BRANDS),
      visits: Math.floor(2000 + rng() * 48000).toLocaleString(),
      dwell_min: Math.floor(8 + rng() * 40),
      age_band: pick(["18–24", "25–34", "35–44", "45–54", "55+"]),
      income: `$${Math.floor(48 + rng() * 180)}k`,
      median_hhi: `$${Math.floor(42 + rng() * 160)}k`,
      population: Math.floor(1200 + rng() * 9000).toLocaleString(),
      median_age: Math.floor(28 + rng() * 22),
      spend_index: Math.floor(70 + rng() * 180),
      yoy: `${(rng() * 18 - 4).toFixed(1)}%`,
      status: pick(STATUS),
      period: "2026-06",
      city,
      country,
      last_seen: `2026-0${1 + Math.floor(rng() * 6)}-${(1 + Math.floor(rng() * 27)).toString().padStart(2, "0")}`,
    };
    rows.push(base);
  }
  return rows;
}

/* ---- lists ---- */
export const LISTS = [
  { id: "l1", name: "Q3 expansion shortlist", records: 142, updated: "Jun 28, 2026", source: "Site Selection" },
  { id: "l2", name: "CRM accounts — enrich", records: 5840, updated: "Jun 26, 2026", source: "Salesforce" },
  { id: "l3", name: "High-income parents · CA", records: 88300, updated: "Jun 22, 2026", source: "Audience Builder" },
  { id: "l4", name: "Competitor visitors — LA", records: 12470, updated: "Jun 19, 2026", source: "Ask" },
];

/* ---- activity ---- */
export const ACTIVITY = [
  { id: "a0", kind: "app", title: "OOH Planning — Q3 Brand Launch LA", detail: "4 panels · 1.2M net reach", when: "just now", status: "done", credits: 64 },
  { id: "a0b", kind: "app", title: "Audience Builder — gym-goers CA activated", detail: "760K people · CTV + The Trade Desk", when: "12m ago", status: "done", credits: 180 },
  { id: "a1", kind: "ask", title: "Find Starbucks across Los Angeles", detail: "16 places · Movement + Places", when: "2m ago", status: "done", credits: 18 },
  { id: "a2", kind: "export", title: "Export — High-income parents · CA", detail: "88,300 rows · CSV", when: "1h ago", status: "done", credits: 240 },
  { id: "a3", kind: "app", title: "Site Selection — Q3 expansion", detail: "12 candidate sites scored", when: "3h ago", status: "done", credits: 96 },
  { id: "a4", kind: "api", title: "POST /v2/places/search", detail: "MCP · agent-key-prod", when: "5h ago", status: "done", credits: 6 },
  { id: "a5", kind: "enrich", title: "Enrich — CRM accounts", detail: "5,840 records matched (73%)", when: "Yesterday", status: "done", credits: 412 },
  { id: "a6", kind: "export", title: "Cloud delivery — Movement Graph", detail: "Snowflake share · daily", when: "2d ago", status: "scheduled", credits: 0 },
];

/* ---- api keys ---- */
export const API_KEYS = [
  { id: "k1", name: "agent-key-prod", prefix: "fctr_live_a91…", created: "Apr 12, 2026", lastUsed: "2m ago", scope: "MCP + REST" },
  { id: "k2", name: "warehouse-sync", prefix: "fctr_live_7c2…", created: "Mar 03, 2026", lastUsed: "1h ago", scope: "Cloud delivery" },
  { id: "k3", name: "staging", prefix: "fctr_test_0f5…", created: "Feb 20, 2026", lastUsed: "5d ago", scope: "REST" },
];

export const USAGE = {
  plan: "Growth",
  creditsTotal: 15000,
  creditsUsed: 9240,
  renews: "Jul 28, 2026",
  byChannel: [
    { label: "Apps (Site Selection, Ask)", value: 4120, color: "#33D6C6" },
    { label: "REST API", value: 2890, color: "#73A9E6" },
    { label: "MCP server", value: 1430, color: "#A99BF2" },
    { label: "Cloud delivery", value: 800, color: "#E3B341" },
  ],
};
