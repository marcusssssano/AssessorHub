import Link from "next/link";
import UserBadge from "./UserBadge";

export default function PublicHeader({
  active,
}: {
  active: "links" | "templates" | "reports" | "tracker" | "worklog";
}) {
  return (
    <header className="bg-[var(--navy-900)] border-b border-[var(--navy-700)] px-6 py-5 flex flex-wrap items-center justify-between gap-y-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white font-bold text-sm">
          AH
        </div>
        <h1 className="text-lg font-semibold text-white tracking-tight">
          AssessorHub
          <UserBadge />
        </h1>
      </div>
      <nav className="flex flex-wrap items-center gap-2">
        <Link
          href="/links"
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            active === "links"
              ? "border-white/40 text-white bg-white/10"
              : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
          }`}
        >
          Links
        </Link>
        <Link
          href="/templates"
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            active === "templates"
              ? "border-white/40 text-white bg-white/10"
              : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
          }`}
        >
          Templates
        </Link>
        <Link
          href="/reports"
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            active === "reports"
              ? "border-white/40 text-white bg-white/10"
              : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
          }`}
        >
          Reports
        </Link>
        <Link
          href="/tracker"
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            active === "tracker"
              ? "border-white/40 text-white bg-white/10"
              : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
          }`}
        >
          Tracker
        </Link>
        <Link
          href="/worklog"
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            active === "worklog"
              ? "border-white/40 text-white bg-white/10"
              : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
          }`}
        >
          Work Log
        </Link>
        <Link
          href="/admin"
          className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/80 hover:text-white hover:border-white/40 transition-colors"
        >
          Admin
        </Link>
        <Link
          href="/"
          className="rounded-full px-3 py-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
          title="Switch user"
        >
          Switch User
        </Link>
      </nav>
    </header>
  );
}
