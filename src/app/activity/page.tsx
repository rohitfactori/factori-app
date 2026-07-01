import {
  Activity as ActivityIcon,
  Compass,
  Download,
  Store,
  Terminal,
  Database,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ACTIVITY } from "@/lib/mock/platform";
import { Page, PageHeader, PageBody } from "@/components/shell/Page";
import { Badge } from "@/components/ui/badge";

const ICONS: Record<string, LucideIcon> = {
  ask: Compass,
  export: Download,
  app: Store,
  api: Terminal,
  enrich: Database,
};

export default function ActivityPage() {
  return (
    <Page>
      <PageHeader
        icon={<ActivityIcon />}
        title="Activity"
        sub="Every query, export, app run, and API call across your workspace — with credits and data provenance."
      />
      <PageBody>
        <div className="overflow-hidden rounded-lg border border-line">
          {ACTIVITY.map((a) => {
            const Icon = ICONS[a.kind] ?? Compass;
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 border-b border-line/60 px-3.5 py-2.5 transition-colors last:border-0 hover:bg-panel-2/30"
              >
                <div className="grid size-7 shrink-0 place-items-center rounded-md bg-panel-2 text-ink-muted">
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink">{a.title}</div>
                  <div className="truncate text-xs text-ink-faint">{a.detail}</div>
                </div>
                {a.status === "scheduled" ? (
                  <Badge tone="warning">Scheduled</Badge>
                ) : (
                  <Badge tone="neutral">Done</Badge>
                )}
                <div className="w-16 text-right text-xs tabular-nums text-ink-muted">
                  {a.credits ? `${a.credits} cr` : "—"}
                </div>
                <div className="w-20 text-right text-xs text-ink-faint">
                  {a.when}
                </div>
              </div>
            );
          })}
        </div>
      </PageBody>
    </Page>
  );
}
