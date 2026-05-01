import { NextResponse, type NextRequest } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/middleware";
import {
  isIndabaHost,
  isMarketingHost,
  isUnknownHost,
} from "@/lib/ops/host-allowlist";

/**
 * Hostname-based router + Supabase session refresh + CSP nonce injection.
 *
 * One Vercel project serves two surfaces:
 *   - blackmass.co.uk (and previews / localhost)  → public marketing
 *   - indaba.zimx.io  (and indaba.localhost, etc) → private ops portal
 *
 * This middleware:
 *   1. Restricts access to `/indaba/*` on non-indaba hosts (404).
 *   2. Refreshes Supabase auth cookies on every indaba request.
 *   3. Redirects unauthenticated indaba requests to `/login` (preserving
 *      the intended destination via ?next=).
 *   4. Generates a per-request CSP nonce and rewrites the static
 *      `NONCE_PLACEHOLDER` in the global CSP header to that nonce value.
 */

const INDABA_PATH_PREFIX = "/indaba";
const PUBLIC_INDABA_PATHS = ["/login", "/auth"];

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

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Base64url without padding.
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function applyCspNonce(response: NextResponse, nonce: string) {
  const csp = response.headers.get("content-security-policy");
  if (csp && csp.includes("NONCE_PLACEHOLDER")) {
    response.headers.set(
      "content-security-policy",
      csp.replaceAll("NONCE_PLACEHOLDER", nonce),
    );
  }
  // Expose to RSC via a request header (server-side only).
  response.headers.set("x-nonce", nonce);
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const { pathname } = request.nextUrl;
  const onIndabaHost = isIndabaHost(host);
  const onMarketing = isMarketingHost(host);
  const nonce = generateNonce();

  // Log (visible in Vercel logs) any request on an unknown host so we can
  // tell at a glance if someone starts probing a made-up "indaba.*" subdomain.
  if (host && isUnknownHost(host)) {
    console.warn("unknown host", { host, pathname });
  }

  if (!onIndabaHost) {
    // Marketing (or unknown) host: hide the portal surface entirely.
    if (pathname === INDABA_PATH_PREFIX || pathname.startsWith(`${INDABA_PATH_PREFIX}/`)) {
      return new NextResponse("Not Found", { status: 404 });
    }
    // Forward the nonce into the request headers so server components can
    // read it via headers().get("x-nonce").
    const headers = new Headers(request.headers);
    headers.set("x-nonce", nonce);
    const response = NextResponse.next({ request: { headers } });
    applyCspNonce(response, nonce);
    if (!onMarketing) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow, nocache");
    }
    return response;
  }

  // --- Indaba host ---------------------------------------------------------

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const { response: authResponse, user } = await updateSupabaseSession(request);

  const isPublic = isPublicIndabaPath(pathname);

  if (user && pathname === "/login") {
    const redirect = NextResponse.redirect(new URL("/", request.url));
    const copied = withNoIndex(copyAuthCookies(authResponse, redirect));
    applyCspNonce(copied, nonce);
    return copied;
  }

  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    const redirect = NextResponse.redirect(loginUrl);
    const copied = withNoIndex(copyAuthCookies(authResponse, redirect));
    applyCspNonce(copied, nonce);
    return copied;
  }

  if (pathname === INDABA_PATH_PREFIX || pathname.startsWith(`${INDABA_PATH_PREFIX}/`)) {
    const withHeaders = withNoIndex(authResponse);
    applyCspNonce(withHeaders, nonce);
    return withHeaders;
  }

  const rewritten = request.nextUrl.clone();
  rewritten.pathname = pathname === "/" ? INDABA_PATH_PREFIX : `${INDABA_PATH_PREFIX}${pathname}`;
  const rewriteResponse = NextResponse.rewrite(rewritten, {
    request: { headers: requestHeaders },
  });
  const finalResponse = withNoIndex(copyAuthCookies(authResponse, rewriteResponse));
  applyCspNonce(finalResponse, nonce);
  return finalResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|images/).*)",
  ],
};
