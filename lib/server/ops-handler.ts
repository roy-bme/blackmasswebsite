import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { loadOpsProfile, type OpsUser } from "@/lib/ops/auth";
import { canAccess } from "@/lib/ops/nav";
import { assertSameOrigin } from "@/lib/ops/csrf";
import { consume, requestIp } from "@/lib/ratelimit";
import type { UserRole } from "@/types/ops";

export type WriteHandlerContext = {
  request: Request;
  user: OpsUser;
  /** RLS-scoped client. Read queries only; writes should use service. */
  supabase: ReturnType<typeof createSupabaseServerClient>;
  /** Service-role client. Use for the actual insert/update after authz. */
  service: ReturnType<typeof createSupabaseServiceRoleClient>;
};

export type HandlerOptions = {
  /** Module href to check against canAccess. */
  module?: string;
  /** Role allowlist override. Defaults to any role that canAccess allows. */
  roles?: UserRole[];
  /** Whether to apply the global ops-API rate limit (default true). */
  rateLimit?: boolean;
};

export type HandlerResult = Response;

export async function withOpsWrite(
  request: Request,
  opts: HandlerOptions,
  handler: (ctx: WriteHandlerContext) => Promise<HandlerResult>,
): Promise<HandlerResult> {
  // 1. CSRF / origin check.
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  // 2. Global API rate limit.
  if (opts.rateLimit !== false) {
    const rl = await consume("opsApi", requestIp(request));
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // 3. Authenticate.
  const profile = await loadOpsProfile();
  if (profile.status !== "ok") {
    return new Response(JSON.stringify({ error: "unauthenticated" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // 4. Module / role authorization.
  if (opts.module && !canAccess(profile.user.role, opts.module)) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  if (opts.roles && !opts.roles.includes(profile.user.role)) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const supabase = createSupabaseServerClient();
  const service = createSupabaseServiceRoleClient();

  return handler({ request, user: profile.user, supabase, service });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function jsonOk<T>(data: T) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
