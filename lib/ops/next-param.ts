/**
 * Strict validation of the `next` post-auth redirect param.
 *
 * We only ever send authenticated users to a first-path-segment that we
 * know corresponds to an in-portal page. Everything else (protocol-relative
 * URLs, backslashes, double-slashes, @-prefixed authority, URL-encoded
 * slashes) is rejected in favour of /dashboard.
 */

const ALLOWED_FIRST_SEGMENTS = new Set([
  "dashboard",
  "directory",
  "map",
  "graph",
  "intros",
  "events",
  "feed",
  "zitf",
  "settings",
]);

const NEXT_RE = /^\/[A-Za-z0-9_\-/?=&.]*$/;
const FORBIDDEN_RE = /(\\|@|%2f%2f|\/\/)/i;

export const DEFAULT_NEXT = "/dashboard";

export function safeNext(value: string | null | undefined): string {
  if (!value) return DEFAULT_NEXT;
  if (typeof value !== "string") return DEFAULT_NEXT;
  if (value.length > 512) return DEFAULT_NEXT;
  if (!NEXT_RE.test(value)) return DEFAULT_NEXT;
  if (FORBIDDEN_RE.test(value)) return DEFAULT_NEXT;
  const firstSegment = value.slice(1).split(/[/?#]/)[0];
  if (!firstSegment) return DEFAULT_NEXT;
  if (!ALLOWED_FIRST_SEGMENTS.has(firstSegment)) return DEFAULT_NEXT;
  return value;
}
