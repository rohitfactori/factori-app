# Factori Dataset Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the hex-based dataset explorer sales demo (spec: `docs/superpowers/specs/2026-07-06-dataset-explorer-demo-design.md`): dark MapLibre map + layer rail + hex insight panel + chat + saved views, running on a committed synthetic-but-coherent LA snapshot.

**Architecture:** A new `/explore` route with its own zustand store. Static H3 GeoJSON snapshots (r7/r8) generated offline by a deterministic script and served from `public/snapshot/la/`. MapLibre renders one fill layer per explorer layer; all panel/chat/tooltip numbers read from the same hex properties. Chat is a deterministic intent parser emitting the same store actions the UI uses.

**Tech Stack:** Next.js 16 (app router, client components), React 19, Tailwind v4 tokens, zustand 5, maplibre-gl 5, lucide-react. Dev-only: `h3-js`, `tsx` (generator), `vitest` (logic tests).

## Global Constraints

- **No new runtime dependencies.** `h3-js`, `tsx`, `vitest` are devDependencies only; the browser bundle uses only existing deps.
- **Offline-safe core:** no external network calls for demo function. Basemap = inline raster style (tiles enrich when online); snapshot fetched same-origin from `public/`; search is local.
- **Design system:** use existing Tailwind theme tokens (`bg-panel`, `border-line`, `text-ink-muted`, `text-2xs`, `label-eyebrow`, etc. from `src/app/globals.css`). MapLibre cannot read CSS vars — map colors come from the `MAP` palette pattern (`src/lib/mock/geo.ts:93`).
- **Next 16 conventions:** client components need `"use client"`; `useSearchParams` must sit under a `<Suspense>` boundary; dynamic route params are Promises unwrapped with `use()` (not needed for `/explore`, which is static).
- **Imports:** path alias `@/*` → `src/*` (works in Next, vitest via config, and tsx via tsconfig paths).
- **Copy rules:** the demo must say "Demo snapshot: Los Angeles" and imply full-US production coverage; never present the snapshot as full coverage.
- **Determinism:** generator uses `seeded()` from `src/lib/format.ts`; committed snapshot files are reproducible byte-for-byte.
- **Commits:** one per task, `feat:`/`test:`/`chore:` style, each ending with the Claude co-author trailer.
- **Verification:** logic tasks run `npx vitest run` (expect green); UI tasks run `npm run build` (expect success) + a manual dev-server check listed in the task.

## File Map (who owns what)

| File | Responsibility |
|---|---|
| `src/lib/snapshot/types.ts` | Hex/POI property contracts, snapshot file shapes |
| `src/lib/snapshot/la-meta.ts` | LA market meta: bounds, camera, months, anchors, corridors, vocab, curated views |
| `src/lib/snapshot/client.ts` | Fetch + cache snapshot, `byId` lookup, metro stats, `topHex` |
| `scripts/gen/fields.ts` | Pure spatial-field math (kernels, corridors, compose) |
| `scripts/gen/la-mask.ts` | LA-specific ocean/mountain exclusion |
| `scripts/gen/build.ts` | `buildSnapshot(cfg)` → FeatureCollections (pure, testable) |
| `scripts/generate-snapshot.ts` | CLI writer → `public/snapshot/la/*.json` |
| `src/lib/explore/metrics.ts` | Metric registry, per-dataset layer config, ramps, MapLibre color-expression builder |
| `src/lib/explore/search.ts` | Local search index + query |
| `src/lib/explore/intents.ts` | Chat intent parser → actions + reply text |
| `src/lib/store/explore.ts` | Explorer state + actions (the single source both UI and chat drive) |
| `src/app/explore/page.tsx` | Route (Suspense wrapper) |
| `src/components/explore/*` | `ExploreSurface`, `ExploreMap`, `LayerRail`, `LayerCard`, `AddLayerPicker`, `RampLegend`, `HexTooltip`, `AreaPanel`, `TimeScrubber`, `ViewsMenu`, `ExploreSearch`, `ChatDock`, `GetDataSheet` |
| Modify: `src/lib/nav.ts` | Add Explore nav item (Hexagon icon) |
| Modify: `src/app/catalog/[id]/page.tsx` | "Open in Explorer" action |
| Modify: `package.json` | devDeps + `snapshot`/`test` scripts |

## Shared contracts (referenced by every task)

### Hex property schema (`HexProps`)

```ts
// src/lib/snapshot/types.ts
export type PoiCategory = "food" | "retail" | "grocery" | "health" | "fin";

export type HexProps = {
  h3: string;            // H3 cell id
  label: string;         // nearest neighborhood/anchor label
  // Movement (Global Movement Graph)
  mv_visits: number;     // est. visits / month
  mv_dwell: number;      // median dwell, minutes
  mv_day: number;        // daytime share of visits, 0..1
  mv_eve: number;        // evening share of visits, 0..1
  // Foot Traffic Trends — 12 monthly index values (Jul 25 → Jun 26, base 100)
  tr: number[];
  tr_qsr: number[];
  tr_retail: number[];
  tr_grocery: number[];
  tr_fitness: number[];
  // Demographics & Income
  dm_hhi: number;        // median household income, USD
  dm_pop: number;        // population
  dm_age: number;        // median age
  dm_age_mix: number[];  // shares [18–24, 25–34, 35–44, 45–54, 55+], sum ≈ 1
  dm_inc_mix: number[];  // shares [<$50k, $50–100k, $100–150k, $150k+], sum ≈ 1
  // Consumer Spend Signals — index, base 100
  sp_food: number; sp_retail: number; sp_grocery: number; sp_fitness: number; sp_fuel: number;
  // People & Audience Graph — segment penetration, % 0..40
  au_hip: number; au_trv: number; au_auto: number; au_fit: number; au_mov: number; au_lux: number;
  // Places & POI Graph (per-hex aggregates)
  poi_count: number;
  poi_food: number; poi_retail: number; poi_grocery: number; poi_health: number; poi_fin: number;
  poi_top: string[];     // ≤5 notable brand names
  // Brand Visitation & Loyalty (panel only)
  bl_top: string[];      // ≤5 co-visited brands
};

export type PoiProps = {
  id: string; name: string; brand: string; category: PoiCategory;
  h3: string;            // containing r8 cell (lets search select the hex)
};

export type HexFC = GeoJSON.FeatureCollection<GeoJSON.Polygon, HexProps>;
export type PoiFC = GeoJSON.FeatureCollection<GeoJSON.Point, PoiProps>;
```

### Explorer layer + store API (implemented Task 4, consumed by all UI)

```ts
// src/lib/store/explore.ts (shapes)
export type ExploreLayer = {
  id: string;              // instance id "xl1", "xl2", …
  datasetId: string;       // catalog id, e.g. "movement-graph"
  metricId: string;        // key into METRICS
  variant?: string;        // per-dataset: movement daypart "all"|"day"|"eve"; trends category "all"|"qsr"|"retail"|"grocery"|"fitness"; places mode "points"|"density"
  poiCat?: PoiCategory | "all"; // places only
  opacity: number;         // 0..1, default 0.7
  visible: boolean;
};
export type SavedView = {
  id: string; name: string; description?: string;
  layers: Omit<ExploreLayer, "id">[];
  camera: { center: [number, number]; zoom: number };
  timeIndex?: number; playing?: boolean;
};
// Store actions (exact names):
// addLayer(datasetId, metricId?) — one layer per dataset; re-add focuses/updates existing
// removeLayer(id) · updateLayer(id, patch) · toggleVisible(id)
// selectHex(h3 | null) · setTimeIndex(i) · setPlaying(b) · setBasemap(b)
// goTo(center, zoom) — bumps flyNonce · applyView(view) · saveViewAs(name)
// openDataSheet(datasetId) · closeDataSheet()
// setChatOpen(b) · submitChat(text) · reset()
```

### Metric registry (Task 4; ids are load-bearing everywhere)

Metric ids = hex property names (plus `poi_count`): `mv_visits`, `mv_dwell`, `tr` (temporal), `dm_hhi`, `dm_pop`, `dm_age`, `sp_food`, `sp_retail`, `sp_grocery`, `sp_fitness`, `sp_fuel`, `au_hip`, `au_trv`, `au_auto`, `au_fit`, `au_mov`, `au_lux`, `poi_count`. Fixed styling domains (generator guarantees ranges): visits 0–60 000, dwell 6–45, index 60–160, hhi 35 000–220 000, pop 0–9 000, age 26–52, penetration 0–40, poi_count 0–120.

---

### Task 1: Tooling, snapshot contract, LA meta

**Files:**
- Modify: `package.json` (devDeps + scripts)
- Create: `vitest.config.ts`
- Create: `src/lib/snapshot/types.ts` (exact code above, with the GeoJSON types)
- Create: `src/lib/snapshot/la-meta.ts`
- Test: `src/lib/snapshot/la-meta.test.ts`

**Interfaces:**
- Produces: `LA` meta object (bounds/camera/months/anchors/corridors/segments/spendCats/poiCats/views), types `HexProps`, `PoiProps`, `Anchor`, `Corridor`.

- [ ] **Step 1: Install dev tooling**

Run: `npm i -D h3-js tsx vitest`
Add scripts to `package.json`: `"test": "vitest run"`, `"snapshot": "tsx scripts/generate-snapshot.ts"`.

- [ ] **Step 2: vitest config with @ alias**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["src/**/*.test.ts", "scripts/**/*.test.ts"] },
});
```

- [ ] **Step 3: Write `src/lib/snapshot/types.ts`** — exactly the shared contract above, **plus** the `ExploreLayer` and `SavedView` types from the store section of Shared Contracts (they live here so `la-meta.ts` and the store can both import them without cycles).

- [ ] **Step 4: Write failing meta test**

```ts
// src/lib/snapshot/la-meta.test.ts
import { describe, expect, it } from "vitest";
import { LA } from "./la-meta";

describe("LA meta", () => {
  it("has 12 month labels ending Jun 26", () => {
    expect(LA.months).toHaveLength(12);
    expect(LA.months[11]).toBe("Jun 26");
  });
  it("anchors sit inside bounds", () => {
    const [w, s, e, n] = LA.bounds;
    for (const a of LA.anchors) {
      expect(a.lng).toBeGreaterThan(w); expect(a.lng).toBeLessThan(e);
      expect(a.lat).toBeGreaterThan(s); expect(a.lat).toBeLessThan(n);
    }
  });
  it("defines 6 audience segments and 5 spend categories", () => {
    expect(LA.segments).toHaveLength(6);
    expect(LA.spendCats).toHaveLength(5);
  });
  it("curated views reference plausible cameras", () => {
    expect(LA.views.length).toBeGreaterThanOrEqual(4);
    for (const v of LA.views) expect(v.layers.length).toBeGreaterThan(0);
  });
});
```

Run: `npx vitest run` → FAIL (`la-meta` not found).

- [ ] **Step 5: Implement `src/lib/snapshot/la-meta.ts`**

Anchors (lng/lat + weights) — the hand-curated spatial skeleton. Complete list:

```ts
import type { SavedView } from "@/lib/store/explore";
import type { PoiCategory } from "./types";

export type Anchor = {
  id: string; label: string; lng: number; lat: number;
  /** kernel radius km and per-field weights 0..1 */
  r: number;
  activity: number;  // drives visits/footfall/poi density
  income: number;    // drives HHI / luxury
  nightlife: number; // drives evening share
};
export type Corridor = { id: string; pts: [number, number][]; wKm: number; activity: number };

export const LA = {
  id: "la",
  label: "Los Angeles",
  bounds: [-118.95, 33.63, -117.95, 34.40] as [number, number, number, number], // [w,s,e,n]
  camera: { center: [-118.33, 34.02] as [number, number], zoom: 9.7 },
  months: ["Jul 25","Aug 25","Sep 25","Oct 25","Nov 25","Dec 25","Jan 26","Feb 26","Mar 26","Apr 26","May 26","Jun 26"],
  segments: [
    { id: "au_hip", label: "High-income parents" },
    { id: "au_trv", label: "Frequent travelers" },
    { id: "au_auto", label: "Auto intenders" },
    { id: "au_fit", label: "Fitness enthusiasts" },
    { id: "au_mov", label: "New movers" },
    { id: "au_lux", label: "Luxury shoppers" },
  ],
  spendCats: [
    { id: "sp_food", label: "Food & dining" },
    { id: "sp_retail", label: "Retail" },
    { id: "sp_grocery", label: "Grocery" },
    { id: "sp_fitness", label: "Fitness" },
    { id: "sp_fuel", label: "Fuel & auto" },
  ],
  poiCats: [
    { id: "food", label: "Food & dining" },
    { id: "retail", label: "Retail" },
    { id: "grocery", label: "Grocery" },
    { id: "health", label: "Health" },
    { id: "fin", label: "Financial" },
  ] as { id: PoiCategory; label: string }[],
  anchors: [
    { id: "dtla", label: "Downtown LA", lng: -118.249, lat: 34.048, r: 5.5, activity: 1.0, income: 0.45, nightlife: 0.9 },
    { id: "ktown", label: "Koreatown", lng: -118.300, lat: 34.061, r: 3.2, activity: 0.85, income: 0.4, nightlife: 1.0 },
    { id: "hlwd", label: "Hollywood", lng: -118.328, lat: 34.101, r: 4.0, activity: 0.9, income: 0.5, nightlife: 1.0 },
    { id: "weho", label: "West Hollywood", lng: -118.361, lat: 34.090, r: 2.8, activity: 0.8, income: 0.7, nightlife: 0.95 },
    { id: "bh", label: "Beverly Hills", lng: -118.400, lat: 34.073, r: 3.4, activity: 0.7, income: 1.0, nightlife: 0.5 },
    { id: "cc", label: "Century City", lng: -118.417, lat: 34.058, r: 2.4, activity: 0.75, income: 0.9, nightlife: 0.35 },
    { id: "sm", label: "Santa Monica", lng: -118.492, lat: 34.017, r: 3.8, activity: 0.9, income: 0.85, nightlife: 0.75 },
    { id: "venice", label: "Venice", lng: -118.472, lat: 33.990, r: 2.6, activity: 0.75, income: 0.7, nightlife: 0.8 },
    { id: "culver", label: "Culver City", lng: -118.396, lat: 34.021, r: 3.0, activity: 0.8, income: 0.7, nightlife: 0.6 },
    { id: "lax", label: "LAX / El Segundo", lng: -118.402, lat: 33.936, r: 4.2, activity: 0.85, income: 0.55, nightlife: 0.3 },
    { id: "sofi", label: "Inglewood / SoFi", lng: -118.339, lat: 33.953, r: 3.4, activity: 0.75, income: 0.4, nightlife: 0.6 },
    { id: "pas", label: "Pasadena", lng: -118.144, lat: 34.147, r: 4.0, activity: 0.8, income: 0.75, nightlife: 0.55 },
    { id: "glen", label: "Glendale", lng: -118.255, lat: 34.146, r: 3.6, activity: 0.75, income: 0.65, nightlife: 0.5 },
    { id: "burb", label: "Burbank", lng: -118.309, lat: 34.181, r: 3.4, activity: 0.7, income: 0.6, nightlife: 0.45 },
    { id: "shox", label: "Sherman Oaks", lng: -118.451, lat: 34.151, r: 3.4, activity: 0.65, income: 0.7, nightlife: 0.5 },
    { id: "noho", label: "North Hollywood", lng: -118.377, lat: 34.172, r: 3.0, activity: 0.65, income: 0.5, nightlife: 0.65 },
    { id: "vny", label: "Van Nuys", lng: -118.449, lat: 34.187, r: 3.6, activity: 0.6, income: 0.42, nightlife: 0.4 },
    { id: "torr", label: "Torrance", lng: -118.340, lat: 33.836, r: 4.0, activity: 0.65, income: 0.62, nightlife: 0.35 },
    { id: "lb", label: "Long Beach", lng: -118.193, lat: 33.770, r: 4.6, activity: 0.8, income: 0.5, nightlife: 0.7 },
    { id: "elmonte", label: "El Monte", lng: -118.028, lat: 34.069, r: 3.4, activity: 0.55, income: 0.35, nightlife: 0.3 },
    { id: "whit", label: "Whittier", lng: -118.033, lat: 33.979, r: 3.2, activity: 0.55, income: 0.5, nightlife: 0.35 },
    { id: "comp", label: "Compton", lng: -118.220, lat: 33.896, r: 3.2, activity: 0.55, income: 0.3, nightlife: 0.35 },
  ] as Anchor[],
  corridors: [
    { id: "wilshire", pts: [[-118.492, 34.021], [-118.400, 34.062], [-118.300, 34.062], [-118.249, 34.050]], wKm: 1.4, activity: 0.7 },
    { id: "sunset", pts: [[-118.470, 34.078], [-118.361, 34.094], [-118.328, 34.098], [-118.266, 34.077]], wKm: 1.2, activity: 0.6 },
    { id: "ventura", pts: [[-118.605, 34.168], [-118.451, 34.152], [-118.377, 34.156]], wKm: 1.2, activity: 0.55 },
    { id: "i405", pts: [[-118.469, 34.285], [-118.449, 34.180], [-118.430, 34.050], [-118.396, 33.930], [-118.350, 33.820]], wKm: 1.6, activity: 0.45 },
    { id: "i10", pts: [[-118.490, 34.020], [-118.350, 34.030], [-118.249, 34.040], [-118.030, 34.065]], wKm: 1.6, activity: 0.5 },
    { id: "i110", pts: [[-118.270, 34.050], [-118.280, 33.940], [-118.220, 33.800], [-118.200, 33.770]], wKm: 1.5, activity: 0.45 },
  ] as Corridor[],
  views: [
    {
      id: "v-affluence", name: "Westside affluence vs footfall",
      description: "Median income choropleth with visits — see money and movement disagree.",
      layers: [
        { datasetId: "demographics-income", metricId: "dm_hhi", opacity: 0.68, visible: true },
        { datasetId: "movement-graph", metricId: "mv_visits", variant: "all", opacity: 0.5, visible: true },
      ],
      camera: { center: [-118.44, 34.04], zoom: 11.2 },
    },
    {
      id: "v-qsr", name: "QSR corridor scan — Downtown",
      description: "12-month QSR visitation with POIs overlaid.",
      layers: [
        { datasetId: "foot-traffic-trends", metricId: "tr", variant: "qsr", opacity: 0.7, visible: true },
        { datasetId: "places-poi", metricId: "poi_count", variant: "points", poiCat: "food", opacity: 0.9, visible: true },
      ],
      camera: { center: [-118.26, 34.05], zoom: 12.1 },
      timeIndex: 11,
    },
    {
      id: "v-spend", name: "Retail spend hotspots",
      description: "Where retail spend over-indexes vs metro.",
      layers: [
        { datasetId: "consumer-spend", metricId: "sp_retail", opacity: 0.72, visible: true },
        { datasetId: "places-poi", metricId: "poi_count", variant: "points", poiCat: "retail", opacity: 0.85, visible: true },
      ],
      camera: { center: [-118.35, 34.06], zoom: 10.6 },
    },
    {
      id: "v-recovery", name: "12 months of movement",
      description: "Press play — a year of visitation index across the metro.",
      layers: [{ datasetId: "foot-traffic-trends", metricId: "tr", variant: "all", opacity: 0.75, visible: true }],
      camera: { center: [-118.33, 34.02], zoom: 9.7 },
      timeIndex: 0, playing: true,
    },
  ] as SavedView[],
};
export type MarketMeta = typeof LA;
```

Note: `la-meta.ts` imports `SavedView` from the store (Task 4). To keep Task 1 self-contained, declare `SavedView` in `src/lib/snapshot/types.ts` instead and re-export from the store later — **do that**: `SavedView` and `ExploreLayer` live in `src/lib/snapshot/types.ts`; the store imports them. Adjust imports accordingly (`import type { SavedView } from "./types"`).

- [ ] **Step 6: Run tests** — `npx vitest run` → PASS (5 tests).

- [ ] **Step 7: Commit** — `chore: add explorer tooling + LA snapshot contract`

---

### Task 2: Field math (TDD)

**Files:**
- Create: `scripts/gen/fields.ts`
- Create: `scripts/gen/la-mask.ts`
- Test: `scripts/gen/fields.test.ts`

**Interfaces:**
- Produces: `distKm(a,b)`, `distToPolylineKm(p, pts)`, `kernel(dKm, rKm)` (gaussian falloff, 1 at center), `anchorField(p, anchors, pick)` (max-blend of kernels × weight), `corridorField(p, corridors)`, `noise2d(lng, lat, seed)` (deterministic, 0..1, smooth), `clamp(v,lo,hi)`, `round(v, dp)`. From `la-mask.ts`: `isExcluded(lng, lat)` (true = ocean/mountains, no hex).
- All take plain numbers/arrays — no h3 dependency here.

- [ ] **Step 1: Write failing tests**

```ts
// scripts/gen/fields.test.ts
import { describe, expect, it } from "vitest";
import { distKm, distToPolylineKm, kernel, anchorField, noise2d, clamp } from "./fields";
import { isExcluded } from "./la-mask";

describe("fields", () => {
  it("distKm: SM pier → DTLA ≈ 23km", () => {
    const d = distKm([-118.497, 34.008], [-118.249, 34.048]);
    expect(d).toBeGreaterThan(20); expect(d).toBeLessThan(26);
  });
  it("kernel decays monotonically and is 1 at center", () => {
    expect(kernel(0, 4)).toBeCloseTo(1, 5);
    expect(kernel(2, 4)).toBeGreaterThan(kernel(4, 4));
    expect(kernel(12, 4)).toBeLessThan(0.02);
  });
  it("distToPolylineKm: point on segment ≈ 0", () => {
    const d = distToPolylineKm([-118.3, 34.05], [[-118.4, 34.05], [-118.2, 34.05]]);
    expect(d).toBeLessThan(0.15);
  });
  it("anchorField peaks at the anchor", () => {
    const anchors = [{ lng: -118.25, lat: 34.05, r: 4, activity: 1 } as never];
    const atAnchor = anchorField([-118.25, 34.05], anchors, (a: { activity: number }) => a.activity);
    const far = anchorField([-118.6, 34.3], anchors, (a: { activity: number }) => a.activity);
    expect(atAnchor).toBeGreaterThan(0.95); expect(far).toBeLessThan(0.05);
  });
  it("noise2d is deterministic, bounded, and spatially smooth", () => {
    const a = noise2d(-118.3, 34.0, 7);
    expect(a).toBe(noise2d(-118.3, 34.0, 7));
    expect(a).toBeGreaterThanOrEqual(0); expect(a).toBeLessThanOrEqual(1);
    const b = noise2d(-118.3005, 34.0005, 7); // ~50m away
    expect(Math.abs(a - b)).toBeLessThan(0.25);
  });
  it("clamp", () => { expect(clamp(5, 0, 1)).toBe(1); expect(clamp(-1, 0, 1)).toBe(0); });
});

describe("la-mask", () => {
  it("excludes open ocean off Santa Monica", () => expect(isExcluded(-118.60, 33.95)).toBe(true));
  it("keeps DTLA / Long Beach / Sherman Oaks", () => {
    expect(isExcluded(-118.249, 34.048)).toBe(false);
    expect(isExcluded(-118.193, 33.770)).toBe(false);
    expect(isExcluded(-118.451, 34.151)).toBe(false);
  });
  it("excludes Angeles NF high north-east", () => expect(isExcluded(-118.10, 34.32)).toBe(true));
  it("excludes Santa Monica Mountains spine", () => expect(isExcluded(-118.60, 34.10)).toBe(true));
});
```

- [ ] **Step 2: Run to verify fail** — `npx vitest run scripts/gen/fields.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement `fields.ts`**

```ts
// scripts/gen/fields.ts — pure spatial-field math for the snapshot generator
export type Pt = [number, number]; // [lng, lat]

const KM_LAT = 110.574;
const kmLng = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180);

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const round = (v: number, dp = 0) => { const m = 10 ** dp; return Math.round(v * m) / m; };

export function distKm(a: Pt, b: Pt) {
  const dx = (a[0] - b[0]) * kmLng((a[1] + b[1]) / 2);
  const dy = (a[1] - b[1]) * KM_LAT;
  return Math.hypot(dx, dy);
}

/** gaussian-ish falloff: 1 at d=0, ~0.37 at d=r, →0 beyond */
export const kernel = (dKm: number, rKm: number) => Math.exp(-((dKm / rKm) ** 2));

export function distToSegmentKm(p: Pt, a: Pt, b: Pt) {
  const kx = kmLng(p[1]);
  const ax = a[0] * kx, ay = a[1] * KM_LAT, bx = b[0] * kx, by = b[1] * KM_LAT;
  const px = p[0] * kx, py = p[1] * KM_LAT;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1e-9;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function distToPolylineKm(p: Pt, pts: Pt[]) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distToSegmentKm(p, pts[i], pts[i + 1]));
  return d;
}

/** max-blend of anchor kernels weighted by pick(anchor) */
export function anchorField<A extends { lng: number; lat: number; r: number }>(
  p: Pt, anchors: A[], pick: (a: A) => number
) {
  let v = 0;
  for (const a of anchors) v = Math.max(v, pick(a) * kernel(distKm(p, [a.lng, a.lat]), a.r));
  return v;
}

export function corridorField<C extends { pts: Pt[]; wKm: number; activity: number }>(p: Pt, corridors: C[]) {
  let v = 0;
  for (const c of corridors) v = Math.max(v, c.activity * kernel(distToPolylineKm(p, c.pts), c.wKm));
  return v;
}

/** deterministic value noise on a ~1.1km lattice, bilinear-smoothed, 0..1 */
function latticeHash(ix: number, iy: number, seed: number) {
  let h = (ix * 374761393 + iy * 668265263 + seed * 2147483647) | 0;
  h = (h ^ (h >> 13)) | 0; h = Math.imul(h, 1274126177); h = (h ^ (h >> 16)) >>> 0;
  return h / 4294967295;
}
export function noise2d(lng: number, lat: number, seed: number) {
  const gx = lng * 90, gy = lat * 90; // ≈1.1km cells
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0;
  const s = (t: number) => t * t * (3 - 2 * t);
  const v00 = latticeHash(x0, y0, seed), v10 = latticeHash(x0 + 1, y0, seed);
  const v01 = latticeHash(x0, y0 + 1, seed), v11 = latticeHash(x0 + 1, y0 + 1, seed);
  return (v00 * (1 - s(fx)) + v10 * s(fx)) * (1 - s(fy)) + (v01 * (1 - s(fx)) + v11 * s(fx)) * s(fy);
}
```

- [ ] **Step 4: Implement `la-mask.ts`**

```ts
// scripts/gen/la-mask.ts — coarse LA land/urban mask (hand-tuned; demo-grade)
import { distToPolylineKm, type Pt } from "./fields";

/** approximate coastline SM Bay → Palos Verdes → Long Beach; ocean = seaward side */
const COAST: Pt[] = [
  [-118.95, 34.05], [-118.80, 34.03], [-118.68, 34.035], [-118.56, 34.04],
  [-118.50, 34.008], [-118.46, 33.98], [-118.44, 33.93], [-118.43, 33.87],
  [-118.39, 33.80], [-118.30, 33.72], [-118.18, 33.72], [-118.10, 33.74],
];
/** returns latitude of the coast at given lng (piecewise linear); ocean is south/west of it */
function coastLatAt(lng: number) {
  if (lng <= COAST[0][0]) return COAST[0][1];
  for (let i = 0; i < COAST.length - 1; i++) {
    const [x1, y1] = COAST[i], [x2, y2] = COAST[i + 1];
    if (lng >= x1 && lng <= x2) return y1 + ((lng - x1) / (x2 - x1 || 1e-9)) * (y2 - y1);
  }
  return COAST[COAST.length - 1][1];
}

/** Santa Monica Mtns spine + Angeles NF as exclusion polylines with width */
const MOUNTAINS: { pts: Pt[]; wKm: number }[] = [
  { pts: [[-118.95, 34.09], [-118.75, 34.10], [-118.60, 34.10], [-118.50, 34.105], [-118.44, 34.115]], wKm: 5.5 }, // SM Mtns
  { pts: [[-118.40, 34.33], [-118.20, 34.30], [-118.05, 34.28], [-117.95, 34.26]], wKm: 9 },                        // Angeles NF
];

export function isExcluded(lng: number, lat: number) {
  // ocean: below/west of the coastline (with a small 1.5km grace onshore kept)
  if (lat < coastLatAt(lng) - 0.012) return true;
  for (const m of MOUNTAINS) if (distToPolylineKm([lng, lat], m.pts) < m.wKm) return true;
  return false;
}
```

- [ ] **Step 5: Run tests** — `npx vitest run` → PASS. If a mask assertion fails, tune `COAST`/`MOUNTAINS` constants (not the tests) until the named landmarks pass.

- [ ] **Step 6: Commit** — `feat: spatial field math + LA mask for snapshot generator`

---

### Task 3: Snapshot generator + committed LA data

**Files:**
- Create: `scripts/gen/build.ts`
- Create: `scripts/generate-snapshot.ts`
- Test: `scripts/gen/build.test.ts`
- Generated (committed): `public/snapshot/la/hex-r7.json`, `public/snapshot/la/hex-r8.json`, `public/snapshot/la/poi.json`

**Interfaces:**
- Consumes: `fields.ts`, `la-mask.ts`, `LA` meta, `seeded()` from `@/lib/format`, `h3-js` (`polygonToCells`, `cellToBoundary`, `cellToLatLng`, `latLngToCell`).
- Produces: `buildSnapshot(meta, opts?) → { r7: HexFC; r8: HexFC; poi: PoiFC }` where `opts.bounds` overrides meta bounds (for tests).

**Metric recipes (implement exactly; `act` = max(anchorField(activity), corridorField), `inc` = anchorField(income), `ngt` = anchorField(nightlife), `nz(s)` = noise2d with seed s):**

- `base = clamp(0.15 + 0.85*act + 0.25*(nz(11)-0.5), 0, 1)`
- `mv_visits = round(60000 * base^1.6)`; `mv_dwell = round(clamp(8 + 30*(0.4*inc + 0.3*act + 0.6*(nz(12)-0.2)), 6, 45))`
- `mv_eve = round(clamp(0.18 + 0.45*ngt + 0.12*(nz(13)-0.5), 0.1, 0.7), 3)`; `mv_day = round(1 - mv_eve, 3)`
- `tr`: 12 values — `tr[m] = round(100 * (0.86 + 0.22*m/11) * seasonal(m) * (0.9 + 0.2*nz(14+m)))` with `seasonal(m) = 1 + 0.06*sin((m/12)*2π + 0.8)`; category arrays same recipe with seeds 20+m (qsr), 32+m (retail), 44+m (grocery), 56+m (fitness) and slightly different growth slopes (qsr 0.30, retail 0.14, grocery 0.08, fitness 0.36). Clamp all to [60, 160].
- `dm_hhi = round(clamp(38000 + 175000*(0.72*inc + 0.28*nz(15)) , 35000, 220000), -2)` (round to $100)
- `dm_pop = round(8600 * clamp(0.2 + 0.8*act, 0, 1) * (1 - 0.45*inc) * (0.75 + 0.5*nz(16)))` — hills/affluent less dense
- `dm_age = round(clamp(30 + 16*inc + 6*(nz(17)-0.5) - 4*ngt, 26, 52))`
- `dm_age_mix`: start `[0.12, 0.24, 0.22, 0.19, 0.23]`, shift young↔old by `(dm_age-38)/40` (subtract from first two, add to last two proportionally), normalize to sum 1, round 3dp.
- `dm_inc_mix`: start `[0.30, 0.34, 0.20, 0.16]`, shift by `(dm_hhi-110000)/300000` from low to high buckets, normalize, round 3dp.
- `sp_*`: `round(clamp(100 * (0.55 + 0.5*catAff + 0.25*(nz(60+i)-0.5)), 60, 160))` where `catAff` = food: 0.5*act+0.5*ngt · retail: 0.45*act+0.55*inc · grocery: 0.5*(1-inc)+0.5*act · fitness: 0.55*inc+0.45*act · fuel: 0.65*(1-act)+0.35*nz(66)
- `au_*` penetration %: hip `40*clamp(0.55*inc + 0.25*(1-ngt) + 0.3*nz(70),0,1)` · trv `40*clamp(0.5*inc + 0.3*act + 0.2*nz(71),0,1)` · auto `40*clamp(0.45*(1-inc) + 0.35*act + 0.3*nz(72),0,1)` · fit `40*clamp(0.4*inc + 0.35*ngt + 0.25*nz(73),0,1)` · mov `40*clamp(0.35*act + 0.3*(1-inc) + 0.35*nz(74),0,1)` · lux `40*clamp(0.8*inc + 0.2*nz(75),0,1)` — all round 1dp.
- POIs: for each anchor, `count = round(140 * activity)` points, placed with gaussian jitter σ = r/2.2 (rejection-sample against `isExcluded`); category by weighted pick (food .34, retail .27, grocery .14, health .13, fin .12); name/brand from vocab below. Then bin by `latLngToCell(..., 8)` → per-hex `poi_count`, `poi_<cat>` counts, `poi_top` = up to 5 distinct brands by frequency in that hex.
- `bl_top`: pick 3–5 brands from vocab weighted toward the hex's dominant poi categories, seeded by cell id hash.
- `label`: nearest anchor’s label if ≤ 7 km else `"Greater Los Angeles"`.
- r7 hexes: same recipes evaluated at the r7 cell center (not aggregation of r8 — simpler, consistent enough for zoomed-out view); `poi_*` for r7 = sum of its r8 children via `cellToChildren`.

Brand vocab (module const in `build.ts`): food `["Starbucks","McDonald's","Chipotle","In-N-Out","Sweetgreen","Panda Express","Subway","Taco Bell"]`, retail `["Target","Best Buy","Nordstrom","TJ Maxx","Apple","Sephora","REI"]`, grocery `["Trader Joe's","Whole Foods","Ralphs","Vons","Erewhon","Costco"]`, health `["CVS","Walgreens","Planet Fitness","Equinox","Kaiser"]`, fin `["Chase","Bank of America","Wells Fargo","Citi"]`.

- [ ] **Step 1: Write failing smoke test**

```ts
// scripts/gen/build.test.ts
import { describe, expect, it } from "vitest";
import { buildSnapshot } from "./build";
import { LA } from "@/lib/snapshot/la-meta";

describe("buildSnapshot (small bbox around DTLA)", () => {
  const out = buildSnapshot(LA, { bounds: [-118.30, 34.00, -118.20, 34.09] });
  it("produces r7, r8 and poi collections", () => {
    expect(out.r8.features.length).toBeGreaterThan(30);
    expect(out.r7.features.length).toBeGreaterThan(1);
    expect(out.poi.features.length).toBeGreaterThan(50);
  });
  it("hex props are complete and in range", () => {
    for (const f of out.r8.features.slice(0, 20)) {
      const p = f.properties;
      expect(p.h3).toMatch(/^88/); // res 8 ids start with 88
      expect(p.tr).toHaveLength(12);
      expect(p.mv_visits).toBeGreaterThanOrEqual(0);
      expect(p.mv_visits).toBeLessThanOrEqual(60000);
      expect(p.dm_hhi).toBeGreaterThanOrEqual(35000);
      expect(p.dm_age_mix.reduce((s: number, x: number) => s + x, 0)).toBeCloseTo(1, 1);
      expect(p.poi_top.length).toBeLessThanOrEqual(5);
    }
  });
  it("is deterministic", () => {
    const again = buildSnapshot(LA, { bounds: [-118.30, 34.00, -118.20, 34.09] });
    expect(JSON.stringify(again.r8.features[0])).toBe(JSON.stringify(out.r8.features[0]));
  });
});
```

Run: `npx vitest run scripts/gen/build.test.ts` → FAIL.

- [ ] **Step 2: Implement `build.ts`** — `buildSnapshot(meta, opts)`: `polygonToCells` over bounds rectangle at res 8 and 7; filter with `isExcluded` at cell center; evaluate recipes above per cell (all noise seeded — no `Math.random`); POI pass first (needs binning before hex props); assemble GeoJSON with `cellToBoundary(cell, true)` rings (close the ring by repeating the first vertex; round coords to 5dp).

- [ ] **Step 3: Run tests** — `npx vitest run` → PASS (tune only if a range assertion trips).

- [ ] **Step 4: Writer script `scripts/generate-snapshot.ts`**

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildSnapshot } from "./gen/build";
import { LA } from "../src/lib/snapshot/la-meta";

const out = buildSnapshot(LA);
const dir = join(process.cwd(), "public", "snapshot", "la");
mkdirSync(dir, { recursive: true });
const write = (name: string, fc: unknown) => {
  const s = JSON.stringify(fc);
  writeFileSync(join(dir, name), s);
  console.log(`${name}  ${(s.length / 1e6).toFixed(2)} MB`);
};
write("hex-r7.json", out.r7);
write("hex-r8.json", out.r8);
write("poi.json", out.poi);
console.log(`r7=${out.r7.features.length} r8=${out.r8.features.length} poi=${out.poi.features.length}`);
```

- [ ] **Step 5: Generate** — Run: `npm run snapshot`. Expected: r7 ≈ 1–3k, r8 ≈ 8–14k features, each file well under 25 MB (if r8 exceeds that, drop `tr_*` category arrays from r7 file only — r7 is overview-scale). Spot-check one feature with a JSON peek.

- [ ] **Step 6: Commit** — `feat: deterministic LA snapshot generator + committed demo data` (include the three JSON files).

---

### Task 4: Metric registry + explorer store (TDD)

**Files:**
- Create: `src/lib/explore/metrics.ts`
- Create: `src/lib/store/explore.ts`
- Test: `src/lib/explore/metrics.test.ts`, `src/lib/store/explore.test.ts`
- (Types `ExploreLayer`/`SavedView` already exist in `src/lib/snapshot/types.ts` from Task 1 — import, don't redeclare.)

**Interfaces:**
- Consumes: `DATASETS` from `@/lib/mock/platform` (dataset names/badges), `MAP` from `@/lib/mock/geo`, formatters from `@/lib/format`.
- Produces (metrics): `METRICS: MetricDef[]`, `METRIC_BY_ID: Record<string, MetricDef>`, `LAYER_CONFIGS: Record<string, LayerConfig>`, `EXPLORABLE: string[]` (ordered dataset ids), `valueExpr(layer, timeIndex): unknown`, `colorExpr(layer, timeIndex): unknown`, `domainFor(layer): [number, number]`, `rampFor(layer): string[]`, `isTemporal(layer): boolean`, `formatMetric(layer, v): string`.
- Produces (store): `useExplore` zustand hook with the exact action names from Shared Contracts, plus state fields `layers`, `selectedHex`, `timeIndex` (default 11), `playing`, `basemap`, `chatOpen`, `chatMessages`, `chatThinking`, `dataSheetFor`, `flyTo: {center, zoom} | null`, `flyNonce: number`.

**Ramp constants (metrics.ts):**

```ts
export const RAMPS = {
  teal:   ["#163f3a", "#1c574f", "#247a6c", "#2da08d", "#39ccb8"],
  amber:  ["#3d3117", "#5a481d", "#7d6323", "#a8842c", "#d6a838"],
  violet: ["#2b2745", "#3d3763", "#554d8a", "#6f65b3", "#8d82dd"],
  blue:   ["#1c2e42", "#28425e", "#375c82", "#4a7aa9", "#5f9bd4"],
  rose:   ["#40252c", "#5e333e", "#824453", "#a85669", "#d06c82"],
  green:  ["#1e3a2a", "#2a533c", "#387052", "#48906a", "#59b184"],
} as const;
```

Dataset→ramp: movement teal · trends amber · demographics violet · spend rose · audiences blue · POI density green. POI circle category colors: food `MAP.teal`, retail `MAP.violet`, grocery `MAP.green`, health `MAP.amber`, fin `MAP.blue`.

**Metric definitions (all 18, exact):** `mv_visits` "Visits / month" domain [0, 60000] fmtCompact · `mv_dwell` "Median dwell" [6, 45] `${v}m` · `tr` "Visitation index" [60, 160] temporal, `${Math.round(v)}` · `dm_hhi` "Median HH income" [35000, 220000] fmtUSDCompact · `dm_pop` "Population" [0, 9000] fmtCompact · `dm_age` "Median age" [26, 52] `${Math.round(v)}` · `sp_food|sp_retail|sp_grocery|sp_fitness|sp_fuel` "Spend index — <cat>" [60, 160] index fmt · `au_hip|au_trv|au_auto|au_fit|au_mov|au_lux` "<segment>" [0, 40] `${v.toFixed(0)}%` · `poi_count` "POI density" [0, 120] int (per-category density domain [0, 60] via `domainFor` when `poiCat !== "all"`).

**LAYER_CONFIGS (exact):**

```ts
export type LayerConfig = {
  kind: "hex" | "poi";
  metricIds: string[];
  metricLabel: string; // UI label for the metric select
  variants?: { id: string; label: string }[];
  variantLabel?: string;
  defaultMetric: string;
  defaultVariant?: string;
};
export const LAYER_CONFIGS: Record<string, LayerConfig> = {
  "movement-graph": { kind: "hex", metricIds: ["mv_visits", "mv_dwell"], metricLabel: "Metric", variants: [{ id: "all", label: "All day" }, { id: "day", label: "Daytime" }, { id: "eve", label: "Evening" }], variantLabel: "Day-part", defaultMetric: "mv_visits", defaultVariant: "all" },
  "foot-traffic-trends": { kind: "hex", metricIds: ["tr"], metricLabel: "Metric", variants: [{ id: "all", label: "All categories" }, { id: "qsr", label: "QSR" }, { id: "retail", label: "Retail" }, { id: "grocery", label: "Grocery" }, { id: "fitness", label: "Fitness" }], variantLabel: "Category", defaultMetric: "tr", defaultVariant: "all" },
  "places-poi": { kind: "poi", metricIds: ["poi_count"], metricLabel: "Metric", variants: [{ id: "points", label: "Points" }, { id: "density", label: "Density" }], variantLabel: "Render", defaultMetric: "poi_count", defaultVariant: "points" },
  "people-audience": { kind: "hex", metricIds: ["au_hip", "au_trv", "au_auto", "au_fit", "au_mov", "au_lux"], metricLabel: "Segment", defaultMetric: "au_hip" },
  "demographics-income": { kind: "hex", metricIds: ["dm_hhi", "dm_pop", "dm_age"], metricLabel: "Metric", defaultMetric: "dm_hhi" },
  "consumer-spend": { kind: "hex", metricIds: ["sp_food", "sp_retail", "sp_grocery", "sp_fitness", "sp_fuel"], metricLabel: "Category", defaultMetric: "sp_retail" },
};
export const EXPLORABLE = ["movement-graph", "foot-traffic-trends", "places-poi", "people-audience", "demographics-income", "consumer-spend"];
```

**Expression builders (exact behavior):**

```ts
export function valueExpr(layer: ExploreLayer, timeIndex: number): unknown {
  const m = METRIC_BY_ID[layer.metricId];
  if (m.temporal) {
    const prop = layer.variant && layer.variant !== "all" ? `tr_${layer.variant}` : "tr";
    return ["at", timeIndex, ["get", prop]];
  }
  if (layer.datasetId === "movement-graph" && (layer.variant === "day" || layer.variant === "eve"))
    return ["*", ["get", "mv_visits"], ["get", layer.variant === "day" ? "mv_day" : "mv_eve"]];
  if (layer.metricId === "poi_count" && layer.poiCat && layer.poiCat !== "all")
    return ["get", `poi_${layer.poiCat}`];
  return ["get", m.id];
}
export function domainFor(layer: ExploreLayer): [number, number] {
  const m = METRIC_BY_ID[layer.metricId];
  if (layer.datasetId === "movement-graph" && layer.variant === "day") return [0, m.domain[1] * 0.65];
  if (layer.datasetId === "movement-graph" && layer.variant === "eve") return [0, m.domain[1] * 0.45];
  if (layer.metricId === "poi_count" && layer.poiCat && layer.poiCat !== "all") return [0, 60];
  return m.domain;
}
export function colorExpr(layer: ExploreLayer, timeIndex: number): unknown {
  const [lo, hi] = domainFor(layer);
  const ramp = rampFor(layer);
  const stops: unknown[] = [];
  for (let i = 0; i < 5; i++) stops.push(lo + ((hi - lo) * i) / 4, ramp[i]);
  return ["interpolate", ["linear"], valueExpr(layer, timeIndex), ...stops];
}
```

- [ ] **Step 1: Write failing metrics tests** — unique metric ids; every `LAYER_CONFIGS` key exists in `DATASETS`; every `defaultMetric` ∈ `metricIds`; `valueExpr` for trends variant qsr + timeIndex 5 → `["at", 5, ["get", "tr_qsr"]]`; movement eve → `["*", …]`; `colorExpr` has 12 elements (op, lerp, value, 5 stop pairs → 3 + 10 = 13 — assert length 13 and last element = brightest ramp color).

- [ ] **Step 2:** `npx vitest run src/lib/explore/metrics.test.ts` → FAIL. Implement `metrics.ts` per above. → PASS.

- [ ] **Step 3: Write failing store tests**

```ts
// src/lib/store/explore.test.ts (core cases)
import { beforeEach, describe, expect, it } from "vitest";
import { useExplore } from "./explore";

beforeEach(() => useExplore.getState().reset());

describe("explore store", () => {
  it("addLayer applies dataset defaults and dedupes by dataset", () => {
    useExplore.getState().addLayer("movement-graph");
    useExplore.getState().addLayer("movement-graph", "mv_dwell");
    const layers = useExplore.getState().layers;
    expect(layers).toHaveLength(1);
    expect(layers[0].metricId).toBe("mv_dwell");
    expect(layers[0].visible).toBe(true);
    expect(layers[0].opacity).toBeCloseTo(0.7);
  });
  it("applyView replaces layers, camera and time", () => {
    useExplore.getState().addLayer("consumer-spend");
    useExplore.getState().applyView({
      id: "v", name: "V",
      layers: [{ datasetId: "demographics-income", metricId: "dm_hhi", opacity: 0.6, visible: true }],
      camera: { center: [-118.4, 34.0], zoom: 11 }, timeIndex: 3,
    });
    const s = useExplore.getState();
    expect(s.layers).toHaveLength(1);
    expect(s.layers[0].datasetId).toBe("demographics-income");
    expect(s.timeIndex).toBe(3);
    expect(s.flyTo?.zoom).toBe(11);
  });
  it("selectHex toggles panel state; goTo bumps nonce", () => {
    const n0 = useExplore.getState().flyNonce;
    useExplore.getState().goTo([-118.3, 34.05], 12);
    expect(useExplore.getState().flyNonce).toBe(n0 + 1);
    useExplore.getState().selectHex("88abc");
    expect(useExplore.getState().selectedHex).toBe("88abc");
  });
});
```

- [ ] **Step 4:** Implement `src/lib/store/explore.ts` (zustand `create`, module `let _n = 0` id counter reset in `reset()`; `submitChat` in this task = push user message, set `chatThinking`, then after 500ms push assistant placeholder "The demo agent arrives in a later task." — replaced wholesale in Task 11). `saveViewAs(name)` snapshots current layers/camera(from `flyTo` fallback meta camera)/timeIndex into a `SavedView` persisted to `localStorage["factori-explore-views"]` (guard `typeof window`), and returns it. → `npx vitest run` PASS.

- [ ] **Step 5: Commit** — `feat: explorer metric registry + store`

---

### Task 5: Snapshot client + local search (TDD)

**Files:**
- Create: `src/lib/snapshot/client.ts`
- Create: `src/lib/explore/search.ts`
- Test: `src/lib/snapshot/client.test.ts`, `src/lib/explore/search.test.ts`

**Interfaces:**
- Produces (client): `loadSnapshot(fetcher?: typeof fetch): Promise<Snapshot>` (memoized), `getSnapshotSync(): Snapshot | null`, `type Snapshot = { r7: HexFC; r8: HexFC; poi: PoiFC; byId: Map<string, HexProps>; avg: Record<string, number>; topHex(prop: string): { h3: string; label: string; value: number } | null }`. `byId` covers r8 **and** r7. `avg` over r8 for every numeric scalar prop (skip arrays/strings).
- Produces (search): `type SearchHit = { id: string; label: string; sub: string; kind: "area" | "poi" | "brand"; center: [number, number]; zoom: number; h3?: string }`, `buildSearchIndex(snap: Snapshot): SearchHit[]` (anchors from `LA.anchors` zoom 12 + brands (distinct, center = densest hex's centroid isn't tracked — use first POI coords, zoom 12.5) + POIs (name, zoom 14, carries `h3`)), `searchPlaces(q: string, index: SearchHit[], limit = 8): SearchHit[]` (case-insensitive; score: label startsWith = 2, includes = 1, sub includes = 0.5; stable sort desc), `getSearchIndex(): SearchHit[]` (lazy from `getSnapshotSync`, `[]` if not loaded).

- [ ] **Step 1: Failing tests** — client: inject a stub fetcher serving 2-hex fixture FCs; assert `byId.size`, `avg.mv_visits` = mean, `topHex("dm_hhi")` picks the richer hex, memoization (second call, fetcher not re-invoked — count calls). search: fixture index; "santa" → Santa Monica anchor first; "trader" → brand hit; "zzz" → [].
- [ ] **Step 2:** Run → FAIL. Implement both modules. Run → PASS.
- [ ] **Step 3: Commit** — `feat: snapshot client + local search index`

---

### Task 6: Route, surface shell, hex map

**Files:**
- Modify: `src/lib/nav.ts` (Explore item)
- Create: `src/app/explore/page.tsx`
- Create: `src/components/explore/ExploreSurface.tsx`
- Create: `src/components/explore/ExploreMap.tsx`
- Create: `src/components/explore/HexTooltip.tsx`

**Interfaces:**
- Consumes: store actions, `colorExpr/valueExpr/domainFor/formatMetric/LAYER_CONFIGS`, `loadSnapshot`, `LA` meta, MapCanvas patterns (inline STYLE, dynamic import, `h-full w-full` container).
- Produces: working `/explore` with choropleth rendering, r7/r8 zoom switch at **11.3**, hover tooltip, click-select, selection outline, flyTo. Map layer id scheme (later tasks rely on it): fills `xl-{layer.id}-7` / `xl-{layer.id}-8`, POI circles `poi-circles`, selection `hex-sel-7` / `hex-sel-8`.

- [ ] **Step 1: Nav** — add to `workNav` after Ask: `{ label: "Explore", href: "/explore", icon: Hexagon, match: (p) => p.startsWith("/explore") }` (import `Hexagon` from lucide).

- [ ] **Step 2: Route**

```tsx
// src/app/explore/page.tsx
import { Suspense } from "react";
import { ExploreSurface } from "@/components/explore/ExploreSurface";

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExploreSurface />
    </Suspense>
  );
}
```

- [ ] **Step 3: Surface shell** — `"use client"`. Structure (placeholders for later tasks):

```tsx
export function ExploreSurface() {
  const params = useSearchParams();
  useEffect(() => {
    const st = useExplore.getState();
    if (st.layers.length) return;
    const ds = params.get("dataset");
    st.addLayer(ds && LAYER_CONFIGS[ds] ? ds : "movement-graph");
  }, [params]);
  return (
    <div className="relative h-full">
      <ExploreMap />
      {/* top strip (search/views/market/basemap) — Tasks 10/12 */}
      {/* <LayerRail /> — Task 7 · <AreaPanel /> — Task 8 · <TimeScrubber /> — Task 9 · <ChatDock /> — Task 11 · <GetDataSheet /> — Task 12 */}
    </div>
  );
}
```

- [ ] **Step 4: ExploreMap** — follow `MapCanvas` conventions exactly (dynamic import, inline STYLE with the same three raster basemaps, `attributionControl: false`, `dragRotate: false`, ResizeObserver, cleanup). On `load`: `loadSnapshot()` then add sources `hex-r7`, `hex-r8` (geojson) and `poi-src`; add constant layers `hex-sel-7`/`hex-sel-8` (line, filter `["==", ["get", "h3"], "__none__"]`, `line-color: "#EAF6F4"`, width 2, each with max/minzoom 11.3) and `poi-circles` (circle, visibility none, category `match` colors, radius by zoom `["interpolate", ["linear"], ["zoom"], 10, 2, 14, 5]`, dark stroke). Then a **sync effect** on `[layers, timeIndex, basemap, selectedHex, flyNonce]` (split into separate effects as in MapCanvas):
  - **Layer sync:** desired = visible layers that render as hex (config.kind === "hex" or places variant "density"). For removals: `map.getLayer` starting with `xl-` not in desired → remove. For each desired (in array order): add if missing (two fill layers, `-7` maxzoom 11.3 on `hex-r7`, `-8` minzoom 11.3 on `hex-r8`, inserted before `hex-sel-7`), then `setPaintProperty` `fill-color` = `colorExpr(layer, timeIndex)` and `fill-opacity` = layer.opacity. Enforce order with `map.moveLayer(id, "hex-sel-7")` in sequence. POI circles: visible iff a `places-poi` layer is visible with variant "points"; apply filter `poiCat === "all" ? null : ["==", ["get", "category"], poiCat]`.
  - **Interaction:** map-level `mousemove` → rAF-throttled `queryRenderedFeatures(point, { layers: topHexLayerIds })` → set local tooltip state `{ x, y, h3, label, value: formatMetric(topLayer, rawValue), metricLabel }` — compute rawValue from the feature props in JS (mirror `valueExpr` logic with a small `readValue(layer, props, timeIndex)` helper exported from `metrics.ts` — add it there with a unit test in this task: temporal reads `props[prop][timeIndex]`, daypart multiplies, poiCat picks the right prop). Cursor pointer over hexes. `click` → hit ? `selectHex(props.h3)` : `selectHex(null)`.
  - **Selection effect:** setFilter on `hex-sel-7/8` to `["==", ["get", "h3"], selectedHex ?? "__none__"]`.
  - **FlyTo effect:** on `flyNonce`, `map.flyTo({ center, zoom, duration: 800 })`.
  - Initial camera: `LA.camera`. Loading state: small "Loading snapshot…" chip until snapshot resolves.
- [ ] **Step 5: HexTooltip** — pointer-events-none absolute div at `{x+12, y+12}`: label (text-xs ink), metric label (label-eyebrow), value (text-sm font-semibold tabular-nums).
- [ ] **Step 6: Verify** — `npm run dev` → open `/explore`: teal visits choropleth over LA with ocean/mountain gaps; hover tooltip live; click outlines a hex; zoom in past 11.3 → finer hexes; `/explore?dataset=demographics-income` seeds violet HHI layer. `npm run build` → success.
- [ ] **Step 7: Commit** — `feat: /explore route with hex map, tooltip and selection`

---

### Task 7: Layer rail

**Files:**
- Create: `src/components/explore/LayerRail.tsx`, `LayerCard.tsx`, `AddLayerPicker.tsx`, `RampLegend.tsx`
- Modify: `src/components/explore/ExploreSurface.tsx` (mount rail)

**Interfaces:**
- Consumes: `useExplore` (`layers`, `addLayer`, `removeLayer`, `updateLayer`, `toggleVisible`, `openDataSheet`), `LAYER_CONFIGS`, `EXPLORABLE`, `METRIC_BY_ID`, `rampFor`, `domainFor`, `formatMetric`, `DATASETS` (names, freshness), `Tooltip`, `IconButton`, lucide icons (`Plus`, `Eye`, `EyeOff`, `X`, `Database`, `ChevronDown`).
- Produces: left rail overlay `absolute left-3 top-3 bottom-3 z-10 w-[300px]` (collapsible to a slim button column via a chevron; store nothing — local `useState`). Conscious v1 trim vs spec: POI **brand** filter is served by search (Task 10), not a card control.

- [ ] **Step 1: RampLegend** — gradient bar (`linear-gradient(to right, …ramp)`) with `domainFor` min/max labels formatted via `formatMetric`, height 6px rounded, labels `text-2xs text-ink-faint tabular-nums`.
- [ ] **Step 2: LayerCard** — `Panel`-style card (`rounded-lg border border-line bg-panel/90 backdrop-blur p-2.5 space-y-2`): header row = color dot (brightest ramp color) + dataset name (`text-xs font-medium text-ink`) + freshness `Badge` + eye toggle + remove `IconButton`. Metric select (native `<select>` styled like catalog's `SelectFilter`, options from config.metricIds labeled via `METRIC_BY_ID[..].label`, label = `config.metricLabel`). Variant select when `config.variants` (label `config.variantLabel`). Places extra: poiCat select from `LA.poiCats` + "All". Opacity: native `<input type="range" min={0.2} max={1} step={0.05}>` with `accent-[--color-accent]` class, only for hex-rendered layers. `RampLegend` at bottom (hex-rendered only). Footer link-button "Get this data" → `openDataSheet(datasetId)`.
- [ ] **Step 3: AddLayerPicker** — popover under an "Add layer" `Button variant="primary" size="sm"` (`Plus` icon). Popover: `absolute` panel `w-72 shadow-pop` listing `EXPLORABLE` datasets (name, category eyebrow, records badge) minus already-added; click → `addLayer(id)` + close. Local open state; close on outside click (`useEffect` mousedown listener) and Escape.
- [ ] **Step 4: LayerRail** — column: header row ("Layers" eyebrow + add button), stacked `LayerCard`s (scroll-y), empty state when no layers: mini panel with hint text + three quick-add chips (Movement visits · Median income · POIs) calling `addLayer`.
- [ ] **Step 5: Verify** — dev server: add all six datasets; toggle visibility; switch audience segment → map recolors; opacity slider live; remove layers; picker excludes added datasets; empty state renders after removing all. `npm run build` OK.
- [ ] **Step 6: Commit** — `feat: explorer layer rail with metric/variant controls`

---

### Task 8: Area intelligence panel

**Files:**
- Create: `src/components/explore/AreaPanel.tsx`
- Modify: `src/components/explore/ExploreSurface.tsx` (mount panel)

**Interfaces:**
- Consumes: `useExplore` (`selectedHex`, `selectHex`, `openDataSheet`, `setChatOpen`, `submitChat`), `getSnapshotSync().byId` + `.avg`, `LA` (months, segments, spendCats), charts (`Bars`, `AreaChart`, `Donut`, `Delta`), `Badge`, `DATASETS` names.
- Produces: right panel `absolute right-3 top-3 bottom-3 z-10 w-[380px]` sliding in when `selectedHex` set; null when not.

- [ ] **Step 1: Panel skeleton** — `flex flex-col overflow-hidden rounded-xl border border-line bg-panel/95 shadow-pop backdrop-blur-md`. Header: eyebrow "Area intelligence", `label` (text-sm font-semibold), sub `{h3} · res 8 · ~0.7 km²` (mono text-2xs ink-faint), close `IconButton` → `selectHex(null)`. Body scroll-y with sections; each section: eyebrow title row + dataset `Badge tone="neutral"` + tiny "Get data" ghost button → `openDataSheet`.
- [ ] **Step 2: Sections (all values from `byId.get(selectedHex)`; `avg` for comparisons):**
  - **Movement** — big stat row: visits/mo (`fmtCompact`) + `Delta` vs `avg.mv_visits` (`(v/avg-1)*100`), dwell `${mv_dwell}m`; `AreaChart` of `tr` (labels = `LA.months`, height 72); day/evening split as two-segment bar (mv_day/mv_eve).
  - **People** — pop + median age + HHI stat row; `Bars` for `dm_age_mix` (labels 18–24…55+, values ×100 rounded, unit "%"); `Bars` for `dm_inc_mix` (labels <$50k, $50–100k, $100–150k, $150k+); top-3 audience segments by `au_*` as `Badge tone="accent"` chips `{label} {v}%`.
  - **Spend** — `Bars` of the 5 `sp_*` values (labels from `LA.spendCats`, unit "" — index), note line "index vs metro = 100".
  - **Places** — `poi_count` stat + `Donut` of `poi_<cat>` (colors = POI category colors, centerLabel = poi_count); `poi_top` as neutral badges.
  - **Loyalty** — "Visitors here also visit" + `bl_top` badges. Dataset badge: Brand Visitation & Loyalty.
- [ ] **Step 3: Footer** — two buttons: `Button variant="secondary"` "Ask about this area" → `setChatOpen(true); submitChat("Tell me about this area")` · `Button variant="primary"` "Get this data" → `openDataSheet("movement-graph")`.
- [ ] **Step 4: Verify** — click hexes around the metro: values change coherently (Beverly Hills high HHI, DTLA high visits); sparkline renders; close button and clicking empty ocean clears. Build OK.
- [ ] **Step 5: Commit** — `feat: one-hex-every-dataset area intelligence panel`

---

### Task 9: Time scrubber

**Files:**
- Create: `src/components/explore/TimeScrubber.tsx`
- Modify: `src/components/explore/ExploreSurface.tsx` (mount, bottom-center)

**Interfaces:**
- Consumes: `useExplore` (`layers`, `timeIndex`, `setTimeIndex`, `playing`, `setPlaying`), `isTemporal` from metrics, `LA.months`.
- Produces: pill visible only when a **visible temporal layer** exists: `absolute bottom-3 left-1/2 -translate-x-1/2 z-10`.

- [ ] **Step 1: Implement** — row in a `rounded-full border border-line bg-panel/90 px-3 py-1.5 backdrop-blur`: play/pause `IconButton` (lucide `Play`/`Pause`), `<input type="range" min={0} max={11}>` w-56, current month label `text-xs tabular-nums text-ink w-14`. Play loop: `useEffect` on `playing` → `setInterval(600ms)` advancing `setTimeIndex((i + 1) % 12)`; clear on pause/unmount. Manual scrub pauses.
- [ ] **Step 2: Verify** — add Foot Traffic Trends; scrubber appears; press play → choropleth animates through the year smoothly; hide layer → scrubber gone. Build OK.
- [ ] **Step 3: Commit** — `feat: temporal scrubber for foot-traffic trends`

---

### Task 10: Search + saved views (top strip)

**Files:**
- Create: `src/components/explore/ExploreSearch.tsx`, `ViewsMenu.tsx`
- Modify: `src/components/explore/ExploreSurface.tsx` (top strip: search left · views/basemap right)

**Interfaces:**
- Consumes: `getSearchIndex`, `searchPlaces`, `useExplore` (`goTo`, `selectHex`, `applyView`, `saveViewAs`, `basemap`, `setBasemap`), `LA.views`, `Segmented`, `Input`, `Kbd`.
- Produces: top strip `absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2 pointer-events-none` (children `pointer-events-auto`). Search box honors `/` hotkey focus.

- [ ] **Step 1: ExploreSearch** — 260px input (Search icon, placeholder "Search places, brands, areas…"). On ≥2 chars: dropdown panel of hits (icon by kind: MapPin area / Store poi / Tag brand; label + sub). Keyboard: ↑/↓ moves active, Enter selects, Esc closes. Select: `goTo(hit.center, hit.zoom)`; if `hit.h3` also `selectHex(hit.h3)`. Global `/` keydown (when no input focused) focuses it.
- [ ] **Step 2: ViewsMenu** — `Button variant="secondary"` "Views" + ChevronDown → dropdown: curated `LA.views` (name + description text-2xs) then "Your views" from `localStorage["factori-explore-views"]` (parse defensively), then "Save current view…" row → inline name input + save via `saveViewAs(name)`. Click view → `applyView(v)` + close.
- [ ] **Step 3: Basemap toggle** — reuse `Segmented` with dark/light/satellite icons (Moon/Sun/Globe) driving `setBasemap` (map effect from Task 6 already applies it — copy `applyBasemap` pattern from MapCanvas if it wasn't wired; wire now).
- [ ] **Step 4: Verify** — search "santa" → flies to Santa Monica; a POI hit opens its hex panel; "12 months of movement" view auto-plays the scrubber; save a custom view, reload page, it persists. Build OK.
- [ ] **Step 5: Commit** — `feat: explorer local search + saved views`

---

### Task 11: Chat — intents (TDD) + dock

**Files:**
- Create: `src/lib/explore/intents.ts`
- Test: `src/lib/explore/intents.test.ts`
- Create: `src/components/explore/ChatDock.tsx`
- Modify: `src/lib/store/explore.ts` (real `submitChat`)
- Modify: `src/components/explore/ExploreSurface.tsx` (mount dock bottom-left)

**Interfaces:**
- Produces (intents):

```ts
export type IntentAction =
  | { type: "addLayer"; datasetId: string; metricId?: string; variant?: string; poiCat?: string }
  | { type: "removeLayer"; datasetId: string }
  | { type: "clearLayers" }
  | { type: "goTo"; center: [number, number]; zoom: number; h3?: string }
  | { type: "setTime"; index: number }
  | { type: "play" };
export type IntentCtx = {
  hits: (q: string) => SearchHit[];                       // search resolve
  topHex: (prop: string) => { label: string; value: number } | null;
  selected: HexProps | null;
  months: string[];
};
export type IntentResult = { reply: string; actions: IntentAction[] };
export function parseIntent(text: string, ctx: IntentCtx): IntentResult;
```

- Rule table (first match wins; all matching case-insensitive):
  1. `tell me about|describe|what.?s (this|here)` + `ctx.selected` → describe: reply composes label, visits, HHI, top segment, top spend cat, poi_top from the selected hex (real values, `fmtCompact`/fmtUSDCompact). No actions. Without selection → reply "Click a hex first, or ask me to map something."
  2. dataset/metric mentions → `addLayer` (+ reply "Mapped <metric> — <topHex.label> leads at <fmt value>."): `income|hhi|affluen` → demographics dm_hhi · `population|density of people` → dm_pop · `age` → dm_age · `visit|foot ?traffic|footfall|movement|busiest` → movement mv_visits (+` evening|night` → variant eve, `day` → day) · `trend|over (the )?last|12 month|year` → trends tr (+category words qsr/coffee→qsr, retail→retail, grocery→grocery, fitness|gym→fitness) · `spend|spending` (+category words → sp_*, default sp_retail) · `parents` → au_hip, `travel` → au_trv, `auto|car` → au_auto, `fitness|gym` (with `audience|people|who`) → au_fit, `mover` → au_mov, `luxury` → au_lux · `poi|places|stores|restaurants|shops` → places-poi points (+cat word → poiCat).
  3. place mention (after intent words stripped, try `ctx.hits(tail)` where tail = text after " in | near | around ") → append `goTo` action; mention place in reply.
  4. `play|animate` → `{play}` + ensure trends layer (`addLayer` trends if absent — parser can't see layers; emit addLayer unconditionally, store dedupes). Reply invites watching the year.
  5. `clear|start over|remove everything` → clearLayers.
  6. fallback → reply listing 3 example asks; no actions.
- Produces (store): `submitChat(text)` = push user msg → `chatThinking: true` → 550 ms `setTimeout` → build ctx from `getSearchIndex()`/`getSnapshotSync()`/`byId.get(selectedHex)` → `parseIntent` → apply actions via existing store actions (goTo h3 also `selectHex`) → push assistant reply, `chatThinking: false`.
- Produces (dock): collapsed pill bottom-left `absolute bottom-3 left-3 z-10` ("Ask the data…" + Sparkles icon) → expands to `w-[330px] h-[430px]` panel (header "Demo agent" + eyebrow "scripted · offline", messages list styled like ChatPane bubbles, thinking dots, input + send). Empty state: 4 suggestion chips: "Where do high-income parents live?" · "Show QSR foot traffic trends" · "Median income around Santa Monica" · "Tell me about this area".

- [ ] **Step 1: Failing intent tests** — cover: income query → addLayer demographics/dm_hhi + reply contains top label; "show qsr trends and play" → trends variant qsr + play; "coffee shops in santa monica" → places-poi + poiCat food + goTo with center near [-118.49, 34.01]; describe with selected hex includes its label and formatted visits; describe without selection asks to click; gibberish → fallback reply, no actions.
- [ ] **Step 2:** Run → FAIL. Implement `parseIntent`. Run → PASS.
- [ ] **Step 3:** Wire real `submitChat`; build `ChatDock`; mount.
- [ ] **Step 4: Verify** — dev: chat "map median income" recolors map + sensible reply; "tell me about this area" after clicking a hex narrates real values; suggestion chips fire; replies always match visible map. Build OK.
- [ ] **Step 5: Commit** — `feat: scripted demo agent driving the explorer store`

---

### Task 12: Sell-through — Get-data sheet, market chip, catalog hook

**Files:**
- Create: `src/components/explore/GetDataSheet.tsx`
- Modify: `src/components/explore/ExploreSurface.tsx` (mount sheet + market/demo chip in top strip)
- Modify: `src/app/catalog/[id]/page.tsx` ("Open in Explorer" action)

**Interfaces:**
- Consumes: `useExplore` (`dataSheetFor`, `closeDataSheet`), `getDataset` + `generatePreview` from `@/lib/mock/platform`, REST/MCP call formatters (reimplement the two 5-line helpers locally: `GET https://api.factori.ai/v2/{id}?h3=8829a1…&limit=100` and `factori.query("{id}", { h3: "8829a1…", limit: 100 })`), `Badge`, `Button`, `Segmented`.
- Produces: right-side sheet overlay (`fixed inset-y-0 right-0 z-50 w-[440px] border-l border-line bg-panel shadow-pop` + backdrop `bg-black/40`) with: dataset name + description; badge row (records · coverage · freshness · `{credits} cr` · channels); schema table (columns → key/type via the catalog `inferType` approach, compact); 5 sample rows (`generatePreview(ds, 5)`, horizontal scroll); REST/MCP segmented code block with copy button; footer: `Link` "Open in Catalog" (`/catalog/{id}`) + primary "Get production access" (no-op). Esc + backdrop close.

- [ ] **Step 1:** Build `GetDataSheet` (render null unless `dataSheetFor`; look up dataset, guard missing).
- [ ] **Step 2: Market/demo chip** — in top strip right cluster: `Badge tone="accent"`-style chip "Los Angeles · demo snapshot" with `Tooltip` "Demo runs on an LA snapshot. Production covers all of the US — every metro, updated continuously." plus a disabled "More markets" mini-button with same tooltip.
- [ ] **Step 3: Catalog hook** — in dataset page header actions, when `LAYER_CONFIGS[ds.id]` exists: `<Link href={`/explore?dataset=${ds.id}`}><Button variant="secondary"><Hexagon className="size-3.5" />Open in Explorer</Button></Link>` (import `LAYER_CONFIGS` — it's client-safe const; page is already a client component).
- [ ] **Step 4: Verify** — "Get this data" from a layer card and from panel sections opens the sheet with that dataset; sample rows render; copy works; catalog → Open in Explorer lands with the layer seeded. Build OK.
- [ ] **Step 5: Commit** — `feat: get-this-data sheet + demo-snapshot framing + catalog handoff`

---

### Task 13: Polish + full verification

**Files:** touch-ups across `src/components/explore/*` only.

- [ ] **Step 1: Keyboard & affordances** — Esc: closes sheet → else panel → else search dropdown (one per press, sheet handled in Task 12 — verify no double-close). Map cursor: pointer over hexes/POIs. Rail/panel/scrubber/dock never overlap unusably at 1280×800 (laptop): panel and rail both open + scrubber → scrubber shifts with `left-1/2` still clear; verify visually and nudge z/inset values if needed.
- [ ] **Step 2: Empty/loading states** — snapshot loading chip (Task 6) styled; chat thinking dots; search "no matches" row.
- [ ] **Step 3: Perf sanity** — with 3 hex layers + POIs at r8 zoom, pan/zoom stays smooth (subjective 60fps-ish; if choppy, set `fill-antialias: false` on r8 fills and re-check).
- [ ] **Step 4: Full pass** — `npx vitest run` all green; `npm run lint` clean; `npm run build` success; walk the four curated views end-to-end as a demo dry-run (each view: apply → story beat visible → hex click → panel coherent → get-data sheet).
- [ ] **Step 5: Commit** — `polish: explorer demo pass (keyboard, states, perf)`

---

## Post-plan notes

- **Deviation log:** POI brand filter is via search, not a layer-card control (v1 trim, noted in Task 7). r7 files may drop `tr_*` category arrays if size demands (Task 3 Step 5).
- **Phase 2 pointers (not in this plan):** real snapshot swap (same file contract), live MCP chat behind the same `IntentAction` interface, share links, more markets.
