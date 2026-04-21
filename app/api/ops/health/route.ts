import { consume, requestIp } from "@/lib/ratelimit";

/**
 * Indaba health endpoint.
 *
 * Requires an `X-Health-Token` header matching HEALTH_CHECK_TOKEN so that
 * it isn't trivially crawlable (and so the health surface cannot be used
 * as an amplification / probing surface by public scanners). Rate-limited
 * per IP on top.
 */
export async function GET(request: Request) {
  const expected = process.env.HEALTH_CHECK_TOKEN;
  const provided = request.headers.get("x-health-token");
  if (!expected || provided !== expected) {
    return new Response("forbidden", { status: 403 });
  }

  const rl = await consume("health", requestIp(request));
  if (!rl.allowed) {
    return new Response("too many requests", { status: 429 });
  }

  return Response.json({
    status: "ok",
    service: "indaba",
    timestamp: new Date().toISOString(),
  });
}
