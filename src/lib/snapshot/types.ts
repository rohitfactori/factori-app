/** Snapshot + explorer contracts. The hex property schema is the swap-to-real
 *  data contract: production exports must produce these exact shapes. */

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
  // Consumer Spend Signals — index, metro base 100
  sp_food: number;
  sp_retail: number;
  sp_grocery: number;
  sp_fitness: number;
  sp_fuel: number;
  // People & Audience Graph — segment penetration, % 0..40
  au_hip: number;
  au_trv: number;
  au_auto: number;
  au_fit: number;
  au_mov: number;
  au_lux: number;
  // Places & POI Graph (per-hex aggregates)
  poi_count: number;
  poi_food: number;
  poi_retail: number;
  poi_grocery: number;
  poi_health: number;
  poi_fin: number;
  poi_top: string[];     // ≤5 notable brand names
  // Brand Visitation & Loyalty (panel only)
  bl_top: string[];      // ≤5 co-visited brands
};

export type PoiProps = {
  id: string;
  name: string;
  brand: string;
  category: PoiCategory;
  h3: string;            // containing r8 cell (lets search select the hex)
};

export type HexFC = GeoJSON.FeatureCollection<GeoJSON.Polygon, HexProps>;
export type PoiFC = GeoJSON.FeatureCollection<GeoJSON.Point, PoiProps>;

/* ---------------- explorer layer / view shapes ----------------
   Declared here (not in the store) so la-meta and the store can both
   import them without cycles. */

export type ExploreLayer = {
  id: string;                    // instance id "xl1", "xl2", …
  datasetId: string;             // catalog id, e.g. "movement-graph"
  metricId: string;              // key into METRICS
  /** per-dataset: movement day-part "all"|"day"|"eve"; trends category
   *  "all"|"qsr"|"retail"|"grocery"|"fitness"; places mode "points"|"density" */
  variant?: string;
  poiCat?: PoiCategory | "all";  // places only
  opacity: number;               // 0..1, default 0.7
  visible: boolean;
};

export type SavedView = {
  id: string;
  name: string;
  description?: string;
  layers: Omit<ExploreLayer, "id">[];
  camera: { center: [number, number]; zoom: number };
  timeIndex?: number;
  playing?: boolean;
};
