const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-Www" for the ISO week containing today, for use as an <input type="week"> default. */
export function currentISOWeek(): string {
  return dateToISOWeek(new Date());
}

export function dateToISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Monday of the given ISO week ("YYYY-Www"), as a "YYYY-MM-DD" string. */
export function mondayOfISOWeek(isoWeek: string): string {
  const [yearStr, weekStr] = isoWeek.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dayOfWeek = simple.getUTCDay();
  const monday = new Date(simple);
  const diff = dayOfWeek <= 4 ? 1 - dayOfWeek : 8 - dayOfWeek;
  monday.setUTCDate(simple.getUTCDate() + diff);

  return monday.toISOString().slice(0, 10);
}

/** The 5 weekday ("YYYY-MM-DD") dates, Monday through Friday, starting from a Monday date string. */
export function weekdayDates(mondayDateStr: string): string[] {
  const monday = new Date(mondayDateStr + "T00:00:00Z");
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** e.g. "August 24 - 28, 2026" or "August 31 - September 4, 2026" */
export function formatWeekRange(mondayDateStr: string): string {
  const dates = weekdayDates(mondayDateStr);
  const monday = new Date(dates[0] + "T00:00:00Z");
  const friday = new Date(dates[4] + "T00:00:00Z");

  const mondayMonth = monday.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const fridayMonth = friday.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const year = friday.toLocaleDateString("en-US", { year: "numeric", timeZone: "UTC" });

  if (mondayMonth === fridayMonth) {
    return `${mondayMonth} ${monday.getUTCDate()} - ${friday.getUTCDate()}, ${year}`;
  }
  return `${mondayMonth} ${monday.getUTCDate()} - ${fridayMonth} ${friday.getUTCDate()}, ${year}`;
}
