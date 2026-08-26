import Link from "next/link";

const REPORT_LINKS = [
  {
    href: "/admin/reports/monthly",
    title: "Monthly Reports",
    description: "Exempted Reason Code, Incorrect Scanned Label, and Processed Return Mail activity by branch.",
  },
  {
    href: "/admin/tracker",
    title: "CSSC Return Mail Tracker",
    description: "Monthly branch completion status, tracked as Complete or Not Started.",
  },
  {
    href: "/admin/worklog",
    title: "Daily Work Log",
    description: "Daily return mail counts and task notes, rolled up into a weekly report.",
  },
  {
    href: "/admin/tasktracker",
    title: "Task Tracker",
    description: "Deadlines, status, and progress on ongoing tasks across all branches.",
  },
];

export default function AdminReportsHubPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Reports</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORT_LINKS.map((r) => (
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
    </div>
  );
}
