/**
 * Sector colour map.
 *
 * Six primary categories per the indaba design tokens (mining, manufacturing,
 * retail, services, agriculture, fuel) plus two legacy aliases (wholesale →
 * retail, fmcg → agriculture) so older surfaces keep working.
 *
 * The hex values mirror the `sector.*` palette in `tailwind.config.ts` and
 * `--sec-*` CSS variables in `globals.css`. Duplicated here so server-side
 * rendering paths (chart fills, inline SVG, dynamic `style` attributes) can
 * read raw values without round-tripping through Tailwind's class compiler.
 */

export const SECTORS = [
  "Mining",
  "Manufacturing",
  "Retail",
  "Services",
  "Agriculture",
  "Fuel",
  "Wholesale",
  "FMCG",
  // Legacy categories — older marketing surfaces still reference these.
  "Distribution",
  "Hardware",
  "Contact",
] as const;

export type SectorLabel = (typeof SECTORS)[number];
export type SectorKey = Lowercase<SectorLabel>;

export type SectorTheme = {
  key: SectorKey;
  label: SectorLabel;
  hex: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  softBgClass: string;
};

const HEX: Record<SectorKey, string> = {
  mining: "#BA7517",
  manufacturing: "#E24B4A",
  retail: "#378ADD",
  services: "#7F77DD",
  agriculture: "#1D9E75",
  fuel: "#D4537E",
  wholesale: "#378ADD",
  fmcg: "#1D9E75",
  distribution: "#BA7517",
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
  mining: buildTheme("Mining"),
  manufacturing: buildTheme("Manufacturing"),
  retail: buildTheme("Retail"),
  services: buildTheme("Services"),
  agriculture: buildTheme("Agriculture"),
  fuel: buildTheme("Fuel"),
  wholesale: buildTheme("Wholesale"),
  fmcg: buildTheme("FMCG"),
  distribution: buildTheme("Distribution"),
  hardware: buildTheme("Hardware"),
  contact: buildTheme("Contact"),
};

/**
 * Resolve a sector key or label (or arbitrary string) to its theme. Falls back
 * to the Manufacturing theme when the key isn't recognised, so callers never
 * have to branch on `undefined`.
 */
export function getSectorTheme(key: string | null | undefined): SectorTheme {
  if (!key) return SECTOR_THEMES.manufacturing;
  const normalised = key.toLowerCase() as SectorKey;
  return SECTOR_THEMES[normalised] ?? SECTOR_THEMES.manufacturing;
}

/** Convenience accessor for callers that only need the raw hex. */
export function getSectorHex(key: string | null | undefined): string {
  return getSectorTheme(key).hex;
}

/** Iteration helper for dropdowns, legends, and seed scripts. */
export const SECTOR_LIST: ReadonlyArray<SectorTheme> =
  Object.values(SECTOR_THEMES);

/** Six primary sectors used by the indaba design — drop the legacy aliases. */
export const PRIMARY_SECTORS: ReadonlyArray<SectorKey> = [
  "mining",
  "manufacturing",
  "retail",
  "services",
  "agriculture",
  "fuel",
];
