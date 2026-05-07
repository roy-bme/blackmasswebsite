"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { tokenFromSupabaseError } from "@/lib/ops/auth-error";
import { safeNext } from "@/lib/ops/next-param";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

/**
 * Email + password sign-in server action.
 *
 * Replaces the prior magic-link flow.
 * verifies the user is provisioned + active, and writes Supabase auth cookies
 * before redirecting to the validated `next` path.
 */
export async function signInWithPassword(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!email || !password) {
    redirect(`/login?error=invalid_credentials&next=${encodeURIComponent(next)}`);
  }


  const cookieStore = cookies();
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    const reason = tokenFromSupabaseError(error?.message);
    redirect(`/login?error=${reason}&next=${encodeURIComponent(next)}`);
  }

  // Verify the auth user has a provisioned, active profile row before letting
  // them through. Mirrors the prior magic-link callback's defence.
  const service = createSupabaseServiceRoleClient();
  const { data: profile, error: profileErr } = await service
    .from("users")
    .select("id, active, revoked_at")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileErr) {
    await supabase.auth.signOut();
    redirect("/auth/auth-error?reason=profile_lookup_failed");
  }
  if (!profile) {
    await supabase.auth.signOut();
    redirect("/auth/auth-error?reason=profile_not_provisioned");
  }
  if (!profile.active || profile.revoked_at !== null) {
    await supabase.auth.signOut();
    redirect("/auth/auth-error?reason=account_disabled");
  }

  redirect(`/indaba${next}`);
}
