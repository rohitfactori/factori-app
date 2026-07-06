# Factori Dataset Explorer — Sales Demo Design

**Date:** 2026-07-06
**Status:** Approved direction; spec pending Rohit's review
**Owner:** Rohit Maheswaran (rohit@lifesight.io)

## 1. Purpose

Factori's aggregated datasets are ready for sale. The sales team needs a demo app that makes the datasets tangible and proves the value of buying them via datasets, API, and/or MCP. The chosen concept is a **hex-based dataset explorer**: a map-first workspace where an AE (or later, a prospect) layers Factori datasets onto a dark MapLibre map, filters and searches, queries by chat, and clicks any hex to see cross-dataset insights for that area.

Design thesis: **the H3 hex is the product story.** It is the join key across every dataset Factori sells. One click on one hex showing movement + demographics + spend + POI mix + audiences for the same geography demonstrates why a customer buys four datasets instead of one. The hex grid is also the privacy positioning made visible — aggregates, not individuals.

This is a demo layer on the existing `factori-apps` scaffold, not a second product.

## 2. Decisions already made

- **Approach:** hybrid — curated snapshot data now, architecture ready for real data and live MCP later.
- **Coverage story:** Factori has **full US coverage**; international coverage is still partial, so the demo is **US-only**. Demo snapshot market: **Los Angeles**. The UI must communicate "demo snapshot: LA · production coverage: all US."
- **v1 data source:** synthetic but **spatially coherent** generated data, committed to the repo. The snapshot file format is the contract; real exported data replaces the files later with zero UI change.
- **v1 layers:** 6 of the 9 catalog datasets (see §6). Brand Visitation appears only inside the insight panel; Identity and Firmographics deferred.
- **Aesthetic:** dark mode, MapLibre, compact "cartographic instrument" style — consistent with the existing app.

## 3. Success criteria

- An AE can run a 2-minute scripted story from a saved view, or a 10-minute free exploration, without leaving the Explorer.
- Every visible insight traces to a purchasable SKU: each layer and panel section carries its dataset badge and a "Get this data" affordance (schema, sample, API call, MCP).
- Core demo works fully offline / on hostile conference wifi: no external network calls required (basemap is already an inline style; snapshot and search are local).
- Map feels premium: smooth pan/zoom with ~10k hex polygons; hex click opens the panel instantly (all panel data is precomputed into hex properties).
- Chat and manual controls drive the **same** state — an on-screen proof of the agent-orchestrates-apps thesis.

## 4. Placement & information architecture

- New top-level surface: `src/app/explore/page.tsx`, added to the primary nav (`src/lib/nav.ts`) as **Explore**.
- **Ask stays as-is** (agent front door). Explorer is manual-first with chat assist; it gets its own zustand store (`src/lib/store/explore.ts`) rather than extending the Ask store, because the models differ: Ask's layers are agent-output artifacts; Explorer's layers are first-class user objects.
- Catalog integration: each dataset detail page (`src/app/catalog/[id]`) gets an "Open in Explorer" button that opens Explorer with that dataset's default layer added.
- Reuse: shell (`AppShell`, `TopBar`, `Sidebar`), UI primitives, chart primitives (`src/components/ui/charts.tsx`), map patterns from `MapCanvas`, the floating-chat pattern from `AskSurface`, `DATASETS` + `generatePreview` from `src/lib/mock/platform.ts`, and the `seeded()` RNG from `src/lib/format.ts`.

## 5. Layout & interaction

Full-bleed map with a left layer rail, top control strip, floating chat dock, and a right insight panel:

```
┌────────────────────────────────────────────────────────────┐
│ ⌕ search   [Market: Los Angeles ▾] [Views ▾]     [basemap] │
├──────────┬─────────────────────────────────┬───────────────┤
│ LAYERS   │                                 │ AREA INTEL    │
│ + Add    │         hex map canvas          │ (on hex click)│
│ cards…   │      hover → tooltip            │ modules…      │
│          │  ┌──────────┐                   │               │
│          │  │ 💬 chat   │      [time ⏱]    │               │
└──────────┴──┴──────────┴───────────────────┴───────────────┘
```

- **Left rail (collapsible, ~300px):** stacked layer cards. Each card: dataset badge, metric selector, color-ramp chip, opacity slider, visibility toggle, per-layer filter chips, overflow menu (Get this data, remove). "+ Add layer" opens a searchable picker grouped by catalog category.
- **Map:** dark MapLibre (existing inline style, offline-safe). Active hex layers render as choropleth fills; POI layer renders as category-colored circles. Hover shows a compact tooltip with the top layer's metric value. Click selects the hex (accent outline) and opens the right panel.
- **Right panel (~380px, opens on hex click):** "Area Intelligence" — see §7.
- **Chat dock:** floating bottom-left pill that expands into a compact chat panel (reuse of the Ask floating-chat pattern). See §8.
- **Top strip:** local search (§9), market switcher (LA active; other markets shown disabled with a "full US coverage in production" tooltip), saved views menu (§10), basemap toggle, and a small "Demo snapshot: Los Angeles" tag.
- **Time scrubber:** appears when the Foot Traffic Trends layer is active — a 12-month scrubber (Jul 2025–Jun 2026) with play/pause. Animating a year of visitation across the city is the flagship screen-share moment.

## 6. Layer model

A layer = **dataset + metric + style + filters**. v1 lineup:

| # | Dataset (catalog id) | Layer type | Metrics (v1) | Filters |
|---|---|---|---|---|
| 1 | Global Movement Graph (`movement-graph`) | hex fill | monthly visits, median dwell | day-part (all/day/evening) |
| 2 | Foot Traffic Trends (`foot-traffic-trends`) | hex fill + time scrubber | visitation index by month | category (all/QSR/retail/grocery/fitness) |
| 3 | Places & POI Graph (`places-poi`) | points (+ density hex toggle) | POI locations; density | category, brand |
| 4 | People & Audience Graph (`people-audience`) | hex fill | segment penetration % | segment picker (6 segments) |
| 5 | Demographics & Income (`demographics-income`) | hex fill | median HHI, population, median age | — |
| 6 | Consumer Spend Signals (`consumer-spend`) | hex fill | spend index | category (food/retail/grocery/fitness/fuel) |

- Brand Visitation & Loyalty (`brand-visitation`) surfaces only as the "where else they go" module in the insight panel.
- Multiple hex layers may be active; they stack with opacity (top layer drives the hover tooltip). Each metric has a curated color ramp (sequential ramps; one diverging ramp for YoY-style values later). Compact legends live on the layer card.
- Rendering is MapLibre-native (`fill` layers + paint expressions). No deck.gl in v1; a 3D extrusion toggle is a possible later flourish.

## 7. Hex insight panel — "one hex, every dataset"

Opens on hex click. Header: neighborhood-ish label, hex id + resolution, and an area size hint. Modules (each with dataset badge + "Get this data" action), all read directly from the clicked feature's properties:

1. **Movement** — visits/month, median dwell, 12-month sparkline (from trends array), simple day-part split.
2. **People** — age-band mix bar, income-band mix bar, top audience segments with penetration.
3. **Spend** — spend index by category (bar list) vs metro average.
4. **Places** — POI count, category mix, notable brands present.
5. **Loyalty** — "visitors to this area also visit…" top co-visited brands.

Footer actions: **Ask about this area** (pre-fills the chat with a question about the selected hex) and **Export area report** (v1: opens the Get-this-data sheet scoped to the area — no real export).

## 8. Chat — same store, second driver

- The chat dock emits the **same store actions** the UI uses: add/remove layer, set metric/filter, fly to a place, select a hex, set time index. One state, two drivers.
- v1 is a **deterministic intent parser** (keyword/regex → actions), not an LLM: e.g. "show median income" → add Demographics layer with HHI metric; "footfall for QSRs in Santa Monica" → add Trends layer, category=QSR, fly to Santa Monica; "tell me about this area" → generate a text summary from the selected hex's actual properties.
- Assistant replies are generated from live snapshot values (never hardcoded numbers), so chat and map always agree.
- Unrecognized input gets a graceful reply plus suggestion chips of supported asks. A small set of suggestion chips seeds the empty state.
- Phase 2 swaps the parser for a real agent wired to the production Factori MCP; the action interface stays identical.

## 9. Search

Local search index built from the snapshot itself: neighborhoods/districts (from hex labels), landmarks/anchors, and POI names/brands. Typeahead → fly-to (and select hex for POI hits). No external geocoder — keeps the demo offline-safe, and lets AEs say "search is powered by the Places graph."

## 10. Saved views

A view = market + layer stack (with metrics/filters/opacity) + camera + time index + optional description. v1 ships 4 curated views (seed data), e.g.:

1. "Westside affluence vs footfall" (Demographics HHI + Movement visits)
2. "QSR corridor scan — Downtown" (Trends filtered to QSR + POI layer)
3. "Retail spend hotspots" (Spend retail + POI retail)
4. "12 months of recovery" (Trends + time animation preset)

Users can save their own views to `localStorage`. Views menu applies a view in one click — this is the lightweight successor of the "scenario pack" idea and what keeps demos on script.

## 11. Snapshot data architecture

**Files (committed, served from `public/snapshot/la/`):**

- `hex-r7.json`, `hex-r8.json` — GeoJSON FeatureCollections; resolution switches by zoom (r7 below zoom ~11.5, r8 above — starting threshold, tune by feel; r9 deferred unless zoom feel demands it).
- `poi.json` — GeoJSON points (~1.5–3k synthetic POIs: name, brand, category).
- `meta.ts` in `src/lib/snapshot/` — market definition: bounds, default camera, month labels, segment/category vocabularies, anchor/neighborhood labels, curated views.

**Hex feature properties (flat, MapLibre-expression friendly):**

- `h3` (cell id), `label` (nearest neighborhood name)
- Movement: `mv_visits`, `mv_dwell`, `mv_day`, `mv_eve`
- Trends: `tr` (array of 12 monthly index values; styled via `["at", i, ["get","tr"]]`), plus `tr_qsr`, `tr_retail`, `tr_grocery`, `tr_fitness` arrays
- Demographics: `dm_hhi`, `dm_pop`, `dm_age`, `dm_age_mix` (array of 5 shares), `dm_inc_mix` (array of 4 shares)
- Spend: `sp_food`, `sp_retail`, `sp_grocery`, `sp_fitness`, `sp_fuel`
- Audiences: `au_hip` (high-income parents), `au_trv`, `au_auto`, `au_fit`, `au_mov`, `au_lux` (penetration %)
- Places: `poi_count`, `poi_food`, `poi_retail`, `poi_grocery`, `poi_health`, `poi_fin`, `poi_top` (top brand names)
- Loyalty: `bl_top` (co-visited brands; panel only)

Arrays are fine for panel reads and for the `["at", …]` paint expression; everything a paint expression styles directly is a flat number.

**Generator (`scripts/generate-snapshot.mjs`, run manually; `h3-js` as devDependency):**

Synthetic data must look real or the demo reads as fake. The generator composes each metric as a weighted field:

- **Anchor kernels:** ~15 hand-placed real LA anchors (DTLA, Santa Monica, Hollywood, Beverly Hills, Century City, Culver City, Venice, Koreatown, LAX/El Segundo, Inglewood/SoFi, Pasadena, Glendale, Burbank, Sherman Oaks, Long Beach) with per-metric weights.
- **Corridors:** boosts along major arteries (Wilshire, Sunset, Ventura Blvd, I-405, I-10, I-110).
- **Masks:** ocean, Santa Monica Mountains, Angeles NF / Griffith Park → no-data or sparse hexes.
- **Priors:** plausible income geography (Westside/hills high, valley mid, south-central lower); population density inverse to income in the hills; spend correlated with POI density.
- **Seeded noise** (reuse `seeded()`) for texture; fully deterministic output.
- POIs sampled near anchors/corridors using the existing brand/category vocabularies.

Bounds: LA basin + San Fernando Valley + Long Beach (approx. lng −118.95…−117.95, lat 33.63…34.40) → ~2k hexes at r7, ~10–12k at r8 (minus masks). Estimated ≤5 MB raw per r8 file; acceptable as a fetched static asset.

**Swap-to-real path (phase 2):** replace generated files with real aggregates exported from production (via the Factori MCP `export_data`/area tools or an internal pipeline). Before committing to that, probe the MCP to price a one-market snapshot in credits. The property schema above is the contract.

## 12. Sell-through affordances

- Every layer card and panel module shows its **dataset badge** (name + freshness pill).
- **"Get this data" sheet** per dataset: description, schema columns, sample rows (`generatePreview`), an example API request/response, "Available via Factori MCP" line, delivery channels + credits from the catalog, and a link to `catalog/[id]`.
- Market switcher + snapshot tag reinforce "demo snapshot: LA · production: all US."

## 13. v1 scope fence (non-goals)

No auth, no billing wiring, no share/leave-behind links, no personalization engine, no real export, no live MCP calls, no changes to Site Selection/OOH/Audiences apps, no deck.gl, no mobile layout (desktop demo tool; don't break at laptop widths).

## 14. Phase 2 (after v1 ships)

Real LA snapshot from production data (credits permitting) → live agent chat via the Factori MCP → shareable read-only views (leave-behind links, PostHog-tracked opens) → additional US markets → 3D extrusion flourish.

## 15. Component & file plan (high level)

- `src/app/explore/page.tsx` — route
- `src/components/explore/`: `ExploreSurface` (composition), `ExploreMap`, `LayerRail`, `LayerCard`, `AddLayerPicker`, `HexTooltip`, `AreaPanel` (+ per-module subcomponents), `TimeScrubber`, `ViewsMenu`, `ExploreSearch`, `ChatDock`, `GetDataSheet`
- `src/lib/store/explore.ts` — zustand store (layers, selection, time, views, chat)
- `src/lib/explore/intents.ts` — chat intent parser → store actions
- `src/lib/snapshot/meta.ts` (+ types), `public/snapshot/la/*.json`
- `scripts/generate-snapshot.mjs` — deterministic generator (h3-js devDependency)
- Touch: `src/lib/nav.ts` (nav item), `src/app/catalog/[id]/page.tsx` ("Open in Explorer")

## 16. Risks & mitigations

- **Synthetic data reads as fake** → spatial-coherence craft in the generator (anchors/corridors/masks/priors) + honest "demo snapshot" labeling; schema designed for a drop-in real-data swap.
- **Scope creep into a second product** → §13 fence; saved views are the only "scenario" mechanism in v1.
- **Perf with ~12k polygons** → MapLibre fill layers handle this comfortably; verify early on the r8 file before building panel features.
- **Next.js 16 differences** → per `AGENTS.md`, read the relevant guides in `node_modules/next/dist/docs/` before writing code; follow existing repo conventions.
- **Chat over-promise** → suggestion chips steer to supported intents; replies always computed from live snapshot values.
