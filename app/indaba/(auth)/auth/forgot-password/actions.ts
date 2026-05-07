"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildResetRedirect(formHeaders: Headers): string {
  const hdrs = formHeaders;
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
  const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildResetRedirect(hdrs),
  });

  redirect("/auth/forgot-password?sent=1");
}
