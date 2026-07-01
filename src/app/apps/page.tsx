import Link from "next/link";
import {
  Store,
  Tv,
  Target,
  Compass,
  ArrowRight,
  Check,
  LayoutGrid,
  ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Page, PageHeader, PageBody } from "@/components/shell/Page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AppDef = {
  name: string;
  href: string;
  icon: LucideIcon;
  status: "Live" | "Beta";
  desc: string;
  features: string[];
};

const APPS: AppDef[] = [
  {
    name: "Site Selection",
    href: "/apps/site-selection",
    icon: Store,
    status: "Live",
    desc: "Score candidate sites with trade areas, demographics, footfall, and cannibalization — pick winners with confidence.",
    features: ["Drive-time trade areas", "Cannibalization checks", "Configurable scoring model"],
  },
  {
    name: "OOH Planning",
    href: "/apps/ooh",
    icon: Tv,
    status: "Beta",
    desc: "Plan out-of-home & DOOH by real audience reach and movement — not rate cards and guesswork.",
    features: ["Reach & frequency by panel", "Audience-indexed inventory", "Route & flow modeling"],
  },
  {
    name: "Audience Builder",
    href: "/apps/audiences",
    icon: Target,
    status: "Beta",
    desc: "Build and activate real-world audiences from places, movement, and demographics.",
    features: ["Segment from any behavior", "Lookalike expansion", "Activate to CTV & programmatic"],
  },
];

export default function AppsPage() {
  return (
    <Page>
      <PageHeader
        icon={<LayoutGrid />}
        title="Apps"
        sub="Purpose-built GeoAI apps with Factori data bundled in. Open one embedded here, or launch it as a standalone app in its own window."
      />
      <PageBody>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {APPS.map((a) => (
            <AppCard key={a.name} app={a} />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-lg border border-line bg-panel p-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-panel-2 text-accent">
            <Compass className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink">
              Location Intelligence — included
            </div>
            <div className="text-xs text-ink-muted">
              The horizontal layer powering every app. Explore any place, person,
              or movement conversationally from{" "}
              <Link href="/" className="text-accent">
                Ask
              </Link>
              .
            </div>
          </div>
          <Link href="/">
            <Button variant="secondary" size="sm">
              Open Ask
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </PageBody>
    </Page>
  );
}

function AppCard({ app }: { app: AppDef }) {
  const Icon = app.icon;
  const slug = app.href.split("/").pop();
  return (
    <div className="flex flex-col rounded-xl border border-line bg-panel p-4">
      <div className="flex items-start justify-between">
        <div className="grid size-10 place-items-center rounded-lg bg-accent-tint text-accent">
          <Icon className="size-5" />
        </div>
        <Badge tone={app.status === "Live" ? "positive" : "accent"}>
          {app.status}
        </Badge>
      </div>
      <div className="mt-3 text-[15px] font-semibold text-ink">{app.name}</div>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{app.desc}</p>
      <ul className="mt-3 space-y-1.5">
        {app.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-ink-muted">
            <Check className="size-3.5 shrink-0 text-accent" />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
        <Link href={app.href} className="flex-1">
          <Button variant="primary" className="w-full">
            Open App
            <ArrowRight className="size-3.5" />
          </Button>
        </Link>
        <a
          href={`/w/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open as a standalone app in a new window"
        >
          <Button variant="secondary" aria-label="Open in new window">
            <ExternalLink className="size-3.5" />
          </Button>
        </a>
      </div>
    </div>
  );
}
