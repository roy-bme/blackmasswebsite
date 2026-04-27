/**
 * Password complexity rules for the indaba portal.
 *
 * Mirrored on both the client (for inline form feedback) and the server
 * (which is the trust boundary). Server actions MUST re-run validation —
 * the client check is purely UX.
 */

export type PasswordError =
  | "too_short"
  | "too_long"
  | "missing_upper"
  | "missing_lower"
  | "missing_number"
  | "missing_symbol";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export function validateNewPassword(password: string): PasswordError | null {
  if (password.length < PASSWORD_MIN_LENGTH) return "too_short";
  if (password.length > PASSWORD_MAX_LENGTH) return "too_long";
  if (!/[A-Z]/.test(password)) return "missing_upper";
  if (!/[a-z]/.test(password)) return "missing_lower";
  if (!/[0-9]/.test(password)) return "missing_number";
  if (!/[^A-Za-z0-9]/.test(password)) return "missing_symbol";
  return null;
}

export const PASSWORD_ERROR_MESSAGES: Record<PasswordError, string> = {
  too_short: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
  too_long: `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`,
  missing_upper: "Password must include an uppercase letter.",
  missing_lower: "Password must include a lowercase letter.",
  missing_number: "Password must include a number.",
  missing_symbol: "Password must include a symbol.",
};

export const PASSWORD_RULE_HINT =
  `At least ${PASSWORD_MIN_LENGTH} characters, with uppercase, lowercase, number, and symbol.`;
