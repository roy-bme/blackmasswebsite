/**
 * Sector colour map.
 *
 * Each Blackmass venture lives in a sector, and the ops portal uses a single
 * accent colour per sector for pills, project cards, and the Logo accent rail.
 *
 * The hex values mirror the `sector.*` palette in `tailwind.config.ts`. They
 * are duplicated here so server-side rendering paths (chart fills, inline
 * SVG, dynamic `style` attributes) can read raw values without round-tripping
 * through Tailwind's class compiler.
 */

export type SectorKey =
  | "fintech"
  | "ai"
  | "assets"
  | "music"
  | "entertainment"
  | "ops";

export type SectorTheme = {
  key: SectorKey;
  label: string;
  hex: string;
  /** Tailwind text class — e.g. `text-sector-fintech`. */
  textClass: string;
  /** Tailwind background class — e.g. `bg-sector-fintech`. */
  bgClass: string;
  /** Tailwind border class — e.g. `border-sector-fintech`. */
  borderClass: string;
  /** Soft tinted background (10% mix) suitable for pills on a light surface. */
  softBgClass: string;
};

export const SECTOR_THEMES: Record<SectorKey, SectorTheme> = {
  fintech: {
    key: "fintech",
    label: "Fintech",
    hex: "#1f5fa6",
    textClass: "text-sector-fintech",
    bgClass: "bg-sector-fintech",
    borderClass: "border-sector-fintech",
    softBgClass: "bg-sector-fintech/10",
  },
  ai: {
    key: "ai",
    label: "AI",
    hex: "#6d28d9",
    textClass: "text-sector-ai",
    bgClass: "bg-sector-ai",
    borderClass: "border-sector-ai",
    softBgClass: "bg-sector-ai/10",
  },
  assets: {
    key: "assets",
    label: "Digital Assets",
    hex: "#c9a55a",
    textClass: "text-sector-assets",
    bgClass: "bg-sector-assets",
    borderClass: "border-sector-assets",
    softBgClass: "bg-sector-assets/10",
  },
  music: {
    key: "music",
    label: "Music",
    hex: "#be123c",
    textClass: "text-sector-music",
    bgClass: "bg-sector-music",
    borderClass: "border-sector-music",
    softBgClass: "bg-sector-music/10",
  },
  entertainment: {
    key: "entertainment",
    label: "Entertainment",
    hex: "#c2410c",
    textClass: "text-sector-entertainment",
    bgClass: "bg-sector-entertainment",
    borderClass: "border-sector-entertainment",
    softBgClass: "bg-sector-entertainment/10",
  },
  ops: {
    key: "ops",
    label: "Operations",
    hex: "#3b3f47",
    textClass: "text-sector-ops",
    bgClass: "bg-sector-ops",
    borderClass: "border-sector-ops",
    softBgClass: "bg-sector-ops/10",
  },
};

/**
 * Resolve a sector key (or arbitrary string) to its theme. Falls back to the
 * neutral `ops` theme when the key isn't recognised, so callers never have to
 * branch on `undefined`.
 */
export function getSectorTheme(key: string | null | undefined): SectorTheme {
  if (!key) return SECTOR_THEMES.ops;
  const normalised = key.toLowerCase() as SectorKey;
  return SECTOR_THEMES[normalised] ?? SECTOR_THEMES.ops;
}

/** Convenience accessor for callers that only need the raw hex. */
export function getSectorHex(key: string | null | undefined): string {
  return getSectorTheme(key).hex;
}

/** Iteration helper for dropdowns, legends, and seed scripts. */
export const SECTOR_LIST: ReadonlyArray<SectorTheme> =
  Object.values(SECTOR_THEMES);
