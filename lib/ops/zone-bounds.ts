/**
 * Zone geometry helpers.
 *
 * The `zones` table stores only centre points. For the four priority zones
 * we have hard-coded polygon bounding boxes; for the remaining zones we fall
 * back to a bounding box derived from the zone centre with a default radius.
 *
 * Used by:
 *  - Map overlay polygons (BulawayoMap)
 *  - Dashboard zone coverage (count businesses whose lat/lng falls inside)
 */

export type LatLng = { lat: number; lng: number };
export type ZoneBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

// Bounding boxes for the four priority zones, matched on zone name.
// These mirror the polygon coordinates rendered on the map.
const ZONE_BOUNDS_BY_NAME: Record<string, ZoneBounds> = {
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
