# Factori — app UI scaffold

A redesigned, **AI‑native** web app for Factori: the real‑world data & context layer for AI‑powered enterprises. This scaffold expresses the product strategy we aligned on — a **data platform** (catalog · API · MCP · cloud delivery) with a layer of **GeoAI apps** bundled on top — in one unified, dark, compact shell.

> Status: clickable front‑end scaffold with mock data. No backend. The map uses MapLibre GL + free CARTO dark basemap tiles (degrades gracefully offline).

## Run

```bash
npm install
npm run dev        # http://localhost:3000 (or next free port)
```

## The product, in one line

Ask anything about places, people, and movement — then act on it inside purpose‑built apps. Data‑savvy buyers drop to raw cuts, API, or MCP at any time.

## Information architecture

Two‑zone left rail + omnipresent ⌘K agent:

- **Ask** (`/`) — agent front door. Three states: **Console → Split → Immersive**. Conversation steers a persistent dark MapLibre canvas; results render as map / ranked table / scorecards with a **layers · controls · data‑provenance** inspector. Provenance links every answer back to the Catalog (the cross‑sell hook).
- **Apps** (`/apps`) — the GeoAI suite:
  - **Site Selection** (`/apps/site-selection`) — built deep: candidate scoring, trade areas, cannibalization, score breakdown.
  - **OOH Planning**, **Audience Builder** — preview shells.
- **Catalog** (`/catalog`, `/catalog/[id]`) — dataset marketplace + Preview/Export, with "use via API / MCP / cloud delivery".
- **Lists & Enrich** (`/lists`) · **Activity** (`/activity`)
- **Developers** (`/developers`) — REST + MCP endpoints, keys · **Billing** (`/billing`) — one wallet (credits + app subscriptions) · **Settings** (`/settings`)

Key decisions (from the brainstorm): business‑user‑first · agent‑orchestrates‑apps · Location Intelligence is the platform layer (folded into Ask), not a 4th app · apps are integrated modules in one shell (subdomains are a deploy detail, not a UX boundary).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · MapLibre GL · zustand · lucide‑react · Geist.

## Structure

```
src/
  app/                     routes (ask = /, apps, catalog, lists, …)
  components/
    shell/                 Sidebar · TopBar · CommandMenu · AppShell · Page
    ask/                   AskSurface · ChatPane · MapCanvas · CanvasOverlay
    site-selection/        SiteSelectionApp · SiteMap
    ui/                    button · badge · panel · field (compact primitives)
  lib/
    mock/                  agent (scripted) · geo · platform · sites
    store/                 ask · ui (zustand)
    nav.ts · format.ts · cn.ts
```

## Design system

"Cartographic instrument" — cool tinted near‑black (never pure black), one restrained teal accent, hairline borders, compact 13px base, tabular numerals. Tokens live in `src/app/globals.css` (`@theme`). Dark‑only by request.

## What's mocked

The "agent" (`src/lib/mock/agent.ts`) pattern‑matches a query → a realistic result (map features, layers, controls, provenance). All datasets, sites, lists, activity, keys, and usage are seeded mock data. Swap these modules for real APIs/MCP to go live.
