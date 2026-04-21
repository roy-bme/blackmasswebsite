/**
 * Pure CSV cell sanitiser — no external deps.
 *
 * Split out from `csv.ts` so the formula-injection rules can be unit-tested
 * without dragging in PostgREST row types. See `__tests__/csv.test.ts`.
 */

export function escapeCell(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "";
  let str = typeof value === "boolean" ? (value ? "yes" : "no") : String(value);
  if (str.length > 0) {
    const first = str.charAt(0);
    if (
      first === "=" ||
      first === "+" ||
      first === "-" ||
      first === "@" ||
      first === "\t" ||
      first === "\r"
    ) {
      str = "'" + str;
    }
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
