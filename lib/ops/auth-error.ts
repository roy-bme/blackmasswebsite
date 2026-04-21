/**
 * Opaque token set for the /auth/auth-error page.
 *
 * The callback Route Handler maps every Supabase error path to one of these
 * tokens and redirects with `?reason=<token>`. The page re-validates the
 * token against this list before rendering hardcoded copy, so an attacker
 * cannot inject an arbitrary "Reason: …" string.
 */

export const AUTH_ERROR_TOKENS = {
  expired: "That magic link has expired. Request a new one.",
  consumed: "That magic link has already been used.",
  profile_not_provisioned:
    "Your email isn't provisioned for portal access. Ask an admin to add you.",
  account_disabled:
    "Your portal access has been disabled. Contact an admin.",
  profile_lookup_failed:
    "We couldn't load your profile. Try again in a minute.",
  unknown: "Something went wrong. Try signing in again.",
} as const;

export type AuthErrorToken = keyof typeof AUTH_ERROR_TOKENS;

export function resolveAuthErrorToken(
  raw: string | string[] | undefined,
): AuthErrorToken {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value === "string" && value in AUTH_ERROR_TOKENS) {
    return value as AuthErrorToken;
  }
  return "unknown";
}

export function errorMessageForToken(token: AuthErrorToken): string {
  return AUTH_ERROR_TOKENS[token];
}

/** Map a Supabase error message to an opaque token. */
export function tokenFromSupabaseError(message: string | null | undefined): AuthErrorToken {
  if (!message) return "unknown";
  const lower = message.toLowerCase();
  if (lower.includes("expired")) return "expired";
  if (lower.includes("otp") && lower.includes("invalid")) return "consumed";
  if (lower.includes("already used") || lower.includes("consumed")) {
    return "consumed";
  }
  return "unknown";
}
