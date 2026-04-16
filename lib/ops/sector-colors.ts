/**
 * Sector colour map.
 *
 * The "sectors" here are the eight Bulawayo business categories the indaba
 * portal tracks (Wholesale, FMCG, Distribution, Manufacturing, Agriculture,
 * Fuel, Hardware, and Contact — the last being reserved for Tafadzwa's
 * introduction diamonds on the map). Each sector has a single accent colour
 * used for pills, business cards, and map markers.
 *
 * The hex values mirror the `sector.*` palette in `tailwind.config.ts`. They
 * are duplicated here so server-side rendering paths (chart fills, inline
 * SVG, dynamic `style` attributes) can read raw values without round-tripping
 * through Tailwind's class compiler.
 */

export const SECTORS = [
  "Wholesale",
  "FMCG",
  "Distribution",
  "Manufacturing",
  "Agriculture",
  "Fuel",
  "Hardware",
  "Contact",
] as const;

export type SectorLabel = (typeof SECTORS)[number];
export type SectorKey = Lowercase<SectorLabel>;

export type SectorTheme = {
  key: SectorKey;
  label: SectorLabel;
  hex: string;
  /** Tailwind text class — e.g. `text-sector-wholesale`. */
  textClass: string;
  /** Tailwind background class — e.g. `bg-sector-wholesale`. */
  bgClass: string;
  /** Tailwind border class — e.g. `border-sector-wholesale`. */
  borderClass: string;
  /** Soft tinted background (10% mix) suitable for pills on a light surface. */
  softBgClass: string;
};

const HEX: Record<SectorKey, string> = {
  wholesale: "#378ADD",
  fmcg: "#1D9E75",
  distribution: "#BA7517",
  manufacturing: "#E24B4A",
  agriculture: "#7F77DD",
  fuel: "#D4537E",
  hardware: "#888780",
  contact: "#D85A30",
};

function buildTheme(label: SectorLabel): SectorTheme {
  const key = label.toLowerCase() as SectorKey;
  return {
    key,
    label,
    hex: HEX[key],
    textClass: `text-sector-${key}`,
    bgClass: `bg-sector-${key}`,
    borderClass: `border-sector-${key}`,
    softBgClass: `bg-sector-${key}/10`,
  };
}

export const SECTOR_THEMES: Record<SectorKey, SectorTheme> = {
  wholesale: buildTheme("Wholesale"),
  fmcg: buildTheme("FMCG"),
  distribution: buildTheme("Distribution"),
  manufacturing: buildTheme("Manufacturing"),
  agriculture: buildTheme("Agriculture"),
  fuel: buildTheme("Fuel"),
  hardware: buildTheme("Hardware"),
  contact: buildTheme("Contact"),
};

/**
 * Resolve a sector key or label (or arbitrary string) to its theme. Falls back
 * to the Wholesale theme when the key isn't recognised, so callers never have
 * to branch on `undefined`.
 */
export function getSectorTheme(key: string | null | undefined): SectorTheme {
  if (!key) return SECTOR_THEMES.wholesale;
  const normalised = key.toLowerCase() as SectorKey;
  return SECTOR_THEMES[normalised] ?? SECTOR_THEMES.wholesale;
}

/** Convenience accessor for callers that only need the raw hex. */
export function getSectorHex(key: string | null | undefined): string {
  return getSectorTheme(key).hex;
}

/** Iteration helper for dropdowns, legends, and seed scripts. */
export const SECTOR_LIST: ReadonlyArray<SectorTheme> =
  Object.values(SECTOR_THEMES);
