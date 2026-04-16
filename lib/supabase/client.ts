"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Browser-side Supabase client.
 *
 * Used inside client components (e.g. the login form, sign-out buttons).
 * Cookies are managed by @supabase/ssr so the same session is visible to
 * server components on subsequent navigations.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
