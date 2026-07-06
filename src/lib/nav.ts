import {
  Compass,
  Hexagon,
  LayoutGrid,
  Database,
  List,
  Activity,
  Terminal,
  CreditCard,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavChild = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
  badge?: string;
  /** match nested routes for active state */
  match?: (path: string) => boolean;
};

export const workNav: NavItem[] = [
  { label: "Ask", href: "/", icon: Compass, match: (p) => p === "/" },
  { label: "Explore", href: "/explore", icon: Hexagon, match: (p) => p.startsWith("/explore") },
  { label: "Apps", href: "/apps", icon: LayoutGrid, match: (p) => p.startsWith("/apps") },
  { label: "Catalog", href: "/catalog", icon: Database, match: (p) => p.startsWith("/catalog") },
  { label: "Lists & Enrich", href: "/lists", icon: List, match: (p) => p.startsWith("/lists") },
  { label: "Activity", href: "/activity", icon: Activity, match: (p) => p.startsWith("/activity") },
];

export const accountNav: NavItem[] = [
  { label: "Developers", href: "/developers", icon: Terminal, match: (p) => p.startsWith("/developers") },
  { label: "Billing", href: "/billing", icon: CreditCard, match: (p) => p.startsWith("/billing") },
  { label: "Settings", href: "/settings", icon: Settings, match: (p) => p.startsWith("/settings") },
];

/** Flat list for the ⌘K command menu. */
export const allNav = [...workNav, ...accountNav].flatMap((n) =>
  n.children ? [n, ...n.children] : [n]
);
