"use client";

import { useMemo } from "react";

import EmptyState from "@/components/ops/ui/EmptyState";
import Pill from "@/components/ops/ui/Pill";
import { getSectorTheme } from "@/lib/ops/sector-colors";

import { STAGE_LABELS, type DirectoryBusiness } from "./types";

type BusinessListProps = {
  businesses: DirectoryBusiness[];
  onOpen: (id: string) => void;
};

function truncate(text: string | null, max: number): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default function BusinessList({
  businesses,
  onOpen,
}: BusinessListProps) {
  const sorted = useMemo(() => {
    return [...businesses].sort((a, b) => {
      if (a.launch_6 !== b.launch_6) return a.launch_6 ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [businesses]);

  if (sorted.length === 0) {
    return (
      <EmptyState
        eyebrow="Directory"
        title="No businesses match"
        description="Clear the filters or broaden the search to see more results."
      />
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 border border-zinc-200 bg-white">
      {sorted.map((b) => {
        const sectorTheme = getSectorTheme(b.sector);
        const zone = b.zone_name ?? "—";
        const volume =
          b.est_monthly_volume != null
            ? `$${Number(b.est_monthly_volume).toLocaleString()}/mo`
            : "Volume n/a";
        return (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => onOpen(b.id)}
              className="group flex w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-zimx-offwhite focus:bg-zimx-offwhite focus:outline-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[14px] font-medium text-zimx-black">
                    {b.name}
                  </p>
                  {b.launch_6 ? (
                    <Pill tone="warning" size="sm">
                      Launch 6
                    </Pill>
                  ) : null}
                </div>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-tag text-zinc-500">
                  <span style={{ color: sectorTheme.hex }}>
                    {sectorTheme.label}
                  </span>
                  {" \u00B7 "}
                  {zone}
                  {" \u00B7 "}
                  {volume}
                </p>
                {b.notes ? (
                  <p className="mt-1 text-[13px] text-zinc-500">
                    {truncate(b.notes, 140)}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Pill tone="neutral" size="sm">
                  {STAGE_LABELS[b.onboarding_stage]}
                </Pill>
                <span className="font-mono text-[11px] uppercase tracking-tag text-zinc-500">
                  {b.zimx_fit_score != null
                    ? `\u2605 ${b.zimx_fit_score}/5`
                    : "\u2606 —/5"}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
