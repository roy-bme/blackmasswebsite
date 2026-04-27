/**
 * Whitelisted flash messages.
 *
 * Pages accept `?flash=<key>`; the key must exist in this map or the flash
 * is silently dropped. This prevents reflected-XSS / HTML-injection via the
 * flash param that used to accept free-form decoded text.
 */

export const FLASH_MESSAGES = {
  saved: "Saved.",
  no_access: "You don't have access to that module.",
  deleted: "Deleted.",
  forbidden: "That action is not permitted.",
  unknown_error: "Something went wrong. Try again.",
  promoted: "Suggestion promoted to Identified.",
  approved: "Intro approved.",
  flag_resolved: "Compliance flag resolved.",
  password_changed: "Password updated.",
  password_reset_email_sent:
    "If that email is registered, a reset link is on its way.",
} as const;

export type FlashKey = keyof typeof FLASH_MESSAGES;

export function resolveFlash(raw: string | string[] | undefined): string | null {
  if (!raw) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // malformed encoding — drop silently
    return null;
  }
  if (Object.prototype.hasOwnProperty.call(FLASH_MESSAGES, decoded)) {
    return FLASH_MESSAGES[decoded as FlashKey];
  }
  return null;
}
