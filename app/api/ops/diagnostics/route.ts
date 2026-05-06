import { loadOpsProfile } from "@/lib/ops/auth";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "HEALTH_CHECK_TOKEN",
] as const;

export async function GET() {
  const profile = await loadOpsProfile();
  if (profile.status !== "ok" || profile.user.role !== "admin") {
    return Response.json({ ok: false, error: { code: "forbidden" } }, { status: 403 });
  }

  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  return Response.json({
    ok: true,
    data: {
      nodeEnv: process.env.NODE_ENV ?? "unknown",
      missingEnv: missing,
      upstashConfigured: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    },
  });
}
