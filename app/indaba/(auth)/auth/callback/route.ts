import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { consume, requestIp } from "@/lib/ratelimit";
import { safeNext } from "@/lib/ops/next-param";
import {
  tokenFromSupabaseError,
  type AuthErrorToken,
} from "@/lib/ops/auth-error";

/**
 * OAuth / magic-link callback.
 *
 * The link in the emailed sign-in message lands here with a short-lived
 * `code` query param. We exchange it for a session (which writes auth
 * cookies via the response) and then redirect to a validated `next` path.
 *
 * All Supabase failure modes fold into a small set of opaque tokens so the
 * error page renders hardcoded copy rather than raw provider messages.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const rl = await consume("authCallback", requestIp(request));
  if (!rl.allowed) {
    return redirectWithReason(url, "unknown");
  }

  const code = url.searchParams.get("code");
  const nextPath = safeNext(url.searchParams.get("next"));

  if (!code) {
    return redirectWithReason(url, "unknown");
  }

  const cookieStore = cookies();
  const response = NextResponse.redirect(new URL(nextPath, url.origin));

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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return redirectWithReason(url, tokenFromSupabaseError(error.message));
  }

  const userId = data.user?.id;
  if (!userId) {
    return redirectWithReason(url, "unknown");
  }

  // Verify the auth user has a profile row and isn't disabled / revoked.
  // Use the service-role client so the lookup ignores the (not-yet-
  // established) RLS session.
  const service = createSupabaseServiceRoleClient();
  const { data: profile, error: profileErr } = await service
    .from("users")
    .select("id, active, revoked_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr) {
    return redirectWithReason(url, "profile_lookup_failed");
  }
  if (!profile) {
    return redirectWithReason(url, "profile_not_provisioned");
  }
  if (!profile.active || profile.revoked_at !== null) {
    return redirectWithReason(url, "account_disabled");
  }

  return response;
}

function redirectWithReason(url: URL, reason: AuthErrorToken) {
  const errorUrl = new URL("/auth/auth-error", url.origin);
  errorUrl.searchParams.set("reason", reason);
  return NextResponse.redirect(errorUrl);
}
