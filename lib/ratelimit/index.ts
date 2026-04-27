import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Upstash Redis-backed sliding-window rate limiters.
 *
 * When UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are unset (dev or
 * preview without Redis), we return a disabled limiter that always allows
 * the request. Production deployments MUST set both env vars.
 */

type LimiterConfig = {
  requests: number;
  window: `${number}${"ms" | "s" | "m" | "h" | "d"}`;
  prefix: string;
};

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function createLimiter(config: LimiterConfig): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: false,
    prefix: config.prefix,
  });
}

const limiters = {
  signInIp: createLimiter({ requests: 5, window: "15m", prefix: "rl:signin:ip" }),
  signInEmail: createLimiter({ requests: 10, window: "1h", prefix: "rl:signin:email" }),
  authCallback: createLimiter({ requests: 10, window: "15m", prefix: "rl:authcb" }),
  signout: createLimiter({ requests: 30, window: "1h", prefix: "rl:signout" }),
  passwordResetIp: createLimiter({
    requests: 5,
    window: "15m",
    prefix: "rl:pwreset:ip",
  }),
  passwordResetEmail: createLimiter({
    requests: 5,
    window: "1h",
    prefix: "rl:pwreset:email",
  }),
  opsApi: createLimiter({ requests: 60, window: "1m", prefix: "rl:opsapi" }),
  health: createLimiter({ requests: 60, window: "1m", prefix: "rl:health" }),
  geocode: createLimiter({ requests: 30, window: "1m", prefix: "rl:geocode" }),
};

export type LimiterName = keyof typeof limiters;

export async function consume(
  name: LimiterName,
  key: string,
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const limiter = limiters[name];
  if (!limiter) {
    return { allowed: true, remaining: -1, reset: 0 };
  }
  const res = await limiter.limit(key);
  return {
    allowed: res.success,
    remaining: res.remaining,
    reset: res.reset,
  };
}

/** Extract a best-effort IP for rate-limiting keys. */
export function requestIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
