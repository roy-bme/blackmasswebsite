import type { ReactNode } from "react";

import type { UserRole } from "@/types/ops";

/**
 * Single source of truth for the indaba portal nav.
 *
 * Each entry declares which roles may see it and a stable `id` used both for
 * the desktop left rail and the mobile bottom tab bar. `OpsShell` and the
 * server-side `requireModuleAccess` helper both filter through the same list
 * so labels, hrefs, and gates can't drift apart.
 */

export type NavId =
  | "dashboard"
  | "map"
  | "directory"
  | "graph"
  | "intros"
  | "events"
  | "compliance"
  | "agent"
  | "feed"
  | "settings";

export type NavItem = {
  id: NavId;
  href: string;
  label: string;
  /** Lucide-style icon path key (resolved by OpsShell). */
  icon: NavId;
  roles: UserRole[];
  /** Roles that should see this in the mobile bottom-tab strip (max 5). */
  mobileRoles: UserRole[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    href: "/indaba/dashboard",
    label: "Dashboard",
    icon: "dashboard",
    roles: ["admin", "ops", "bd", "compliance"],
    mobileRoles: ["admin", "ops", "bd", "compliance"],
  },
  {
    id: "map",
    href: "/indaba/map",
    label: "Map",
    icon: "map",
    roles: ["admin", "ops"],
    mobileRoles: ["admin", "ops"],
  },
  {
    id: "directory",
    href: "/indaba/directory",
    label: "Directory",
    icon: "directory",
    roles: ["admin", "ops", "bd"],
    mobileRoles: ["admin", "ops", "bd"],
  },
  {
    id: "graph",
    href: "/indaba/graph",
    label: "Graph",
    icon: "graph",
    roles: ["admin"],
    mobileRoles: [],
  },
  {
    id: "intros",
    href: "/indaba/intros",
    label: "Intros",
    icon: "intros",
    roles: ["admin", "bd"],
    mobileRoles: ["admin", "bd"],
  },
  {
    id: "events",
    href: "/indaba/events",
    label: "Events",
    icon: "events",
    roles: ["admin", "bd"],
    mobileRoles: ["bd"],
  },
  {
    id: "compliance",
    href: "/indaba/compliance",
    label: "Compliance",
    icon: "compliance",
    roles: ["admin", "compliance"],
    mobileRoles: ["compliance"],
  },
  {
    id: "agent",
    href: "/indaba/agent",
    label: "Agent",
    icon: "agent",
    roles: ["admin", "compliance"],
    mobileRoles: ["compliance"],
  },
  {
    id: "feed",
    href: "/indaba/feed",
    label: "Feed",
    icon: "feed",
    roles: ["admin", "ops", "bd", "compliance"],
    mobileRoles: ["admin", "ops", "bd", "compliance"],
  },
  {
    id: "settings",
    href: "/indaba/settings",
    label: "Settings",
    icon: "settings",
    roles: ["admin", "ops", "bd", "compliance"],
    mobileRoles: [],
  },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

/**
 * Mobile bottom-tab strip — capped at 5 entries per role. The list comes from
 * the design canvas (each role's PhoneTabs in `screens/dashboards.jsx`).
 */
export function mobileTabsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.mobileRoles.includes(role)).slice(0, 5);
}

/** True if the given role may visit `href`. */
export function canAccess(role: UserRole, href: string): boolean {
  const item = NAV_ITEMS.find((i) => i.href === href);
  return item ? item.roles.includes(role) : false;
}

export type NavBadge = {
  /** Map of nav id -> badge count (e.g. unread feed posts, queued flags). */
  [K in NavId]?: number;
};

// Re-export ReactNode so consumers can keep `import type { ReactNode }` simple.
export type { ReactNode };
