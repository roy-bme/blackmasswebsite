/**
 * Client-side wrapper around /api/ops/reverse-geocode.
 *
 * Nominatim is never called directly from the browser; this proxy
 * preserves the same return contract (short "street, area, city" string or
 * null) and lets us keep Nominatim's attribution / rate-limit obligations
 * in one server-side place.
 */

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const params = new URLSearchParams({
    lat: lat.toFixed(6),
    lng: lng.toFixed(6),
  });

  try {
    const res = await fetch(
      `/api/ops/reverse-geocode?${params.toString()}`,
      {
        signal,
        credentials: "same-origin",
        headers: { accept: "application/json" },
      },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { address?: string | null };
    return typeof body.address === "string" && body.address ? body.address : null;
  } catch {
    return null;
  }
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
