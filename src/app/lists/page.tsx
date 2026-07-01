"use client";

import { useState } from "react";
import {
  List,
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Terminal,
  ArrowRight,
  Upload,
  Check,
} from "lucide-react";
import { LISTS } from "@/lib/mock/platform";
import { Page, PageHeader, PageBody, Callout } from "@/components/shell/Page";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabBar } from "@/components/ui/field";

type Tab = "saved" | "integrations" | "uploads";

export default function ListsPage() {
  const [tab, setTab] = useState<Tab>("saved");
  return (
    <Page>
      <PageHeader
        icon={<List />}
        title="Lists & Enrich"
        sub="Bring your own records — CRM, files, or API — and enrich them with Factori's real-world data."
        actions={
          <Button variant="primary">
            <Plus className="size-3.5" />
            Enrich
          </Button>
        }
      >
        <div className="mt-3">
          <TabBar<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "saved", label: "Saved Lists", count: LISTS.length },
              { value: "integrations", label: "Integrations" },
              { value: "uploads", label: "File Uploads" },
            ]}
          />
        </div>
      </PageHeader>
      <PageBody>
        <Callout
          icon={<Terminal />}
          title="Enrich via MCP / API"
          action={
            <Button variant="secondary" size="sm">
              View docs
              <ArrowRight className="size-3.5" />
            </Button>
          }
        >
          Connect your CRM once in Settings, then enrich records programmatically
          via our REST API — or let any AI agent enrich through the Factori MCP
          server.
        </Callout>

        <div className="mt-4">
          {tab === "saved" && <Saved />}
          {tab === "integrations" && <Integrations />}
          {tab === "uploads" && <Uploads />}
        </div>
      </PageBody>
    </Page>
  );
}

function Saved() {
  return (
    <div>
      <div className="relative mb-3 w-[260px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
        <input
          placeholder="Search lists…"
          className="h-8 w-full rounded-md border border-line bg-canvas pl-8 pr-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-accent-dim"
        />
      </div>
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-panel-2/40 text-left">
              <th className="label-eyebrow px-3 py-2 font-medium">List name</th>
              <th className="label-eyebrow px-3 py-2 text-right font-medium">Records</th>
              <th className="label-eyebrow px-3 py-2 font-medium">Source</th>
              <th className="label-eyebrow px-3 py-2 font-medium">Last updated</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {LISTS.map((l) => (
              <tr
                key={l.id}
                className="border-b border-line/60 transition-colors last:border-0 hover:bg-panel-2/30"
              >
                <td className="px-3 py-2.5 font-medium text-ink">{l.name}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink-muted">
                  {l.records.toLocaleString()}
                </td>
                <td className="px-3 py-2.5">
                  <Badge tone="neutral">{l.source}</Badge>
                </td>
                <td className="px-3 py-2.5 text-ink-muted">{l.updated}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-0.5">
                    <IconButton size="sm" aria-label="Download">
                      <Download />
                    </IconButton>
                    <IconButton size="sm" aria-label="More">
                      <MoreHorizontal />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Integrations() {
  const conns = [
    { name: "Salesforce", status: "Connected", desc: "Sync accounts & contacts for enrichment." },
    { name: "HubSpot", status: "Connect", desc: "Enrich companies and deals in place." },
    { name: "Snowflake", status: "Connected", desc: "Two-way share for cloud delivery." },
    { name: "Webhook / API", status: "Connect", desc: "Push records via REST or MCP." },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {conns.map((c) => (
        <div
          key={c.name}
          className="flex items-center gap-3 rounded-lg border border-line bg-panel p-3.5"
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-md border border-line bg-panel-2 text-xs font-semibold text-ink-muted">
            {c.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink">{c.name}</div>
            <div className="truncate text-xs text-ink-muted">{c.desc}</div>
          </div>
          {c.status === "Connected" ? (
            <Badge tone="positive">
              <Check className="size-3" />
              Connected
            </Badge>
          ) : (
            <Button variant="secondary" size="sm">
              Connect
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function Uploads() {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-line bg-panel/40 py-14">
      <div className="grid size-10 place-items-center rounded-lg bg-panel-2 text-ink-faint">
        <Upload className="size-5" />
      </div>
      <div className="mt-3 text-sm font-medium text-ink">Drop a CSV to enrich</div>
      <div className="mt-1 max-w-sm text-center text-xs text-ink-muted">
        Map your columns to Factori entities and we&apos;ll append demographics,
        movement, and audience signals.
      </div>
      <Button variant="secondary" size="sm" className="mt-3">
        Browse files
      </Button>
    </div>
  );
}
