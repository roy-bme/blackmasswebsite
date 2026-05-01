/**
 * Zone geometry helpers.
 *
 * The `zones` table stores centre points and (for newer priority zones) a
 * GeoJSON bounding-box polygon in `boundary_geojson`. For zones that pre-date
 * `boundary_geojson` we keep hard-coded bounding boxes here, matching the
 * polygons rendered on the map. Anything else falls back to a small box
 * derived from the zone centre.
 *
 * Used by:
 *  - Map overlay polygons (BulawayoMap)
 *  - Auto-assigning zone_id when a business pin is dropped (AddBusinessDialog)
 *  - Dashboard zone coverage (count businesses whose lat/lng falls inside)
 */

export type LatLng = { lat: number; lng: number };
export type ZoneBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

// Bounding boxes keyed by zone name. Covers the original 4 priority zones
// plus the 7 ground-ops priority zones (3 existing + 4 newly added).
const ZONE_BOUNDS_BY_NAME: Record<string, ZoneBounds> = {
  // Original priority zones (polygons hard-coded in BulawayoMap).
  "CBD Core": { minLat: -20.158, maxLat: -20.144, minLng: 28.575, maxLng: 28.59 },
  "Belmont Industrial": {
    minLat: -20.18,
    maxLat: -20.162,
    minLng: 28.558,
    maxLng: 28.58,
  },
  Donnington: {
    minLat: -20.148,
    maxLat: -20.135,
    minLng: 28.545,
    maxLng: 28.558,
  },
  Kelvin: { minLat: -20.18, maxLat: -20.16, minLng: 28.528, maxLng: 28.55 },

  // Ground-ops priority zones (added 2026-05-01).
  "CBD / Sauce Town": {
    minLat: -20.157,
    maxLat: -20.11,
    minLng: 28.575,
    maxLng: 28.6,
  },
  Nkulumane: {
    minLat: -20.195,
    maxLat: -20.17,
    minLng: 28.48,
    maxLng: 28.515,
  },
  "Cowdray Park": {
    minLat: -20.095,
    maxLat: -20.065,
    minLng: 28.49,
    maxLng: 28.53,
  },
  Sizinda: {
    minLat: -20.185,
    maxLat: -20.16,
    minLng: 28.528,
    maxLng: 28.558,
  },
  Njube: {
    minLat: -20.145,
    maxLat: -20.12,
    minLng: 28.51,
    maxLng: 28.545,
  },
  Pumula: {
    minLat: -20.155,
    maxLat: -20.13,
    minLng: 28.465,
    maxLng: 28.495,
  },
  Nketa: {
    minLat: -20.215,
    maxLat: -20.19,
    minLng: 28.515,
    maxLng: 28.55,
  },
};

// Half-width used to derive a bounding box from a zone centre when no
// hard-coded polygon exists. ~0.012° ≈ 1.3 km at Bulawayo's latitude.
const DEFAULT_RADIUS_DEG = 0.012;

export function getZoneBounds(zone: {
  name: string;
  centre_lat: number | null;
  centre_lng: number | null;
}): ZoneBounds | null {
  const named = ZONE_BOUNDS_BY_NAME[zone.name];
  if (named) return named;
  if (zone.centre_lat == null || zone.centre_lng == null) return null;
  return {
    minLat: zone.centre_lat - DEFAULT_RADIUS_DEG,
    maxLat: zone.centre_lat + DEFAULT_RADIUS_DEG,
    minLng: zone.centre_lng - DEFAULT_RADIUS_DEG,
    maxLng: zone.centre_lng + DEFAULT_RADIUS_DEG,
  };
}

export function pointInBounds(
  point: { lat: number | null; lng: number | null },
  bounds: ZoneBounds,
): boolean {
  if (point.lat == null || point.lng == null) return false;
  return (
    point.lat >= bounds.minLat &&
    point.lat <= bounds.maxLat &&
    point.lng >= bounds.minLng &&
    point.lng <= bounds.maxLng
  );
}
