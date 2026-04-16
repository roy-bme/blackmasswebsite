import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";

/**
 * Privileged Supabase client that bypasses Row Level Security.
 *
 * ONLY use this inside server-only code paths (route handlers, server
 * actions, cron jobs) where the request has already been authorized.
 * Never pass this client to Client Components or return its output
 * verbatim to the browser.
 *
 * The `server-only` import above causes a build-time error if this module
 * is accidentally pulled into a client bundle.
 */
export function createSupabaseServiceRoleClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
