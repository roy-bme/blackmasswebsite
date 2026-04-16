"use client";

import { cn } from "@/lib/ops/cn";

export type MapFilter =
  | "all"
  | "wholesale"
  | "fmcg"
  | "distribution"
  | "manufacturing"
  | "agriculture"
  | "fuel"
  | "hardware"
  | "contacts";

type MapFiltersProps = {
  active: MapFilter;
  onChange: (filter: MapFilter) => void;
  canSeeContacts: boolean;
};

const SECTOR_CHIPS: Array<{ value: MapFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "wholesale", label: "Wholesale" },
  { value: "fmcg", label: "FMCG" },
  { value: "distribution", label: "Distribution" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "agriculture", label: "Agriculture" },
  { value: "fuel", label: "Fuel" },
  { value: "hardware", label: "Hardware" },
];

export default function MapFilters({
  active,
  onChange,
  canSeeContacts,
}: MapFiltersProps) {
  const chips = canSeeContacts
    ? [...SECTOR_CHIPS, { value: "contacts" as MapFilter, label: "Contacts" }]
    : SECTOR_CHIPS;

  return (
    <div
      className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:overflow-visible md:px-0"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="flex min-w-max gap-2 md:flex-wrap">
        {chips.map((chip) => {
          const isActive = active === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onChange(chip.value)}
              aria-pressed={isActive}
              className={cn(
                "whitespace-nowrap border px-3 py-1.5 font-mono text-[11px] uppercase tracking-tag transition-colors",
                isActive
                  ? "border-zimx-green bg-zimx-green text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zimx-black",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
