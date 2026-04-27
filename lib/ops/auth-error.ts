/**
 * Opaque token set for the /auth/auth-error page.
 *
 * The login form maps every Supabase error path to one of these tokens and
 * redirects with `?reason=<token>`. The page re-validates the token against
 * this list before rendering hardcoded copy, so an attacker cannot inject an
 * arbitrary "Reason: …" string.
 */

export const AUTH_ERROR_TOKENS = {
  invalid_credentials:
    "Email or password didn't match. Try again, or reset your password if you've forgotten it.",
  rate_limited:
    "Too many attempts. Wait a minute and try again.",
  profile_not_provisioned:
    "Your email isn't provisioned for portal access. Ask an admin to add you.",
  account_disabled: "Your portal access has been disabled. Contact an admin.",
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
export function tokenFromSupabaseError(
  message: string | null | undefined,
): AuthErrorToken {
  if (!message) return "unknown";
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "invalid_credentials";
  if (lower.includes("invalid") && lower.includes("credentials"))
    return "invalid_credentials";
  if (lower.includes("rate") || lower.includes("too many"))
    return "rate_limited";
  return "unknown";
}
