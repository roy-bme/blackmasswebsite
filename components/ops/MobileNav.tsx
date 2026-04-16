"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Dialog from "@/components/ops/ui/Dialog";
import Pill from "@/components/ops/ui/Pill";
import { cn } from "@/lib/ops/cn";
import type { NavItem } from "@/lib/ops/nav";
import type { UserRole } from "@/types/ops";

import { isActive } from "./OpsShell";

type MobileNavProps = {
  user: { name: string; role: UserRole };
  items: NavItem[];
  activePath: string | null;
};

const ROLE_TONE: Record<UserRole, "ink" | "success" | "info"> = {
  admin: "ink",
  ops: "success",
  bd: "info",
};

/**
 * Hamburger trigger + Dialog drawer used on <768px. Opens a full-list nav
 * matching the desktop tab order, already filtered by role.
 */
export default function MobileNav({ user, items, activePath }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Auto-close when the route changes (Link click triggers navigation).
  useEffect(() => {
    setOpen(false);
  }, [activePath]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center border border-white/40 text-white/80 transition-colors hover:border-white hover:bg-white hover:text-zimx-black"
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        ariaLabel="Primary navigation"
      >
        <Dialog.Header>
          <div className="flex flex-col gap-1">
            <Dialog.Title>Navigation</Dialog.Title>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
                {user.name}
              </span>
              <Pill tone={ROLE_TONE[user.role]} size="sm">
                {user.role}
              </Pill>
            </div>
          </div>
          <Dialog.CloseButton onClose={() => setOpen(false)} />
        </Dialog.Header>
        <Dialog.Body className="p-0">
          <ul className="divide-y divide-zinc-200">
            {items.map((item) => {
              const active = isActive(activePath, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-6 py-4 font-mono text-[13px] uppercase tracking-button transition-colors",
                      active
                        ? "bg-zimx-green-deep text-white"
                        : "text-zimx-black hover:bg-zimx-offwhite",
                    )}
                  >
                    <span>{item.label}</span>
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="inline-block h-1.5 w-1.5 bg-zimx-gold"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Dialog.Body>
      </Dialog>
    </>
  );
}
