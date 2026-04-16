"use client";

import { cn } from "@/lib/ops/cn";

import type { StatusFilter, WarmthFilter } from "./types";

type IntroFiltersProps = {
  status: StatusFilter;
  warmth: WarmthFilter;
  onStatus: (status: StatusFilter) => void;
  onWarmth: (warmth: WarmthFilter) => void;
};

const STATUS_CHIPS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending_approval", label: "Pending approval" },
  { value: "approved", label: "Approved" },
  { value: "contacted", label: "Contacted" },
  { value: "meeting_set", label: "Meeting set" },
];

const WARMTH_CHIPS: Array<{ value: WarmthFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "cold", label: "Cold" },
  { value: "warm", label: "Warm" },
  { value: "hot", label: "Hot" },
];

export default function IntroFilters({
  status,
  warmth,
  onStatus,
  onWarmth,
}: IntroFiltersProps) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <ChipRow
        label="Status"
        items={STATUS_CHIPS.map((c) => ({
          value: c.value,
          label: c.label,
          active: status === c.value,
          onClick: () => onStatus(c.value),
        }))}
      />
      <ChipRow
        label="Warmth"
        items={WARMTH_CHIPS.map((c) => ({
          value: c.value,
          label: c.label,
          active: warmth === c.value,
          onClick: () => onWarmth(c.value),
        }))}
      />
    </div>
  );
}

type ChipItem = {
  value: string;
  label: string;
  active: boolean;
  onClick: () => void;
};

function ChipRow({ label, items }: { label: string; items: ChipItem[] }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
        {label}
      </p>
      <div
        className="-mx-4 mt-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:overflow-visible md:px-0"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex min-w-max gap-2 md:flex-wrap">
          {items.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={c.onClick}
              aria-pressed={c.active}
              className={cn(
                "whitespace-nowrap border px-3 py-1.5 font-mono text-[11px] uppercase tracking-tag transition-colors",
                c.active
                  ? "border-zimx-green bg-zimx-green text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zimx-black",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
