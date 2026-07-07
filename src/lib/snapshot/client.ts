/** Loads the demo snapshot once and exposes lookup helpers. Everything the
 *  panel, tooltips and chat display comes from here — one source of numbers. */
import type { HexFC, HexProps, PoiFC } from "./types";

export type Snapshot = {
  r7: HexFC;
  r8: HexFC;
  poi: PoiFC;
  byId: Map<string, HexProps>;
  /** metro averages over r8 for every numeric scalar hex prop */
  avg: Record<string, number>;
  topHex(prop: string): { h3: string; label: string; value: number } | null;
};

const BASE = "/snapshot/la";

let promise: Promise<Snapshot> | null = null;
let loaded: Snapshot | null = null;

export function resetSnapshotCache() {
  promise = null;
  loaded = null;
}
/** @deprecated test alias */
export const __resetSnapshotForTests = resetSnapshotCache;

async function fetchJson<T>(fetcher: typeof fetch, url: string): Promise<T> {
  const res = await fetcher(url);
  if (!res.ok) throw new Error(`snapshot fetch failed: ${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

function build(r7: HexFC, r8: HexFC, poi: PoiFC): Snapshot {
  const byId = new Map<string, HexProps>();
  for (const f of r8.features) byId.set(f.properties.h3, f.properties);
  for (const f of r7.features) byId.set(f.properties.h3, f.properties);

  const sums: Record<string, number> = {};
  for (const f of r8.features) {
    for (const [k, v] of Object.entries(f.properties)) {
      if (typeof v === "number") sums[k] = (sums[k] ?? 0) + v;
    }
  }
  const n = Math.max(1, r8.features.length);
  const avg: Record<string, number> = {};
  for (const [k, v] of Object.entries(sums)) avg[k] = v / n;

  return {
    r7,
    r8,
    poi,
    byId,
    avg,
    topHex(prop) {
      let best: { h3: string; label: string; value: number } | null = null;
      for (const f of r8.features) {
        const v = (f.properties as unknown as Record<string, unknown>)[prop];
        if (typeof v !== "number") continue;
        if (!best || v > best.value) best = { h3: f.properties.h3, label: f.properties.label, value: v };
      }
      return best;
    },
  };
}

export function loadSnapshot(fetcher: typeof fetch = fetch): Promise<Snapshot> {
  if (!promise) {
    promise = Promise.all([
      fetchJson<HexFC>(fetcher, `${BASE}/hex-r7.json`),
      fetchJson<HexFC>(fetcher, `${BASE}/hex-r8.json`),
      fetchJson<PoiFC>(fetcher, `${BASE}/poi.json`),
    ]).then(([r7, r8, poi]) => {
      loaded = build(r7, r8, poi);
      return loaded;
    });
    // allow a retry after a failed load instead of caching the rejection
    promise.catch(() => {
      promise = null;
    });
  }
  return promise;
}

/** null until loadSnapshot resolves — callers must handle the loading window */
export function getSnapshotSync(): Snapshot | null {
  return loaded;
}
