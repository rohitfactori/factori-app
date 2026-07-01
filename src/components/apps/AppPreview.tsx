import Link from "next/link";
import { Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Page, PageHeader, PageBody } from "@/components/shell/Page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AppPreview({
  icon: Icon,
  name,
  tagline,
  features,
}: {
  icon: LucideIcon;
  name: string;
  tagline: string;
  features: { title: string; desc: string }[];
}) {
  return (
    <Page>
      <PageHeader
        icon={<Icon />}
        title={name}
        sub={tagline}
        actions={<Badge tone="accent">Beta preview</Badge>}
      />
      <PageBody>
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-xl border border-line bg-panel p-8 text-center">
            <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
            <div className="relative">
              <div className="mx-auto grid size-12 place-items-center rounded-xl bg-accent-tint text-accent">
                <Icon className="size-6" />
              </div>
              <h2 className="mt-3 text-lg font-semibold text-ink">{name}</h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted">
                {tagline}
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <Button variant="primary">
                  <Bell className="size-3.5" />
                  Join the preview
                </Button>
                <Link href="/apps">
                  <Button variant="secondary">All apps</Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border border-line bg-panel p-3.5">
                <div className="text-sm font-medium text-ink">{f.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-ink-muted">
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageBody>
    </Page>
  );
}
