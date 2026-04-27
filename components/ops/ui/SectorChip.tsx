"use client";

import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/ops/cn";
import type { SectorKey } from "@/lib/ops/sector-colors";

import SectorDot from "./SectorDot";

type SectorChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  sector: SectorKey | string;
  active?: boolean;
};

/**
 * Toggleable sector filter chip — sits in the Map / Directory header rows.
 * Active state shows a brighter border + tinted background.
 */
export default function SectorChip({
  sector,
  active,
  className,
  ...rest
}: SectorChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] uppercase tracking-eyebrow",
        "border transition-colors",
        active
          ? "border-line-30 bg-white/[0.06] text-white"
          : "border-line-15 bg-transparent text-fg-mute hover:border-line-30 hover:text-white",
        className,
      )}
      {...rest}
    >
      <SectorDot sector={sector} />
      <span>{sector}</span>
    </button>
  );
}
