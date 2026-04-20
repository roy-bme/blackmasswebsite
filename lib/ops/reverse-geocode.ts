/**
 * Reverse geocoding helpers for the Indaba map pin-drop flow.
 *
 * Calls the public Nominatim endpoint to resolve a dropped pin's lat/lng to a
 * short, human-readable address like "Fife Street, CBD, Bulawayo". Consumers
 * are responsible for showing a loading state and falling back to raw coords
 * when the lookup fails (we return `null` rather than throwing).
 *
 * Nominatim's usage policy asks callers to send a descriptive User-Agent. The
 * Fetch spec forbids setting User-Agent from the browser, so the browser's own
 * UA is what actually reaches their server; the referrer identifies us.
 */

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "Indaba-Bulawayo-Ops/1.0 (ops@zimx.finance)";

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const url = `${NOMINATIM_ENDPOINT}?format=jsonv2&lat=${encodeURIComponent(
    lat.toFixed(6),
  )}&lon=${encodeURIComponent(lng.toFixed(6))}&zoom=18&addressdetails=1`;

  try {
    const res = await fetch(url, {
      signal,
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    if (!data.display_name) return null;
    return data.display_name
      .split(",")
      .slice(0, 3)
      .map((segment) => segment.trim())
      .filter(Boolean)
      .join(", ");
  } catch {
    return null;
  }
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
