import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { consume, requestIp } from "@/lib/ratelimit";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

const ALLOWED_NEXT = new Set<string>(["/auth/reset-password"]);

function safeNext(value: string | null): string {
  if (!value) return "/auth/reset-password";
  if (!ALLOWED_NEXT.has(value)) return "/auth/reset-password";
  return value;
}

/**
 * OAuth/recovery code-exchange endpoint.
 *
 * Email links from Supabase (password reset, email confirm) land here with
 * `?code=<one-time-code>`. We exchange the code for a Supabase session,
 * persist the auth cookies on the response, then redirect to the validated
 * `next` path. Currently only used for the password-reset flow.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/auth-error?reason=reset_link_invalid", url.origin),
    );
  }

  const rl = await consume("authCallback", requestIp(request));
  if (!rl.allowed) {
    return NextResponse.redirect(
      new URL("/auth/auth-error?reason=rate_limited", url.origin),
    );
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
    return NextResponse.redirect(
      new URL("/auth/auth-error?reason=reset_link_invalid", url.origin),
    );
  }

  return response;
}
