import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Refresh the Supabase session on every matched request.
 *
 * Returns both the (possibly-mutated) response with updated auth cookies
 * AND the resolved user, so callers (e.g. middleware.ts) can decide whether
 * to allow, redirect, or block the request without issuing a second auth
 * round-trip.
 *
 * This follows the @supabase/ssr Next.js pattern: create a client bound to
 * the request cookies, and mirror any cookie writes onto both the request
 * (so downstream handlers see the refreshed session) and the response
 * (so the browser stores the new tokens).
 */
export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  // IMPORTANT: getUser() forces a token validation round-trip with Supabase.
  // Don't swap for getSession() — the session cookie can be forged.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
