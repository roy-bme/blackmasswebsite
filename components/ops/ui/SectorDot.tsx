import type { HTMLAttributes } from "react";

import { cn } from "@/lib/ops/cn";
import { getSectorTheme, type SectorKey } from "@/lib/ops/sector-colors";

type SectorDotProps = HTMLAttributes<HTMLSpanElement> & {
  sector: SectorKey | string;
  /** Pixel size of the square dot. Defaults to 8 (matches the design canvas). */
  size?: number;
};

/**
 * Small square sector marker. Matches the sector colour map in
 * `lib/ops/sector-colors.ts` so the same key resolves consistently across map
 * markers, business cards, and chips.
 */
export default function SectorDot({
  sector,
  size = 8,
  className,
  style,
  ...rest
}: SectorDotProps) {
  const theme = getSectorTheme(sector);
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 rounded-none", className)}
      style={{
        width: size,
        height: size,
        background: theme.hex,
        ...style,
      }}
      {...rest}
    />
  );
}
