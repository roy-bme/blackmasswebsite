import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/ops/cn";
import { getSectorTheme, type SectorKey } from "@/lib/ops/sector-colors";

export type PillTone =
  | "neutral"
  | "ink"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type PillSize = "sm" | "md";

const TONES: Record<PillTone, string> = {
  neutral: "bg-zimx-offwhite text-zimx-slate border-zimx-line",
  ink: "bg-zimx-ink text-white border-zimx-ink",
  success: "bg-sector-ai/10 text-sector-ai border-sector-ai/30",
  warning: "bg-sector-assets/15 text-zimx-ink border-sector-assets/40",
  danger: "bg-sector-music/10 text-sector-music border-sector-music/30",
  info: "bg-sector-fintech/10 text-sector-fintech border-sector-fintech/30",
};

const SIZES: Record<PillSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-[11px]",
};

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: PillTone;
  size?: PillSize;
  /** When set, overrides `tone` with the sector's accent palette. */
  sector?: SectorKey;
  leadingDot?: boolean;
  children: ReactNode;
};

/**
 * Square-cornered status / category pill.
 *
 * Use `tone` for generic states (success / warning / danger / info / neutral)
 * and `sector` when the pill represents a specific Blackmass venture sector.
 * The leading dot is on by default for sector pills, off by default otherwise.
 */
export default function Pill({
  tone = "neutral",
  size = "md",
  sector,
  leadingDot,
  className,
  children,
  ...rest
}: PillProps) {
  const sectorTheme = sector ? getSectorTheme(sector) : null;
  const showDot = leadingDot ?? Boolean(sector);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border font-mono uppercase tracking-tag",
        sectorTheme
          ? cn(sectorTheme.softBgClass, sectorTheme.textClass, sectorTheme.borderClass + "/30")
          : TONES[tone],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {showDot ? (
        <span
          aria-hidden="true"
          className={cn(
            "inline-block h-1.5 w-1.5",
            sectorTheme ? sectorTheme.bgClass : "bg-current",
          )}
        />
      ) : null}
      <span className="leading-none">{children}</span>
    </span>
  );
}
