export const BRANCHES = [
  "AMI",
  "BAP",
  "BPI",
  "CBY",
  "CGR",
  "CSS",
  "EMB",
  "NNJ",
  "MAC",
  "MAS",
  "TPC",
  "PRO",
] as const;

export type Branch = (typeof BRANCHES)[number];

export const CATEGORIES = [
  { key: "exempted_reason_code", label: "Exempted Reason Code" },
  { key: "incorrect_scanned_label", label: "Incorrect Scanned Label" },
  { key: "processed_return_mail", label: "Processed Return Mail" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export function categoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

/** Formats a "YYYY-MM-01" or Date as "MMMM yyyy", e.g. "July 2026". */
export function formatMonth(monthValue: string | Date): string {
  const date = typeof monthValue === "string" ? new Date(monthValue + "T00:00:00") : monthValue;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Adds N months to a "YYYY-MM-01" string and returns a same-format string. */
export function addMonths(monthStr: string, n: number): string {
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + n, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/** The default auto-generated subtitle line for a report. */
export function defaultDescription(activityMonth: string): string {
  return `Please note that this data is for the ${formatMonth(activityMonth)} activity.`;
}

/** Current month as "YYYY-MM-01". */
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Converts a "YYYY-MM-01" date string to the "YYYY-MM" value an <input type="month"> expects. */
export function monthToInputValue(monthStr: string): string {
  return monthStr.slice(0, 7);
}

/** Converts an <input type="month"> value ("YYYY-MM") to our "YYYY-MM-01" storage format. */
export function inputValueToMonth(inputValue: string): string {
  return `${inputValue}-01`;
}
