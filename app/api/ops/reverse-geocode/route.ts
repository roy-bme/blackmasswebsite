import { loadOpsProfile } from "@/lib/ops/auth";
import { assertSameOrigin } from "@/lib/ops/csrf";

/**
 * Server-side proxy for Nominatim reverse-geocode lookups.
 *
 * Why: calling Nominatim directly from the browser leaks the dropped pin's
 * lat/lng (plus our referrer) to a third-party host. Routing through this
 * handler means:
 *   1. The browser never talks to Nominatim directly.
 *   2. We can set the policy-required descriptive User-Agent.
 *   3. Only authenticated ops can hit it.
 */

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "Indaba-Bulawayo-Ops/1.0 (ops@zimx.finance)";

export async function GET(request: Request) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;


  const profile = await loadOpsProfile();
  if (profile.status !== "ok") {
    return new Response(JSON.stringify({ error: "unauthenticated" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return new Response(JSON.stringify({ error: "invalid_coords" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return new Response(JSON.stringify({ error: "out_of_range" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const upstream = `${NOMINATIM_ENDPOINT}?format=jsonv2&lat=${encodeURIComponent(
    lat.toFixed(6),
  )}&lon=${encodeURIComponent(lng.toFixed(6))}&zoom=18&addressdetails=1`;

  try {
    const res = await fetch(upstream, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "upstream_error" }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }
    const payload = (await res.json()) as { display_name?: string };
    if (!payload.display_name) {
      return new Response(JSON.stringify({ address: null }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    const short = payload.display_name
      .split(",")
      .slice(0, 3)
      .map((s: string) => s.trim())
      .filter(Boolean)
      .join(", ");
    return new Response(JSON.stringify({ address: short }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "fetch_failed" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
