import "server-only";

/**
 * Cross-site request guard for all state-changing indaba endpoints.
 *
 * We run behind two hostnames: `indaba.zimx.io` in production and
 * `indaba-*.vercel.app` for preview deployments. Any POST to /api/ops/* or
 * /auth/signout must either carry Sec-Fetch-Site: same-origin (modern
 * browsers, always attached for same-origin form POSTs and fetch()) or a
 * matching Origin header.
 */

const ALLOWED_ORIGIN_HOSTS = new Set<string>([
  "indaba.zimx.io",
  "indaba.localhost",
]);

const PREVIEW_ORIGIN_RE = /^indaba-[a-z0-9-]+\.vercel\.app$/;

function isAllowedOriginHost(host: string | null): boolean {
  if (!host) return false;
  const lower = host.toLowerCase();
  if (ALLOWED_ORIGIN_HOSTS.has(lower)) return true;
  return PREVIEW_ORIGIN_RE.test(lower);
}

export function assertSameOrigin(request: Request): Response | null {
  const originHeader = request.headers.get("origin");
  const secFetchSite = request.headers.get("sec-fetch-site");

  if (secFetchSite === "same-origin") return null;

  if (originHeader) {
    try {
      const { hostname, protocol } = new URL(originHeader);
      if (protocol === "https:" || hostname === "indaba.localhost") {
        if (isAllowedOriginHost(hostname)) return null;
      }
    } catch {
      // fall through to reject
    }
  }

  return new Response("forbidden", { status: 403 });
}
