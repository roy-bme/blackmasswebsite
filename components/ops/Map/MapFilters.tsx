"use client";

import { cn } from "@/lib/ops/cn";

export type MapFilter =
  | "all"
  | "mining"
  | "manufacturing"
  | "retail"
  | "services"
  | "agriculture"
  | "fuel"
  | "wholesale"
  | "fmcg"
  | "distribution"
  | "hardware"
  | "contacts";

type MapFiltersProps = {
  active: MapFilter;
  onChange: (filter: MapFilter) => void;
  canSeeContacts: boolean;
};

const SECTOR_CHIPS: Array<{ value: MapFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "mining", label: "Mining" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "services", label: "Services" },
  { value: "agriculture", label: "Agriculture" },
  { value: "fuel", label: "Fuel" },
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
                "whitespace-nowrap border px-3 py-1.5 font-mono text-[11px] uppercase tracking-eyebrow transition-colors",
                isActive
                  ? "border-zimx-gold bg-zimx-gold/10 text-zimx-gold"
                  : "border-line-15 bg-transparent text-fg-mute hover:border-line-30 hover:text-white",
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
