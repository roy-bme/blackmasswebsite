import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Refresh the Supabase session on every matched request.
 *
 * Returns both the (possibly-mutated) response with updated auth cookies
 * AND the resolved user, so callers (e.g. middleware.ts) can decide whether
 * to allow, redirect, or block the request without issuing a second auth
 * round-trip.
 */
export async function updateSupabaseSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: User | null;
}> {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Cheap short-circuit: if the request carries no Supabase auth cookie at
  // all, there is no session to refresh. Calling getUser() in that case
  // still reaches the Supabase API over HTTPS and adds round-trip latency
  // to every anonymous request (including /login, /auth/*, preview-URL
  // probes, etc.). Skipping saves cost and reduces our attack surface.
  const hasAuthCookie = request.cookies.getAll().some((c) => {
    return c.name.startsWith("sb-") && c.name.endsWith("-auth-token");
  });
  if (!hasAuthCookie) {
    return { response, user: null };
  }

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
