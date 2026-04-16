"use client";

import Input from "@/components/ops/ui/Input";
import Select from "@/components/ops/ui/Select";
import { cn } from "@/lib/ops/cn";
import { SECTOR_LIST } from "@/lib/ops/sector-colors";

import type { DirectoryZone } from "./types";

export type ChipFilter =
  | "all"
  | "launch6"
  | "formal"
  | "informal"
  | "incomplete";

const CHIPS: Array<{ value: ChipFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "launch6", label: "Launch 6" },
  { value: "formal", label: "Formal" },
  { value: "informal", label: "Informal" },
  { value: "incomplete", label: "Incomplete" },
];

type DirectoryFiltersProps = {
  chip: ChipFilter;
  sector: string;
  zoneId: string;
  search: string;
  zones: DirectoryZone[];
  onChip: (chip: ChipFilter) => void;
  onSector: (sector: string) => void;
  onZone: (zoneId: string) => void;
  onSearch: (search: string) => void;
};

export default function DirectoryFilters({
  chip,
  sector,
  zoneId,
  search,
  zones,
  onChip,
  onSector,
  onZone,
  onSearch,
}: DirectoryFiltersProps) {
  const sectorOptions = SECTOR_LIST.filter((s) => s.key !== "contact").map(
    (s) => ({ label: s.label, value: s.key }),
  );
  const zoneOptions = zones.map((z) => ({ label: z.name, value: z.id }));

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div
        className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:overflow-visible md:px-0"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex min-w-max gap-2 md:flex-wrap">
          {CHIPS.map((c) => {
            const isActive = chip === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => onChip(c.value)}
                aria-pressed={isActive}
                className={cn(
                  "whitespace-nowrap border px-3 py-1.5 font-mono text-[11px] uppercase tracking-tag transition-colors",
                  isActive
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

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Select
          name="sector"
          value={sector}
          onChange={(e) => onSector(e.target.value)}
          options={[{ label: "All sectors", value: "" }, ...sectorOptions]}
          aria-label="Sector"
        />
        <Select
          name="zone"
          value={zoneId}
          onChange={(e) => onZone(e.target.value)}
          options={[{ label: "All zones", value: "" }, ...zoneOptions]}
          aria-label="Zone"
        />
        <Input
          name="search"
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search businesses"
          aria-label="Search businesses"
        />
      </div>
    </div>
  );
}
