"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import Logo from "@/components/ops/Logo";
import MobileNav from "@/components/ops/MobileNav";
import Pill from "@/components/ops/ui/Pill";
import { cn } from "@/lib/ops/cn";
import { navItemsForRole, type NavItem } from "@/lib/ops/nav";
import type { UserRole } from "@/types/ops";

type OpsShellUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type OpsShellProps = {
  user: OpsShellUser;
  children: ReactNode;
};

const ROLE_TONE: Record<UserRole, "ink" | "success" | "info"> = {
  admin: "ink",
  ops: "success",
  bd: "info",
};

/**
 * Persistent chrome for every /indaba/* page once a user is signed in.
 *
 * Responsibilities:
 *   - Branded header (deep-green bar with ZimX wordmark + role pill + sign-out)
 *   - Role-filtered primary nav (desktop: horizontal tabs; mobile: drawer)
 *   - Neutral offwhite content surface so module UIs render on a light canvas
 *     regardless of the root dark `bg-ink` body background
 */
export default function OpsShell({ user, children }: OpsShellProps) {
  const pathname = usePathname();
  const items = navItemsForRole(user.role);

  return (
    <div className="min-h-screen bg-zimx-offwhite text-zimx-black">
      <header className="sticky top-0 z-30 bg-zimx-green-deep text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/indaba/dashboard" className="flex items-center gap-3">
            <Logo size="sm" variant="light" glyphOnly />
            <span className="flex flex-col leading-none">
              <span className="font-mono text-[14px] font-light uppercase tracking-[2px] text-white">
                indaba
              </span>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-tag text-white/60">
                zimx bulawayo ops
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <span className="font-mono text-[11px] uppercase tracking-tag text-white/70">
                {user.name}
              </span>
              <Pill
                tone={ROLE_TONE[user.role]}
                size="sm"
                className="border-white/30 bg-white/10 text-white"
              >
                {user.role}
              </Pill>
            </div>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex items-center border border-white/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-button text-white/80 transition-colors hover:border-white hover:bg-white hover:text-zimx-black"
              >
                Sign out
              </button>
            </form>

            <div className="md:hidden">
              <MobileNav user={user} items={items} activePath={pathname} />
            </div>
          </div>
        </div>

        <nav
          aria-label="Primary"
          className="hidden border-t border-white/10 md:block"
        >
          <div className="mx-auto max-w-7xl px-4">
            <ul className="flex items-center gap-1 overflow-x-auto">
              {items.map((item) => (
                <NavTab
                  key={item.href}
                  item={item}
                  active={isActive(pathname, item.href)}
                />
              ))}
            </ul>
          </div>
        </nav>
      </header>

      <main className="mx-auto min-h-[calc(100vh-120px)] max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}

function NavTab({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "inline-flex items-center whitespace-nowrap border-b-2 px-3 py-3 font-mono text-[12px] uppercase tracking-button transition-colors",
          active
            ? "border-zimx-gold text-white"
            : "border-transparent text-white/60 hover:text-white",
        )}
      >
        {item.label}
      </Link>
    </li>
  );
}

/**
 * Exported so MobileNav can reuse the exact same matching rule.
 * A tab is active when the current pathname equals or is nested under its href.
 */
export function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}
