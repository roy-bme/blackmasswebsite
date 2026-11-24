// CARTO basemap configuration.
//
// The API key is read from the server environment only (`CARTOBasemaps`).
// Server components call getCartoApiKey() and pass the result to the map as a
// prop. Never read this variable from a NEXT_PUBLIC_* name, and never log the
// key itself.

export const CARTO_VOYAGER_RASTER_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Trimmed CARTO key from the server environment, or null if unset or blank. */
export function getCartoApiKey(): string | null {
  const key = process.env.CARTOBasemaps?.trim();
  return key ? key : null;
}

/** Appends `key=<key>` to a CARTO URL template. Returns the template unchanged when there is no key. */
export function withCartoKey(urlTemplate: string, key: string | null): string {
  if (!key) return urlTemplate;
  const separator = urlTemplate.includes("?") ? "&" : "?";
  return `${urlTemplate}${separator}key=${encodeURIComponent(key)}`;
}
