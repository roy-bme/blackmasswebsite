"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import Avatar from "@/components/ops/ui/Avatar";
import Eyebrow from "@/components/ops/ui/Eyebrow";
import IndabaLogo from "@/components/ops/ui/IndabaLogo";
import Pill from "@/components/ops/ui/Pill";
import NavIcon from "@/components/ops/NavIcon";
import { cn } from "@/lib/ops/cn";
import {
  mobileTabsForRole,
  navItemsForRole,
  type NavBadge,
  type NavItem,
} from "@/lib/ops/nav";
import type { UserRole } from "@/types/ops";

type OpsShellUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type OpsShellProps = {
  user: OpsShellUser;
  /** Optional badge counts per nav id (e.g. unread feed, open compliance). */
  badges?: NavBadge;
  children: ReactNode;
};

/**
 * Persistent chrome for every /indaba/* page once a user is signed in.
 *
 * Mobile: status-bar-safe header + bottom tab strip (max 5 tabs per role).
 * Desktop: 224px left rail + thin breadcrumb header. Both surfaces share the
 * `navItemsForRole` filter so labels and gates can't drift.
 */
export default function OpsShell({ user, badges, children }: OpsShellProps) {
  const pathname = usePathname();
  const railItems = navItemsForRole(user.role);
  const tabItems = mobileTabsForRole(user.role);

  const breadcrumb = breadcrumbFor(pathname);

  return (
    <div className="min-h-screen bg-ink-700 text-white">
      {/* Mobile header — sits above the page. The status-bar safe area is
          covered by the parent body's env(safe-area-inset-top) padding. */}
      <header className="md:hidden sticky top-0 z-30 border-b border-line-10 bg-ink-700/95 backdrop-blur supports-[backdrop-filter]:bg-ink-700/80">
        <div className="flex items-center justify-between px-4 py-3">
          <IndabaLogo size={18} />
          <div className="flex items-center gap-3">
            <Pill tone="gold" size="sm">
              {user.role}
            </Pill>
            <Avatar name={user.name} size="sm" />
          </div>
        </div>
      </header>

      <div className="md:flex md:min-h-screen">
        {/* Desktop left rail */}
        <aside className="hidden md:flex md:w-[224px] md:shrink-0 md:flex-col md:border-r md:border-line-10 md:bg-ink-800">
          <div className="border-b border-line-10 px-5 py-5">
            <IndabaLogo size={18} />
          </div>
          <nav aria-label="Primary" className="flex-1 px-3 py-3">
            <Eyebrow className="px-2 py-2">navigate</Eyebrow>
            <ul>
              {railItems
                .filter((item) => item.id !== "settings")
                .map((item) => (
                  <li key={item.id}>
                    <RailLink
                      item={item}
                      active={isActive(pathname, item.href)}
                      badge={badges?.[item.id]}
                    />
                  </li>
                ))}
            </ul>
          </nav>
          <div className="border-t border-line-10 px-3 py-3">
            <RailLink
              item={
                railItems.find((i) => i.id === "settings") ?? {
                  id: "settings",
                  href: "/indaba/settings",
                  label: "Settings",
                  icon: "settings",
                  roles: [],
                  mobileRoles: [],
                }
              }
              active={isActive(pathname, "/indaba/settings")}
            />
            <form action="/auth/signout" method="post" className="mt-1 px-3">
              <button
                type="submit"
                className="w-full text-left font-mono text-[11px] uppercase tracking-eyebrow text-fg-mute transition-colors hover:text-status-bad"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Desktop breadcrumb header */}
          <header className="hidden h-14 shrink-0 items-center justify-between border-b border-line-10 px-6 md:flex">
            <div className="font-mono text-[11px] uppercase tracking-eyebrow text-fg-mute">
              {breadcrumb.map((c, i) => (
                <span key={c}>
                  {i > 0 ? (
                    <span className="mx-2 text-fg-dim">/</span>
                  ) : null}
                  <span
                    className={
                      i === breadcrumb.length - 1 ? "text-white" : "text-fg-mute"
                    }
                  >
                    {c}
                  </span>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-eyebrow text-fg-mute">
                {user.name}
              </span>
              <Pill tone="gold" size="sm">
                {user.role}
              </Pill>
              <Avatar name={user.name} size="sm" />
            </div>
          </header>

          <main className="min-w-0 flex-1 pb-24 md:pb-0">{children}</main>
        </div>
      </div>

      {/* Mobile bottom tab strip */}
      {tabItems.length > 0 ? (
        <nav
          aria-label="Primary"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-line-10 bg-ink-700/95 backdrop-blur supports-[backdrop-filter]:bg-ink-700/80"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul
            className="grid"
            style={{ gridTemplateColumns: `repeat(${tabItems.length}, 1fr)` }}
          >
            {tabItems.map((item) => (
              <li key={item.id}>
                <TabLink
                  item={item}
                  active={isActive(pathname, item.href)}
                  badge={badges?.[item.id]}
                />
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}

function RailLink({
  item,
  active,
  badge,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5",
        "border-l-2 transition-colors",
        active
          ? "border-l-zimx-gold bg-zimx-gold/[0.08] text-white"
          : "border-l-transparent text-fg-mute hover:text-white",
      )}
    >
      <NavIcon id={item.icon} />
      <span className="font-mono text-[11px] uppercase tracking-eyebrow">
        {item.label}
      </span>
      {badge && badge > 0 ? (
        <Pill
          tone={item.id === "compliance" ? "bad" : "gold"}
          size="sm"
          className="ml-auto"
        >
          {badge}
        </Pill>
      ) : null}
    </Link>
  );
}

function TabLink({
  item,
  active,
  badge,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center gap-1 py-2.5",
        active ? "text-white" : "text-fg-dim",
      )}
    >
      <span className="relative">
        <NavIcon id={item.icon} />
        {badge && badge > 0 ? (
          <span className="absolute -right-2 -top-1 bg-zimx-gold px-1 font-mono text-[9px] font-bold text-[#1a1612]">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-eyebrow">
        {item.label}
      </span>
    </Link>
  );
}

export function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  map: "Map",
  directory: "Directory",
  graph: "Graph",
  intros: "Intros",
  events: "Events",
  compliance: "Compliance",
  agent: "Agent",
  feed: "Feed",
  settings: "Settings",
};

function breadcrumbFor(pathname: string | null): string[] {
  const crumbs = ["Indaba"];
  if (!pathname) return crumbs;
  const segments = pathname.split("/").filter(Boolean);
  // Skip the leading "indaba" segment.
  for (const seg of segments.slice(1)) {
    crumbs.push(BREADCRUMB_LABELS[seg] ?? seg);
  }
  return crumbs;
}
