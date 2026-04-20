"use client";

import Input from "@/components/ops/ui/Input";
import Select from "@/components/ops/ui/Select";
import { cn } from "@/lib/ops/cn";
import { SECTOR_LIST, type SectorKey } from "@/lib/ops/sector-colors";

import type { DirectoryZone } from "./types";

export type DirectoryFilterState = {
  /** Empty string means "all sectors". */
  sector: SectorKey | "";
  /** Empty string means "all zones". */
  zoneId: string;
  launch6: boolean;
  search: string;
};

export const EMPTY_FILTERS: DirectoryFilterState = {
  sector: "",
  zoneId: "",
  launch6: false,
  search: "",
};

const SECTOR_CHIPS: Array<{ value: DirectoryFilterState["sector"]; label: string }> =
  [
    { value: "", label: "All" },
    ...SECTOR_LIST.filter((s) => s.key !== "contact").map((s) => ({
      value: s.key,
      label: s.label,
    })),
  ];

type DirectoryFiltersProps = {
  filters: DirectoryFilterState;
  zones: DirectoryZone[];
  onChange: (patch: Partial<DirectoryFilterState>) => void;
};

export default function DirectoryFilters({
  filters,
  zones,
  onChange,
}: DirectoryFiltersProps) {
  const zoneOptions = zones.map((z) => ({ label: z.name, value: z.id }));

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div
        className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:overflow-visible md:px-0"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex min-w-max gap-2 md:flex-wrap">
          {SECTOR_CHIPS.map((chip) => {
            const isActive = filters.sector === chip.value;
            return (
              <button
                key={chip.value || "all"}
                type="button"
                onClick={() => onChange({ sector: chip.value })}
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
          <button
            type="button"
            onClick={() => onChange({ launch6: !filters.launch6 })}
            aria-pressed={filters.launch6}
            className={cn(
              "whitespace-nowrap border px-3 py-1.5 font-mono text-[11px] uppercase tracking-tag transition-colors",
              filters.launch6
                ? "border-zimx-gold bg-zimx-gold text-zimx-black"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zimx-black",
            )}
          >
            {"\u2605 Launch 6"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select
          name="zone"
          value={filters.zoneId}
          onChange={(e) => onChange({ zoneId: e.target.value })}
          options={[{ label: "All zones", value: "" }, ...zoneOptions]}
          aria-label="Zone"
        />
        <Input
          name="search"
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search businesses"
          aria-label="Search businesses"
        />
      </div>
    </div>
  );
}
