const DAY_FMT = new Intl.DateTimeFormat("en-GB", { day: "numeric" });
const MONTH_YEAR_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const DAY_MONTH_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

/**
 * "20–25 Apr 2026" for same-month, "28 Apr – 3 May 2026" for cross-month,
 * "5 May 2026" for a single date.
 */
export function formatDateRange(
  startIso: string,
  endIso: string | null,
): string {
  const start = parseIsoDate(startIso);
  if (!endIso || endIso === startIso) {
    return MONTH_YEAR_FMT.format(start);
  }
  const end = parseIsoDate(endIso);
  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    return `${DAY_FMT.format(start)}\u2013${MONTH_YEAR_FMT.format(end)}`;
  }

  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const startLabel = sameYear
    ? DAY_MONTH_FMT.format(start)
    : MONTH_YEAR_FMT.format(start);
  return `${startLabel} \u2013 ${MONTH_YEAR_FMT.format(end)}`;
}

/**
 * Parse an ISO date (yyyy-mm-dd) as UTC midnight to avoid TZ drift when the
 * server renders in one zone and the client in another.
 */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map((n) => Number.parseInt(n, 10));
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

/** Midnight UTC for today. */
export function todayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function daysBetween(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.round(ms / 86_400_000);
}
