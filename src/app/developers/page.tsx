"use client";

import { useState } from "react";
import { Terminal, Plus, Copy, Check, Code2, Trash2 } from "lucide-react";
import { API_KEYS } from "@/lib/mock/platform";
import { Page, PageHeader, PageBody } from "@/components/shell/Page";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function Copyable({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      className="flex h-8 items-center gap-2 rounded-md border border-line bg-canvas px-2.5 font-mono text-xs text-ink transition-colors hover:border-line-strong"
    >
      <span className="truncate">{value}</span>
      {done ? (
        <Check className="size-3.5 shrink-0 text-positive" />
      ) : (
        <Copy className="size-3.5 shrink-0 text-ink-faint" />
      )}
    </button>
  );
}

function EndpointCard({
  icon,
  title,
  desc,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-panel p-3.5">
      <div className="flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-md bg-accent-tint text-accent [&_svg]:size-3.5">
          {icon}
        </div>
        <div className="text-sm font-medium text-ink">{title}</div>
      </div>
      <p className="mt-1.5 text-xs text-ink-muted">{desc}</p>
      <div className="mt-2.5">
        <Copyable value={value} />
      </div>
    </div>
  );
}

export default function DevelopersPage() {
  return (
    <Page>
      <PageHeader
        icon={<Terminal />}
        title="Developers"
        sub="Ship Factori data into your stack — REST API, MCP server, SDKs, and cloud delivery."
        actions={
          <Button variant="primary">
            <Plus className="size-3.5" />
            New API key
          </Button>
        }
      />
      <PageBody>
        <div className="max-w-4xl space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <EndpointCard
              icon={<Terminal />}
              title="MCP server"
              desc="Let any AI agent query Factori as live tools."
              value="https://mcp.factori.ai/sse"
            />
            <EndpointCard
              icon={<Code2 />}
              title="REST API"
              desc="Sub-200ms lookups with cursor pagination."
              value="https://api.factori.ai/v2"
            />
          </div>

          <section>
            <div className="label-eyebrow mb-2">MCP quickstart</div>
            <pre className="overflow-x-auto rounded-lg border border-line bg-canvas p-3.5 font-mono text-xs leading-relaxed text-ink-muted">
{`{
  "mcpServers": {
    "factori": {
      "url": "https://mcp.factori.ai/sse",
      "headers": { "Authorization": "Bearer $FACTORI_KEY" }
    }
  }
}`}
            </pre>
          </section>

          <section>
            <div className="label-eyebrow mb-2">API keys</div>
            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-panel-2/40 text-left">
                    <th className="label-eyebrow px-3 py-2 font-medium">Name</th>
                    <th className="label-eyebrow px-3 py-2 font-medium">Key</th>
                    <th className="label-eyebrow px-3 py-2 font-medium">Scope</th>
                    <th className="label-eyebrow px-3 py-2 font-medium">Last used</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {API_KEYS.map((k) => (
                    <tr
                      key={k.id}
                      className="border-b border-line/60 last:border-0 hover:bg-panel-2/30"
                    >
                      <td className="px-3 py-2.5 font-medium text-ink">{k.name}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-ink-muted">
                        {k.prefix}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={k.scope.includes("MCP") ? "accent" : "neutral"}>
                          {k.scope}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-ink-muted">{k.lastUsed}</td>
                      <td className="px-3 py-2.5 text-right">
                        <IconButton size="sm" variant="ghost" aria-label="Revoke">
                          <Trash2 />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </PageBody>
    </Page>
  );
}
