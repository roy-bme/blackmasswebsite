import { NextResponse, type NextRequest } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/middleware";

/**
 * Hostname-based router + Supabase session refresh.
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
 * On the indaba host we additionally:
 *   1. Refresh the Supabase auth cookies on every request (so expiring
 *      access tokens get rotated transparently).
 *   2. Redirect unauthenticated requests to `/login`, except for the auth
 *      surface itself (`/login`, `/auth/*`).
 *   3. Redirect already-authenticated users away from `/login` and back to
 *      the portal root `/` (which rewrites to `/indaba`).
 */

const INDABA_PATH_PREFIX = "/indaba";

// Visible (pre-rewrite) paths on the indaba host that do NOT require a
// signed-in user. Everything else on the indaba host is gated.
const PUBLIC_INDABA_PATHS = ["/login", "/auth"];

function isIndabaHost(host: string | null): boolean {
  if (!host) return false;
  // Strip port, lowercase. Hostname may look like `indaba.zimx.io:3000`.
  const hostname = host.split(":")[0].toLowerCase();
  // Match any subdomain chain starting with `indaba.` so that
  // `indaba.zimx.io`, `indaba.localhost`, and `indaba.preview.vercel.app`
  // all resolve to the portal.
  return hostname === "indaba" || hostname.startsWith("indaba.");
}

function isPublicIndabaPath(pathname: string): boolean {
  return PUBLIC_INDABA_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function copyAuthCookies(source: NextResponse, target: NextResponse): NextResponse {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  return target;
}

function withNoIndex(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, nocache");
  return response;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const { pathname } = request.nextUrl;
  const onIndabaHost = isIndabaHost(host);

  if (!onIndabaHost) {
    // Marketing host: hide the portal surface entirely. No auth logic here —
    // the marketing site is fully public.
    if (pathname === INDABA_PATH_PREFIX || pathname.startsWith(`${INDABA_PATH_PREFIX}/`)) {
      return new NextResponse("Not Found", { status: 404 });
    }
    return NextResponse.next();
  }

  // --- Indaba host ---------------------------------------------------------

  // Refresh the Supabase session. `authResponse` has any rotated auth cookies
  // attached; if we return a different response below we copy those over.
  const { response: authResponse, user } = await updateSupabaseSession(request);

  const isPublic = isPublicIndabaPath(pathname);

  // Signed-in users hitting /login get bounced to the portal root. They'll be
  // routed onwards to /dashboard by the ops layout in a later phase.
  if (user && pathname === "/login") {
    const redirect = NextResponse.redirect(new URL("/", request.url));
    return withNoIndex(copyAuthCookies(authResponse, redirect));
  }

  // Unauthenticated users are bounced to /login (preserving intended dest).
  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    const redirect = NextResponse.redirect(loginUrl);
    return withNoIndex(copyAuthCookies(authResponse, redirect));
  }

  // Path is allowed. Now apply the hostname rewrite `/foo` → `/indaba/foo`
  // (unless the user already typed `/indaba/...` directly, which is legal
  // but uncommon), preserving the Supabase cookies from the auth response.
  if (pathname === INDABA_PATH_PREFIX || pathname.startsWith(`${INDABA_PATH_PREFIX}/`)) {
    return withNoIndex(authResponse);
  }

  const rewritten = request.nextUrl.clone();
  rewritten.pathname = pathname === "/" ? INDABA_PATH_PREFIX : `${INDABA_PATH_PREFIX}${pathname}`;
  const rewriteResponse = NextResponse.rewrite(rewritten, {
    request: { headers: request.headers },
  });
  return withNoIndex(copyAuthCookies(authResponse, rewriteResponse));
}

// Run on everything except Next.js internals and static assets.
// (Matcher syntax is literal-character based; the negative lookahead matches
// any path whose first segment is not one of the listed reserved names.)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|images/).*)",
  ],
};
