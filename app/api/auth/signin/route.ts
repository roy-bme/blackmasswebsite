import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { assertSameOrigin } from "@/lib/ops/csrf";
import { consume, requestIp } from "@/lib/ratelimit";
import { safeNext } from "@/lib/ops/next-param";

/**
 * Constant-time, rate-limited magic-link trigger.
 *
 * Returns the same generic JSON response whether the email is provisioned or
 * not, whether Supabase errored or not, and waits at least 600ms so timing
 * cannot be used as a signal. Errors are deliberately opaque; the client
 * shows a fixed copy string.
 */

const FLOOR_MS = 600;
const GENERIC_MESSAGE =
  "If your email is registered, a link is on its way.";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  email?: string;
  next?: string | null;
};

export async function POST(request: Request) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const start = Date.now();
  const url = new URL(request.url);

  let email = "";
  let rawNext: string | null = null;
  try {
    const body = (await request.json()) as Body;
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    rawNext = typeof body.next === "string" ? body.next : null;
  } catch {
    return genericResponse(start);
  }

  if (!EMAIL_RE.test(email) || email.length > 256) {
    return genericResponse(start);
  }

  // Rate limit both IP and email — both must be under quota.
  const ipKey = requestIp(request);
  const [ipRl, emailRl] = await Promise.all([
    consume("signInIp", ipKey),
    consume("signInEmail", email),
  ]);
  if (!ipRl.allowed || !emailRl.allowed) {
    return genericResponse(start);
  }

  const redirectPath = safeNext(rawNext);
  const callback = new URL("/auth/callback", url.origin);
  callback.searchParams.set("next", redirectPath);

  const cookieStore = cookies();
  // Build a dummy response so createServerClient's cookie setter has a
  // target, even though we don't intend to mutate session cookies here.
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(_name: string, _value: string, _options: CookieOptions) {
        // no-op; signInWithOtp only sets server-side state
      },
      remove(_name: string, _options: CookieOptions) {
        // no-op
      },
    },
  });

  // Fire-and-swallow — the response never changes based on the outcome.
  await supabase.auth
    .signInWithOtp({
      email,
      options: {
        emailRedirectTo: callback.toString(),
        shouldCreateUser: false,
      },
    })
    .catch(() => {
      // swallow
    });

  return genericResponse(start);
}

async function genericResponse(start: number): Promise<Response> {
  const elapsed = Date.now() - start;
  if (elapsed < FLOOR_MS) {
    await new Promise((r) => setTimeout(r, FLOOR_MS - elapsed));
  }
  return new Response(JSON.stringify({ message: GENERIC_MESSAGE }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}
