import { CreditCard, Check } from "lucide-react";
import { USAGE } from "@/lib/mock/platform";
import { Page, PageHeader, PageBody } from "@/components/shell/Page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtInt } from "@/lib/format";
import { cn } from "@/lib/cn";

const PLANS = [
  { name: "Starter", price: "$499", credits: "5,000", current: false, features: ["Self-serve catalog", "REST API + MCP", "1 seat"] },
  { name: "Growth", price: "$1,900", credits: "15,000", current: true, features: ["Everything in Starter", "Cloud delivery", "GeoAI apps", "5 seats"] },
  { name: "Scale", price: "Custom", credits: "50,000+", current: false, features: ["Everything in Growth", "Clean room", "SSO + SLA", "Unlimited seats"] },
];

export default function BillingPage() {
  const pct = Math.round((USAGE.creditsUsed / USAGE.creditsTotal) * 100);
  const maxCh = Math.max(...USAGE.byChannel.map((c) => c.value));
  return (
    <Page>
      <PageHeader
        icon={<CreditCard />}
        title="Billing"
        sub="One wallet across data, API, MCP, and apps — usage bills in credits, apps bill as subscriptions."
        actions={<Button variant="primary">Upgrade plan</Button>}
      />
      <PageBody>
        <div className="max-w-4xl space-y-6">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-line bg-panel p-4 lg:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="label-eyebrow">Current plan</div>
                  <div className="mt-0.5 text-lg font-semibold text-ink">
                    {USAGE.plan}
                  </div>
                </div>
                <Badge tone="accent">Active</Badge>
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <span className="text-sm text-ink-muted">Credits used</span>
                <span className="text-sm tabular-nums text-ink">
                  {fmtInt(USAGE.creditsUsed)} / {fmtInt(USAGE.creditsTotal)}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-panel-3">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-ink-faint">
                Renews {USAGE.renews} ·{" "}
                {fmtInt(USAGE.creditsTotal - USAGE.creditsUsed)} credits remaining
              </div>
            </div>

            <div className="rounded-xl border border-line bg-panel p-4">
              <div className="label-eyebrow">Usage by channel</div>
              <div className="mt-3 space-y-2.5">
                {USAGE.byChannel.map((c) => (
                  <div key={c.label}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-ink-muted">{c.label}</span>
                      <span className="tabular-nums text-ink">{fmtInt(c.value)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-panel-3">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(c.value / maxCh) * 100}%`, background: c.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section>
            <div className="label-eyebrow mb-2">Plans</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PLANS.map((p) => (
                <div
                  key={p.name}
                  className={cn(
                    "rounded-xl border bg-panel p-4",
                    p.current ? "border-accent-dim" : "border-line"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-ink">{p.name}</div>
                    {p.current && <Badge tone="accent">Current</Badge>}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-xl font-semibold tabular-nums text-ink">
                      {p.price}
                    </span>
                    {p.price !== "Custom" && (
                      <span className="text-xs text-ink-faint">/mo</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-muted">
                    {p.credits} credits / mo
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-ink-muted">
                        <Check className="size-3.5 shrink-0 text-accent" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={p.current ? "secondary" : "outline"}
                    className="mt-4 w-full"
                    disabled={p.current}
                  >
                    {p.current ? "Current plan" : `Choose ${p.name}`}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </PageBody>
    </Page>
  );
}
