import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { assertSameOrigin } from "@/lib/ops/csrf";

/**
 * Sign-out endpoint. POST-only with a same-origin check to prevent CSRF
 * via drive-by POST. After clearing the session we bounce the user back
 * to /login.
 */
export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;


  const url = new URL(request.url);
  const cookieStore = cookies();
  const response = NextResponse.redirect(new URL("/login", url.origin), {
    status: 303,
  });

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

  await supabase.auth.signOut();
  return response;
}
