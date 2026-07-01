import { Settings as SettingsIcon, Check } from "lucide-react";
import { Page, PageHeader, PageBody } from "@/components/shell/Page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/field";

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <div className="text-sm font-medium text-ink">{title}</div>
        {desc && <div className="mt-0.5 text-xs text-ink-muted">{desc}</div>}
      </div>
      <div className="divide-y divide-line/60">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  action,
}: {
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <div className="min-w-0">
        <div className="text-xs text-ink-faint">{label}</div>
        <div className="mt-0.5 truncate text-sm text-ink">{value}</div>
      </div>
      {action ?? (
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Page>
      <PageHeader
        icon={<SettingsIcon />}
        title="Settings"
        sub="Manage your profile, workspace, team, and connections."
      />
      <PageBody>
        <div className="max-w-3xl space-y-4">
          <Section title="Profile">
            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar name="Rohit Maheswaran" className="size-9 text-xs" />
              <div className="flex-1">
                <div className="text-sm font-medium text-ink">Rohit Maheswaran</div>
                <div className="text-xs text-ink-muted">rohit@lifesight.io</div>
              </div>
              <Badge tone="neutral">Admin</Badge>
            </div>
          </Section>

          <Section title="Workspace">
            <Row label="Name" value="Factori" />
            <Row label="Data region" value="United States (us-east)" />
            <Row
              label="Default map style"
              value="Dark"
              action={<Badge tone="neutral">Dark</Badge>}
            />
          </Section>

          <Section
            title="Team & SSO"
            desc="Single sign-on lets your apps and the data console share one identity."
          >
            <Row
              label="Members"
              value="4 members · 1 admin"
              action={<Button variant="secondary" size="sm">Invite</Button>}
            />
            <Row
              label="SSO"
              value="Okta · SAML"
              action={
                <Badge tone="positive">
                  <Check className="size-3" />
                  Enabled
                </Badge>
              }
            />
          </Section>

          <Section title="Connections" desc="Used by Lists & Enrich and cloud delivery.">
            <Row
              label="Salesforce"
              value="Connected · syncs hourly"
              action={<Badge tone="positive"><Check className="size-3" />Connected</Badge>}
            />
            <Row
              label="Snowflake"
              value="Connected · data share"
              action={<Badge tone="positive"><Check className="size-3" />Connected</Badge>}
            />
          </Section>
        </div>
      </PageBody>
    </Page>
  );
}
