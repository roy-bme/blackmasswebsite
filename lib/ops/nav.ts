import type { UserRole } from "@/types/ops";

/**
 * Single source of truth for the indaba portal nav.
 *
 * Every nav item declares which roles may see it. `OpsShell` and `MobileNav`
 * both filter through `navItemsForRole`, and each module page re-uses the
 * same list to enforce access on the server. Keep labels short — they sit
 * in a tight horizontal tab bar on desktop.
 */

export type NavItem = {
  href: string;
  label: string;
  roles: UserRole[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/indaba/dashboard",
    label: "Dashboard",
    roles: ["admin", "ops", "bd"],
  },
  {
    href: "/indaba/map",
    label: "Map",
    roles: ["admin", "ops", "bd"],
  },
  {
    href: "/indaba/directory",
    label: "Directory",
    roles: ["admin", "ops"],
  },
  {
    href: "/indaba/graph",
    label: "Supply chain",
    roles: ["admin", "ops"],
  },
  {
    href: "/indaba/intros",
    label: "Introductions",
    roles: ["admin", "bd"],
  },
  {
    href: "/indaba/events",
    label: "Events",
    roles: ["admin", "bd"],
  },
  {
    href: "/indaba/feed",
    label: "Ops feed",
    roles: ["admin", "ops", "bd"],
  },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

/**
 * True if the given role may visit `href`. Used by module pages to gate
 * themselves server-side (middleware only enforces authentication, not
 * role membership).
 */
export function canAccess(role: UserRole, href: string): boolean {
  const item = NAV_ITEMS.find((i) => i.href === href);
  return item ? item.roles.includes(role) : false;
}
