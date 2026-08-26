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

/** Sentinel "branch" value used to store the Overall Report's caption in report_descriptions. */
export const OVERALL_REPORT_KEY = "__OVERALL__";

/** The categories included in the Overall Report (branch totals) — excludes count-based Processed Return Mail. */
export const OVERALL_REPORT_CATEGORIES = CATEGORIES.filter((c) => c.key !== "processed_return_mail");

export function defaultOverallDescription(activityMonth: string): string {
  return `Overall Report for the month of ${formatMonth(activityMonth)} activity.`;
}

/** Builds a plain-text reference file directory, grouped by category then branch, for download. */
export function buildReferenceDirectoryText(
  activityMonth: string,
  entries: { branch: string; category: string; reference_file: string | null }[]
): string {
  const lines: string[] = [];
  lines.push(`Reference File Directory — ${formatMonth(addMonths(activityMonth, 1))}`);
  lines.push(`Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`);
  lines.push("");

  for (const cat of OVERALL_REPORT_CATEGORIES) {
    lines.push(cat.label.toUpperCase());
    lines.push("-".repeat(cat.label.length));

    for (const branch of BRANCHES) {
      const files = entries
        .filter((e) => e.category === cat.key && e.branch === branch && e.reference_file)
        .map((e) => e.reference_file as string);

      lines.push(`${branch} (${files.length})`);
      if (files.length === 0) {
        lines.push("  (no reference files)");
      } else {
        for (const f of files) lines.push(`  - ${f}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

/** Triggers a browser download of a plain-text file. */
export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
