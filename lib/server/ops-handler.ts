import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { loadOpsProfile, type OpsUser } from "@/lib/ops/auth";
import { canAccess } from "@/lib/ops/nav";
import { assertSameOrigin } from "@/lib/ops/csrf";
import type { UserRole } from "@/types/ops";

export type WriteHandlerContext = {
  request: Request;
  user: OpsUser;
  requestId: string;
  /** RLS-scoped client. Read queries only; writes should use service. */
  supabase: ReturnType<typeof createSupabaseServerClient>;
  /** Service-role client. Use for the actual insert/update after authz. */
  service: ReturnType<typeof createSupabaseServiceRoleClient>;
};

export type HandlerOptions = {
  module?: string;
  roles?: UserRole[];
  rateLimit?: boolean;
};

export type HandlerResult = Response;

function makeRequestId(): string {
  return crypto.randomUUID();
}

function json(status: number, payload: unknown, requestId: string): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", "x-request-id": requestId },
  });
}

export async function withOpsWrite(
  request: Request,
  opts: HandlerOptions,
  handler: (ctx: WriteHandlerContext) => Promise<HandlerResult>,
): Promise<HandlerResult> {
  const requestId = makeRequestId();

  const csrf = assertSameOrigin(request);
  if (csrf) return json(403, { ok: false, error: { code: "csrf_failed" }, requestId }, requestId);


  const profile = await loadOpsProfile();
  if (profile.status !== "ok") {
    return json(401, { ok: false, error: { code: "unauthenticated" }, requestId }, requestId);
  }

  if (opts.module && !canAccess(profile.user.role, opts.module)) {
    return json(403, { ok: false, error: { code: "forbidden" }, requestId }, requestId);
  }
  if (opts.roles && !opts.roles.includes(profile.user.role)) {
    return json(403, { ok: false, error: { code: "forbidden" }, requestId }, requestId);
  }

  const supabase = createSupabaseServerClient();
  const service = createSupabaseServiceRoleClient();

  return handler({ request, user: profile.user, supabase, service, requestId });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function jsonError(status: number, code: string, requestId = makeRequestId()) {
  return json(status, { ok: false, error: { code }, requestId }, requestId);
}

export function jsonOk<T>(data: T, requestId = makeRequestId()) {
  return json(200, { ok: true, data, requestId }, requestId);
}
