import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import {
  getSupabaseAnonKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

/**
 * OAuth / magic-link callback.
 *
 * The link in the emailed sign-in message lands here with a short-lived
 * `code` query param. We exchange it for a session (which writes auth
 * cookies via the response) and then redirect to `next` (or `/` if the
 * caller didn't specify one).
 *
 * A route handler is used rather than a Server Component because we need
 * writable cookies to persist the refreshed session.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/auth-error", url.origin));
  }

  const cookieStore = cookies();
  const response = NextResponse.redirect(new URL(next, url.origin));

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const errorUrl = new URL("/auth/auth-error", url.origin);
    errorUrl.searchParams.set("reason", error.message);
    return NextResponse.redirect(errorUrl);
  }

  return response;
}
