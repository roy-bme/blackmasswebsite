import { NextResponse, type NextRequest } from "next/server";

/**
 * Hostname-based router.
 *
 * One Vercel project serves two surfaces:
 *   - blackmass.co.uk (and previews / localhost)  → public marketing
 *   - indaba.zimx.io  (and indaba.localhost, etc) → private ops portal
 *
 * Marketing pages live at top-level URLs (`/`, `/about`, ...). Portal pages
 * live under `app/indaba/*` on disk. For requests on an `indaba.*` hostname,
 * this middleware rewrites `/foo` → `/indaba/foo` so the user never sees the
 * `/indaba` prefix in their URL bar. On non-indaba hostnames, any direct hit
 * to `/indaba/*` returns 404 so the portal surface isn't discoverable from
 * the public domain.
 *
 * Session refresh (Supabase SSR) gets wired in here in Phase 1.
 */

const INDABA_PATH_PREFIX = "/indaba";

function isIndabaHost(host: string | null): boolean {
  if (!host) return false;
  // Strip port, lowercase. Hostname may look like `indaba.zimx.io:3000`.
  const hostname = host.split(":")[0].toLowerCase();
  // Match any subdomain chain starting with `indaba.` so that
  // `indaba.zimx.io`, `indaba.localhost`, and `indaba.preview.vercel.app`
  // all resolve to the portal.
  return hostname === "indaba" || hostname.startsWith("indaba.");
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const { pathname, search } = request.nextUrl;
  const onIndabaHost = isIndabaHost(host);

  if (onIndabaHost) {
    // Already rewritten (or the user typed `/indaba/...` directly on the
    // portal host). Pass through unchanged but add the noindex header.
    if (pathname === INDABA_PATH_PREFIX || pathname.startsWith(`${INDABA_PATH_PREFIX}/`)) {
      const response = NextResponse.next();
      response.headers.set("X-Robots-Tag", "noindex, nofollow, nocache");
      return response;
    }

    // Rewrite the visible URL `/foo` → internal `/indaba/foo`.
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = pathname === "/" ? INDABA_PATH_PREFIX : `${INDABA_PATH_PREFIX}${pathname}`;
    const response = NextResponse.rewrite(rewritten);
    response.headers.set("X-Robots-Tag", "noindex, nofollow, nocache");
    return response;
  }

  // Marketing host: hide the portal surface entirely.
  if (pathname === INDABA_PATH_PREFIX || pathname.startsWith(`${INDABA_PATH_PREFIX}/`)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Avoid "unused" warning if `search` is never read; keeps the function
  // stable if we later choose to preserve query strings on rewrites.
  void search;
  return NextResponse.next();
}

// Run on everything except Next.js internals and static assets.
// (Matcher syntax is literal-character based; the negative lookahead matches
// any path whose first segment is not one of the listed reserved names.)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|images/).*)",
  ],
};
