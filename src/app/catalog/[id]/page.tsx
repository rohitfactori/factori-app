"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  Terminal,
  Cloud,
  Code2,
  Boxes,
  Filter,
  Search,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { getDataset, generatePreview } from "@/lib/mock/platform";
import { Page, PageHeader, PageBody } from "@/components/shell/Page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Segmented, TabBar } from "@/components/ui/field";
import { cn } from "@/lib/cn";

type Tab = "overview" | "coverage" | "directory" | "preview";

export default function DatasetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const ds = getDataset(id);
  const [tab, setTab] = useState<Tab>("preview");

  if (!ds) {
    return (
      <Page>
        <PageBody>
          <div className="grid h-full place-items-center text-sm text-ink-muted">
            Dataset not found.{" "}
            <Link href="/catalog" className="text-accent">
              Back to Catalog
            </Link>
          </div>
        </PageBody>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        icon={<Boxes />}
        title={ds.name}
        sub={`${ds.category} · ${ds.records} records · refreshed ${ds.freshness.toLowerCase()}`}
        actions={
          <>
            <Button variant="secondary">
              <Download className="size-3.5" />
              Download sample
            </Button>
            <Button variant="primary">Get production access</Button>
          </>
        }
      >
        <div className="mt-3">
          <TabBar<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "overview", label: "Overview" },
              { value: "coverage", label: "Coverage" },
              { value: "directory", label: "Directory" },
              { value: "preview", label: "Preview & Export" },
            ]}
          />
        </div>
      </PageHeader>

      {tab === "preview" ? (
        <Preview ds={ds} />
      ) : (
        <PageBody>
          {tab === "overview" && <Overview ds={ds} />}
          {tab === "coverage" && <Coverage ds={ds} />}
          {tab === "directory" && <Directory ds={ds} />}
        </PageBody>
      )}
    </Page>
  );
}

/* ---------------- Overview ---------------- */
function Overview({ ds }: { ds: ReturnType<typeof getDataset> & {} }) {
  const access = [
    { icon: <Boxes />, name: "Self-serve cut", desc: "Filter, preview, and export a slice as CSV — billed in credits." },
    { icon: <Code2 />, name: "REST API", desc: "Query programmatically with sub-200ms lookups and pagination." },
    { icon: <Terminal />, name: "MCP server", desc: "Let any AI agent query this dataset as a tool, live." },
    { icon: <Cloud />, name: "Cloud delivery", desc: "Share to Snowflake, BigQuery, Databricks, or S3 on a schedule." },
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <p className="text-sm leading-relaxed text-ink-muted">{ds.description}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Records", ds.records],
          ["Coverage", ds.coverage.split(" · ")[0]],
          ["Refresh", ds.freshness],
          ["From", `${ds.credits} cr`],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-line bg-panel p-3">
            <div className="label-eyebrow">{l}</div>
            <div className="mt-1 text-sm font-medium text-ink">{v}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="label-eyebrow mb-2">Ways to access</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {access.map((a) => (
            <div key={a.name} className="flex gap-3 rounded-lg border border-line bg-panel p-3.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-md bg-accent-tint text-accent [&_svg]:size-4">
                {a.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-ink">{a.name}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                  {a.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="label-eyebrow mb-2">Query via MCP or REST</div>
        <pre className="overflow-x-auto rounded-lg border border-line bg-canvas p-3.5 font-mono text-xs leading-relaxed text-ink-muted">
{`# MCP — any agent can call this dataset as a tool
factori.query("${ds.id}", { city: "Los Angeles", limit: 100 })

# REST
curl https://api.factori.ai/v2/${ds.id}/search \\
  -H "Authorization: Bearer $FACTORI_KEY" \\
  -d '{ "city": "Los Angeles", "limit": 100 }'`}
        </pre>
      </div>
    </div>
  );
}

/* ---------------- Coverage ---------------- */
function Coverage({ ds }: { ds: ReturnType<typeof getDataset> & {} }) {
  const regions = [
    ["North America", 98],
    ["Europe", 94],
    ["Asia–Pacific", 89],
    ["Latin America", 76],
    ["Middle East & Africa", 64],
  ] as const;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Freshness", ds.freshness],
          ["Latency", "< 200 ms"],
          ["Match rate", "73%"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-line bg-panel p-3">
            <div className="label-eyebrow">{l}</div>
            <div className="mt-1 text-sm font-medium text-ink">{v}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-line bg-panel p-4">
        <div className="label-eyebrow mb-3">Coverage by region</div>
        <div className="space-y-2.5">
          {regions.map(([name, pct]) => (
            <div key={name} className="flex items-center gap-3">
              <span className="w-44 shrink-0 text-xs text-ink-muted">{name}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-3">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-ink">
                {pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Directory (schema) ---------------- */
function inferType(key: string) {
  if (/id$|^geo|period|status|country|city|name|brand|segment|category|interest|device|band/.test(key))
    return key.includes("score") ? "float" : "string";
  if (/score|index|visits|population|age|income|hhi|dwell|yoy/.test(key)) return "number";
  if (/seen|date|period/.test(key)) return "date";
  return "string";
}
function Directory({ ds }: { ds: ReturnType<typeof getDataset> & {} }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-panel-2/50 text-left">
              <th className="px-3 py-2 label-eyebrow font-medium">Field</th>
              <th className="px-3 py-2 label-eyebrow font-medium">Type</th>
              <th className="px-3 py-2 label-eyebrow font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {ds.columns.map((c) => (
              <tr key={c.key} className="border-b border-line/60 last:border-0">
                <td className="px-3 py-2 font-mono text-xs text-ink">{c.key}</td>
                <td className="px-3 py-2">
                  <Badge tone="neutral">{inferType(c.key)}</Badge>
                </td>
                <td className="px-3 py-2 text-xs text-ink-muted">
                  {c.label.replace(/_/g, " ")} field.
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Preview & Export (interactive) ---------------- */
type Row = Record<string, string | number>;
const uniq = (a: string[]) => Array.from(new Set(a));
const num = (v: string | number) =>
  typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.-]/g, ""));

function restCall(id: string, params: Record<string, string | number>) {
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return `GET https://api.factori.ai/v2/${id}?${qs}`;
}
function mcpCall(id: string, params: Record<string, string | number>) {
  const args = Object.entries(params)
    .map(([k, v]) => `${k}: ${typeof v === "number" ? v : `"${v}"`}`)
    .join(", ");
  return `factori.query("${id}", { ${args} })`;
}

function Preview({ ds }: { ds: ReturnType<typeof getDataset> & {} }) {
  const pool = useMemo(() => generatePreview(ds, 120), [ds]);
  const has = (k: string) => ds.columns.some((c) => c.key === k);
  const countries = useMemo(
    () => uniq(pool.map((r) => String(r.country ?? ""))).filter(Boolean).sort(),
    [pool]
  );
  const categories = useMemo(
    () => uniq(pool.map((r) => String(r.category ?? ""))).filter(Boolean).sort(),
    [pool]
  );

  const [q, setQ] = useState("");
  const [country, setCountry] = useState("All");
  const [category, setCategory] = useState("All");
  const [limit, setLimit] = useState(25);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [apiMode, setApiMode] = useState<"rest" | "mcp">("rest");
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    let rows = pool;
    if (country !== "All") rows = rows.filter((r) => r.country === country);
    if (category !== "All") rows = rows.filter((r) => r.category === category);
    if (q.trim()) {
      const lq = q.toLowerCase();
      rows = rows.filter((r) =>
        Object.values(r).some((v) => String(v).toLowerCase().includes(lq))
      );
    }
    if (sort) {
      const { key, dir } = sort;
      rows = [...rows].sort((a, b) => {
        const an = num(a[key]);
        const bn = num(b[key]);
        const cmp =
          !isNaN(an) && !isNaN(bn)
            ? an - bn
            : String(a[key]).localeCompare(String(b[key]));
        return dir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [pool, country, category, q, sort]);

  const shown = filtered.slice(0, limit);
  const dirty = country !== "All" || category !== "All" || q.trim() !== "";

  const params: Record<string, string | number> = {};
  if (country !== "All") params.country = country;
  if (category !== "All") params.category = category;
  if (q.trim()) params.q = q.trim();
  params.limit = limit;
  const call = apiMode === "rest" ? restCall(ds.id, params) : mcpCall(ds.id, params);

  function toggleSort(key: string) {
    setSort((s) =>
      s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* filters */}
      <aside className="w-60 shrink-0 space-y-4 overflow-y-auto border-r border-line p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
            <Filter className="size-3.5 text-ink-faint" />
            Filters
          </div>
          {dirty && (
            <button
              onClick={() => {
                setCountry("All");
                setCategory("All");
                setQ("");
              }}
              className="text-2xs text-accent hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        <div>
          <div className="label-eyebrow mb-1.5">Search</div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter rows…"
              className="h-8 w-full rounded-md border border-line bg-canvas pl-7 pr-2 text-xs text-ink outline-none placeholder:text-ink-faint focus:border-accent-dim"
            />
          </div>
        </div>

        {has("country") && (
          <SelectFilter label="Country" value={country} onChange={setCountry} options={["All", ...countries]} />
        )}
        {has("category") && (
          <SelectFilter label="Category" value={category} onChange={setCategory} options={["All", ...categories]} />
        )}

        <div>
          <div className="label-eyebrow mb-1.5">Rows</div>
          <div className="flex gap-1">
            {[25, 50, 100].map((n) => (
              <button
                key={n}
                onClick={() => setLimit(n)}
                className={cn(
                  "h-7 flex-1 rounded-md border text-xs tabular-nums transition-colors",
                  limit === n
                    ? "border-accent-dim bg-accent-tint text-accent"
                    : "border-line text-ink-muted hover:bg-panel-2"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* table + live query */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <div className="text-xs text-ink-muted">
            <span className="font-medium text-ink">{ds.records}</span> total · showing{" "}
            <span className="tabular-nums text-ink">{shown.length}</span> of{" "}
            <span className="tabular-nums">{filtered.length}</span> matched rows
          </div>
          <Button variant="primary" size="sm">
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>

        {/* live query */}
        <div className="flex shrink-0 items-center gap-2 border-b border-line bg-canvas/60 px-4 py-2">
          <Segmented<"rest" | "mcp">
            value={apiMode}
            onChange={setApiMode}
            options={[
              { value: "rest", label: "REST" },
              { value: "mcp", label: "MCP" },
            ]}
          />
          <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-muted">
            {call}
          </code>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(call);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="shrink-0 text-ink-faint transition-colors hover:text-ink"
            title="Copy query"
          >
            {copied ? (
              <Check className="size-3.5 text-positive" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>

        <div className="border-b border-line bg-warning-tint/40 px-4 py-1.5 text-2xs text-ink-muted">
          Exports are limited to 100 masked rows for evaluation. Get production
          access for full data via API, MCP, or cloud delivery.
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-panel">
              <tr className="text-left">
                {ds.columns.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => toggleSort(c.key)}
                    className={cn(
                      "cursor-pointer select-none whitespace-nowrap border-b border-line px-3 py-2 font-mono text-2xs font-normal text-ink-faint transition-colors hover:text-ink",
                      c.align === "right" && "text-right"
                    )}
                  >
                    <span className={cn("inline-flex items-center gap-1", c.align === "right" && "flex-row-reverse")}>
                      {c.label}
                      {sort?.key === c.key &&
                        (sort.dir === "asc" ? (
                          <ChevronUp className="size-3 text-accent" />
                        ) : (
                          <ChevronDown className="size-3 text-accent" />
                        ))}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={i} className="hover:bg-panel-2/40">
                  {ds.columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "whitespace-nowrap border-b border-line/50 px-3 py-1.5 text-ink-muted",
                        c.align === "right" && "text-right tabular-nums",
                        /id|score/.test(c.key) && "font-mono text-ink"
                      )}
                    >
                      {String(r[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td
                    colSpan={ds.columns.length}
                    className="px-3 py-10 text-center text-xs text-ink-faint"
                  >
                    No rows match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="shrink-0 border-t border-line px-4 py-2 text-2xs text-ink-faint">
          Need production access? Use this dataset via{" "}
          <span className="text-ink-muted">REST API</span>,{" "}
          <span className="text-ink-muted">MCP server</span>, or{" "}
          <span className="text-ink-muted">cloud delivery</span>.
        </div>
      </div>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <div className="label-eyebrow mb-1.5">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-md border border-line bg-canvas px-2 text-xs text-ink outline-none focus:border-accent-dim"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
