import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and
 * Server Actions. Backed by the request cookies so the authenticated user's
 * session is honoured and RLS policies apply.
 *
 * In Server Components the `set`/`remove` calls are no-ops (cookies are
 * read-only). That is the documented pattern from @supabase/ssr: cookie
 * refresh happens in middleware and in route handlers, which both have
 * writable cookie stores.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a Server Component — cookies are read-only here.
          // Middleware + route handlers handle the actual refresh.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Same as above: no-op in Server Components.
        }
      },
    },
  });
}
