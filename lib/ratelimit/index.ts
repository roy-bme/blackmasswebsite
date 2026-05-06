import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimiterConfig = {
  requests: number;
  window: `${number}${"ms" | "s" | "m" | "h" | "d"}`;
  prefix: string;
};

const isProd = process.env.NODE_ENV === "production";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (isProd) {
      throw new Error("Missing Upstash Redis env vars in production");
    }
    return null;
  }
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

const limiterConfigs = {
  signInIp: { requests: 5, window: "15m", prefix: "rl:signin:ip" },
  signInEmail: { requests: 10, window: "1h", prefix: "rl:signin:email" },
  authCallback: { requests: 10, window: "15m", prefix: "rl:authcb" },
  signout: { requests: 30, window: "1h", prefix: "rl:signout" },
  passwordResetIp: { requests: 5, window: "15m", prefix: "rl:pwreset:ip" },
  passwordResetEmail: { requests: 5, window: "1h", prefix: "rl:pwreset:email" },
  opsApi: { requests: 60, window: "1m", prefix: "rl:opsapi" },
  health: { requests: 60, window: "1m", prefix: "rl:health" },
  geocode: { requests: 30, window: "1m", prefix: "rl:geocode" },
} satisfies Record<string, LimiterConfig>;

export type LimiterName = keyof typeof limiterConfigs;

const limiterCache = new Map<LimiterName, Ratelimit | null>();

function getLimiter(name: LimiterName): Ratelimit | null {
  if (limiterCache.has(name)) {
    return limiterCache.get(name) ?? null;
  }
  const limiter = createLimiter(limiterConfigs[name]);
  limiterCache.set(name, limiter);
  return limiter;
}

export async function consume(name: LimiterName, key: string): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const limiter = getLimiter(name);
  if (!limiter) return { allowed: true, remaining: -1, reset: 0 };
  const res = await limiter.limit(key);
  return { allowed: res.success, remaining: res.remaining, reset: res.reset };
}

export function requestIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
