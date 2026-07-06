/** Local search over the snapshot itself — no external geocoder, which keeps
 *  the demo offline-safe and lets AEs say "search is powered by the Places graph". */
import { getSnapshotSync, type Snapshot } from "@/lib/snapshot/client";
import { LA } from "@/lib/snapshot/la-meta";

export type SearchHit = {
  id: string;
  label: string;
  sub: string;
  kind: "area" | "poi" | "brand";
  center: [number, number];
  zoom: number;
  h3?: string;
};

export function buildSearchIndex(snap: Snapshot): SearchHit[] {
  const hits: SearchHit[] = [];

  for (const a of LA.anchors) {
    hits.push({ id: `a-${a.id}`, label: a.label, sub: "Neighborhood", kind: "area", center: [a.lng, a.lat], zoom: 12 });
  }

  const brandFirst = new Map<string, { center: [number, number]; count: number; cat: string }>();
  for (const f of snap.poi.features) {
    const b = f.properties.brand;
    const cur = brandFirst.get(b);
    if (cur) cur.count++;
    else {
      brandFirst.set(b, {
        center: f.geometry.coordinates as [number, number],
        count: 1,
        cat: f.properties.category,
      });
    }
  }
  for (const [brand, info] of brandFirst) {
    hits.push({
      id: `b-${brand}`,
      label: brand,
      sub: `Brand · ${info.count} location${info.count === 1 ? "" : "s"}`,
      kind: "brand",
      center: info.center,
      zoom: 12.5,
    });
  }

  const catLabel = Object.fromEntries(LA.poiCats.map((c) => [c.id, c.label]));
  for (const f of snap.poi.features) {
    hits.push({
      id: `p-${f.properties.id}`,
      label: f.properties.name,
      sub: catLabel[f.properties.category] ?? f.properties.category,
      kind: "poi",
      center: f.geometry.coordinates as [number, number],
      zoom: 14,
      h3: f.properties.h3,
    });
  }

  return hits;
}

export function searchPlaces(q: string, index: SearchHit[], limit = 8): SearchHit[] {
  const lq = q.trim().toLowerCase();
  if (!lq) return [];
  const scored: { hit: SearchHit; score: number }[] = [];
  for (const hit of index) {
    const ll = hit.label.toLowerCase();
    let score = 0;
    if (ll.startsWith(lq)) score = 2;
    else if (ll.includes(lq)) score = 1;
    else if (hit.sub.toLowerCase().includes(lq)) score = 0.5;
    if (score > 0) {
      // areas and brands outrank individual POIs at equal text score
      if (hit.kind !== "poi") score += 0.25;
      scored.push({ hit, score });
    }
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.hit);
}

let indexCache: SearchHit[] | null = null;

/** lazy index over the loaded snapshot; empty until loadSnapshot resolves */
export function getSearchIndex(): SearchHit[] {
  if (indexCache) return indexCache;
  const snap = getSnapshotSync();
  if (!snap) return [];
  indexCache = buildSearchIndex(snap);
  return indexCache;
}
