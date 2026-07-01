"use client";

import { use } from "react";
import { StandaloneFrame } from "@/components/apps/StandaloneFrame";
import { SiteSelectionApp } from "@/components/site-selection/SiteSelectionApp";
import { OOHApp } from "@/components/apps/OOHApp";
import { AudienceApp } from "@/components/apps/AudienceApp";

const APPS: Record<
  string,
  { name: string; href: string; render: () => React.ReactNode }
> = {
  "site-selection": {
    name: "Site Selection",
    href: "/apps/site-selection",
    render: () => <SiteSelectionApp />,
  },
  ooh: { name: "OOH Planning", href: "/apps/ooh", render: () => <OOHApp /> },
  audiences: {
    name: "Audience Builder",
    href: "/apps/audiences",
    render: () => <AudienceApp />,
  },
};

export default function StandaloneAppPage({
  params,
}: {
  params: Promise<{ app: string }>;
}) {
  const { app } = use(params);
  const def = APPS[app];
  if (!def) {
    return (
      <div className="grid h-screen place-items-center bg-canvas text-sm text-ink-muted">
        Unknown app.
      </div>
    );
  }
  return (
    <StandaloneFrame name={def.name} backHref={def.href}>
      {def.render()}
    </StandaloneFrame>
  );
}
