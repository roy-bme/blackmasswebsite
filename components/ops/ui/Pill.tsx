import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/ops/cn";
import { getSectorTheme, type SectorKey } from "@/lib/ops/sector-colors";

export type PillTone =
  | "neutral"
  | "gold"
  | "ok"
  | "warn"
  | "bad"
  | "info"
  | "solid"
  // Legacy aliases — older marketing surfaces still use the named tones.
  | "ink"
  | "success"
  | "warning"
  | "danger";

export type PillSize = "sm" | "md";

const TONES: Record<PillTone, string> = {
  neutral: "bg-white/[0.06] text-white/[0.78] border-line-15",
  gold: "bg-zimx-gold/10 text-zimx-gold border-zimx-gold/35",
  ok: "bg-status-ok/10 text-status-ok border-status-ok/30",
  warn: "bg-status-warn/10 text-status-warn border-status-warn/30",
  bad: "bg-status-bad/10 text-status-bad border-status-bad/30",
  info: "bg-status-info/10 text-status-info border-status-info/30",
  solid: "bg-white text-ink-700 border-white",
  // Legacy aliases.
  ink: "bg-ink-600 text-white border-ink-600",
  success: "bg-status-ok/10 text-status-ok border-status-ok/30",
  warning: "bg-status-warn/10 text-status-warn border-status-warn/30",
  danger: "bg-status-bad/10 text-status-bad border-status-bad/30",
};

const TONES_STRONG: Record<PillTone, string> = {
  neutral: "bg-white/30 text-white border-white/30",
  gold: "bg-zimx-gold text-[#1a1612] border-zimx-gold",
  ok: "bg-status-ok text-ink-900 border-status-ok",
  warn: "bg-status-warn text-ink-900 border-status-warn",
  bad: "bg-status-bad text-white border-status-bad",
  info: "bg-status-info text-white border-status-info",
  solid: "bg-white text-ink-700 border-white",
  ink: "bg-ink-600 text-white border-ink-600",
  success: "bg-status-ok text-ink-900 border-status-ok",
  warning: "bg-status-warn text-ink-900 border-status-warn",
  danger: "bg-status-bad text-white border-status-bad",
};

const SIZES: Record<PillSize, string> = {
  sm: "px-1.5 py-0.5 text-[9px]",
  md: "px-2 py-[3px] text-[10px]",
};

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: PillTone;
  size?: PillSize;
  /** Solid (filled) variant — used for high-contrast "L6" / "target" tags. */
  strong?: boolean;
  /** When set, overrides `tone` with the sector's accent palette. */
  sector?: SectorKey;
  leadingDot?: boolean;
  children: ReactNode;
};

/**
 * Square-cornered status pill. Mono-uppercase by default, sized to sit on a
 * 24px row. Use `tone` for state and `sector` for one of the six Bulawayo
 * categories.
 */
export default function Pill({
  tone = "neutral",
  size = "md",
  strong,
  sector,
  leadingDot,
  className,
  children,
  ...rest
}: PillProps) {
  const sectorTheme = sector ? getSectorTheme(sector) : null;
  const showDot = leadingDot ?? Boolean(sector);
  const palette = strong ? TONES_STRONG[tone] : TONES[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border font-mono uppercase tracking-eyebrow",
        sectorTheme
          ? cn(
              "bg-white/[0.06]",
              sectorTheme.textClass,
              "border-line-15",
            )
          : palette,
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
