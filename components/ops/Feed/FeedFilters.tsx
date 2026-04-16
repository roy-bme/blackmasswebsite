"use client";

import { cn } from "@/lib/ops/cn";

import type { ChannelFilter } from "./types";

type FeedFiltersProps = {
  value: ChannelFilter;
  onChange: (next: ChannelFilter) => void;
};

const CHIPS: Array<{ value: ChannelFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "ground_ops", label: "Ground ops" },
  { value: "bd_networking", label: "BD & networking" },
];

export default function FeedFilters({ value, onChange }: FeedFiltersProps) {
  return (
    <div
      className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:overflow-visible md:px-0"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="flex min-w-max gap-2 md:flex-wrap">
        {CHIPS.map((c) => {
          const active = value === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange(c.value)}
              aria-pressed={active}
              className={cn(
                "whitespace-nowrap border px-3 py-1.5 font-mono text-[11px] uppercase tracking-tag transition-colors",
                active
                  ? "border-zimx-green bg-zimx-green text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zimx-black",
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
