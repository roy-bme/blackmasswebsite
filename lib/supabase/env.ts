/**
 * Supabase environment variable access.
 *
 * All Supabase credentials live in three env vars that are set both locally
 * (via `.env.local`) and in Vercel:
 *
 *   - NEXT_PUBLIC_SUPABASE_URL       project URL; safe to ship to the browser
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY  publishable anon key (RLS-scoped)
 *   - SUPABASE_SERVICE_ROLE_KEY      bypasses RLS; server-only
 *
 * Each helper throws a clear message at call time so we fail fast during
 * build / first request instead of silently booting a broken client.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in .env.local (for local dev) and in Vercel project settings.`,
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseServiceRoleKey(): string {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
