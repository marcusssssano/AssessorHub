import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import TrackerChoiceCard from "@/components/TrackerChoiceCard";

const REPORT_LINKS = [
  {
    href: "/reports/monthly",
    title: "Scan Audit Report",
    description: "Exempted Reason Code, Incorrect Scanned Label, and Processed Return Mail activity by branch.",
  },
  {
    href: "/worklog",
    title: "Daily Work Log",
    description: "Daily return mail counts and task notes, rolled up into a weekly report.",
  },
  {
    href: "/tasktracker",
    title: "Task Tracker",
    description: "Deadlines, status, and progress on ongoing tasks across all branches.",
  },
];

export default function ReportsHubPage() {
  return (
    <div className="flex-1 flex flex-col">
      <PublicHeader active="reports" />

      <main className="flex-1 flex flex-col items-center px-6 py-16 gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold text-[var(--navy-900)]">Reports</h2>
          <p className="text-sm text-slate-500">Choose a report to view and download</p>
        </div>

        <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href={REPORT_LINKS[0].href}
            className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-light)]/40"
          >
            <span className="text-base font-semibold text-[var(--navy-900)] group-hover:text-[var(--accent)] transition-colors">
              {REPORT_LINKS[0].title}
            </span>
            <span className="text-sm text-slate-500">{REPORT_LINKS[0].description}</span>
          </Link>

          <TrackerChoiceCard csscHref="/tracker" regularHref="/tracker/regular" />

          {REPORT_LINKS.slice(1).map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-light)]/40"
            >
              <span className="text-base font-semibold text-[var(--navy-900)] group-hover:text-[var(--accent)] transition-colors">
                {r.title}
              </span>
              <span className="text-sm text-slate-500">{r.description}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
