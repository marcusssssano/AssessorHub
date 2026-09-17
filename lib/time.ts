/**
 * All "today"/"now" business logic (overdue checks, default dates, month
 * rollover) runs on Pacific Time, since the branches/business this app
 * tracks are California-based even though the admin works from the
 * Philippines. Uses the real America/Los_Angeles zone (not a fixed UTC-8
 * offset) so PST/PDT daylight saving is handled automatically.
 */
export const PACIFIC_TZ = "America/Los_Angeles";

function pacificDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** A Date whose UTC fields equal the current Pacific wall-clock date/time — safe to use with UTC-based date math (getUTCFullYear, Date.UTC, etc). */
export function pacificNow(): Date {
  const p = pacificDateParts(new Date());
  return new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second));
}

/** Today, in Pacific time, as "YYYY-MM-DD". */
export function pacificTodayStr(): string {
  return pacificNow().toISOString().slice(0, 10);
}

/** Converts any ISO timestamp to its Pacific calendar date, as "YYYY-MM-DD". */
export function toPacificDateStr(isoTimestamp: string): string {
  const p = pacificDateParts(new Date(isoTimestamp));
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** The current month, in Pacific time, as "YYYY-MM-01". */
export function pacificCurrentMonth(): string {
  const p = pacificDateParts(new Date());
  return `${p.year}-${String(p.month).padStart(2, "0")}-01`;
}

/** Date-only "September 17, 2026" formatting in Pacific time, for "Generated on" style lines. */
export function formatPacificDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TZ,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Live "Sep 17, 2026, 4:12:05 AM PDT" style formatting for a header clock. */
export function formatPacificDateTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(date);
}
