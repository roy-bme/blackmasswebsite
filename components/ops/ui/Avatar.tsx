/* eslint-disable @next/next/no-img-element */
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/ops/cn";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: Record<AvatarSize, { box: string; text: string; px: number }> = {
  xs: { box: "h-6 w-6", text: "text-[9px]", px: 24 },
  sm: { box: "h-8 w-8", text: "text-[10px]", px: 32 },
  md: { box: "h-9 w-9", text: "text-[11px]", px: 36 },
  lg: { box: "h-12 w-12", text: "text-[13px]", px: 48 },
  xl: { box: "h-16 w-16", text: "text-[18px]", px: 64 },
};

type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  /** URL for the user's avatar. Falls back to initials when missing. */
  src?: string | null;
  /** Used for both the alt text and initials fallback. */
  name: string;
  size?: AvatarSize;
  /** Gold-fill variant — used for "Roy" / agent posts in the feed. */
  gold?: boolean;
};

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase();
}

/**
 * Square (no-radius) avatar with mono initials. The gold variant is used for
 * Roy's posts in the feed and for agent-generated content.
 */
export default function Avatar({
  src,
  name,
  size = "md",
  gold,
  className,
  ...rest
}: AvatarProps) {
  const dims = SIZES[size];
  const initials = getInitials(name);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden border",
        gold ? "bg-zimx-gold text-[#1a1612] border-zimx-gold" : "bg-ink-500 text-white border-line-15",
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
            "flex h-full w-full items-center justify-center font-mono font-semibold uppercase tracking-tight",
            dims.text,
          )}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
