import type { TaskStatus } from "./types";

export const STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Completed"];

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(fromDateStr + "T00:00:00Z").getTime();
  const to = new Date(toDateStr + "T00:00:00Z").getTime();
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr.length > 10 ? dateStr : dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export type TimeToFinishTone = "overdue" | "today" | "upcoming" | "completed-early" | "completed-late" | "completed-ontime";

export interface TimeToFinish {
  label: string;
  tone: TimeToFinishTone;
}

/** Auto-computed "Time to Finish" column: live countdown for open tasks, a finish stamp for completed ones. */
export function computeTimeToFinish(
  deadline: string,
  status: TaskStatus,
  completedAt: string | null
): TimeToFinish {
  if (status === "Completed" && completedAt) {
    const completedDateStr = completedAt.slice(0, 10);
    const diff = daysBetween(deadline, completedDateStr);
    if (diff > 0) return { label: `${diff} day${diff === 1 ? "" : "s"} late`, tone: "completed-late" };
    if (diff < 0) return { label: `${Math.abs(diff)} day${diff === -1 ? "" : "s"} early`, tone: "completed-early" };
    return { label: "On time", tone: "completed-ontime" };
  }

  const diff = daysBetween(todayStr(), deadline);
  if (diff < 0) return { label: `${Math.abs(diff)} Day${diff === -1 ? "" : "s"} Overdue`, tone: "overdue" };
  if (diff === 0) return { label: "Due Today", tone: "today" };
  return { label: `${diff} Day${diff === 1 ? "" : "s"} Left`, tone: "upcoming" };
}

export const TONE_COLORS: Record<TimeToFinishTone, string> = {
  overdue: "#dc2626",
  today: "#d97706",
  upcoming: "#334155",
  "completed-early": "#16a34a",
  "completed-late": "#d97706",
  "completed-ontime": "#16a34a",
};

export function statusColor(status: TaskStatus): string {
  switch (status) {
    case "Completed":
      return "#16a34a";
    case "In Progress":
      return "#d97706";
    default:
      return "#64748b";
  }
}
