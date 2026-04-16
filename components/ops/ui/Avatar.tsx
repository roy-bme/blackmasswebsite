/* eslint-disable @next/next/no-img-element */
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/ops/cn";
import { SECTORS } from "@/lib/ops/sector-colors";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: Record<AvatarSize, { box: string; text: string; px: number }> = {
  xs: { box: "h-6 w-6", text: "text-[10px]", px: 24 },
  sm: { box: "h-8 w-8", text: "text-[11px]", px: 32 },
  md: { box: "h-10 w-10", text: "text-[12px]", px: 40 },
  lg: { box: "h-14 w-14", text: "text-[14px]", px: 56 },
  xl: { box: "h-20 w-20", text: "text-[18px]", px: 80 },
};

type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  /** URL for the user's avatar. Falls back to initials when missing. */
  src?: string | null;
  /** Used for both the alt text and initials fallback. */
  name: string;
  size?: AvatarSize;
  /** Optional online/offline-style status dot in the bottom-right corner. */
  status?: "online" | "away" | "offline";
};

const STATUS_COLOURS: Record<NonNullable<AvatarProps["status"]>, string> = {
  online: "bg-zimx-green",
  away: "bg-zimx-gold",
  offline: "bg-zinc-400",
};

/**
 * Compute up to two initials from a name. Falls back to "?" for empty input.
 *
 *   "Roy Mukucha"     -> "RM"
 *   "roy@zimx.finance" -> "R"
 *   ""                 -> "?"
 */
function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase();
  }
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

/**
 * Pick a deterministic background tint based on the name string so that the
 * same person always renders with the same fallback colour. Uses the
 * eight-sector palette to stay visually consistent with the rest of the
 * portal.
 */
const FALLBACK_TINTS = SECTORS.map(
  (label) => `bg-sector-${label.toLowerCase()} text-white`,
);

function pickTint(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_TINTS[hash % FALLBACK_TINTS.length]!;
}

export default function Avatar({
  src,
  name,
  size = "md",
  status,
  className,
  ...rest
}: AvatarProps) {
  const dims = SIZES[size];
  const initials = getInitials(name);
  const tint = pickTint(name || "anon");

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-zinc-200",
        dims.box,
        className,
      )}
      {...rest}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          width={dims.px}
          height={dims.px}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          aria-label={name}
          className={cn(
            "flex h-full w-full items-center justify-center font-mono uppercase tracking-tag",
            dims.text,
            tint,
          )}
        >
          {initials}
        </span>
      )}

      {status ? (
        <span
          aria-label={`${name} is ${status}`}
          className={cn(
            "absolute bottom-0 right-0 h-2 w-2 border border-white",
            STATUS_COLOURS[status],
          )}
        />
      ) : null}
    </span>
  );
}
