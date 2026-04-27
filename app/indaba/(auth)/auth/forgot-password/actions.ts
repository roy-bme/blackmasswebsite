"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import { consume, requestIp } from "@/lib/ratelimit";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildResetRedirect(): string {
  const hdrs = headers();
  const host =
    hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "indaba.zimx.io";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}/auth/callback?next=/auth/reset-password`;
}

export async function requestPasswordReset(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    redirect("/auth/forgot-password?error=invalid_email");
  }

  const hdrs = headers();
  const ip = requestIp(
    new Request("https://indaba.zimx.io/auth/forgot-password", {
      headers: hdrs,
    }),
  );
  const [ipRl, emailRl] = await Promise.all([
    consume("passwordResetIp", ip),
    consume("passwordResetEmail", email),
  ]);
  // Always show the same success message regardless of rate-limit / existence —
  // attackers shouldn't be able to enumerate registered emails through this
  // endpoint. The rate limiter still protects against abuse server-side.
  if (ipRl.allowed && emailRl.allowed) {
    const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildResetRedirect(),
    });
  }

  redirect("/auth/forgot-password?sent=1");
}
