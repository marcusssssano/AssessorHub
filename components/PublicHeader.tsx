import Link from "next/link";
import PacificClock from "./PacificClock";
import UserBadge from "./UserBadge";

export default function PublicHeader({
  active,
}: {
  active: "links" | "templates" | "reports" | "rmp-launch";
}) {
  return (
    <header className="bg-[var(--navy-900)] border-b border-[var(--navy-700)] px-6 py-5 flex flex-wrap items-center justify-between gap-y-3">
      <div className="flex items-center gap-2.5">
        <img src="/logo-mark.png" alt="Vantage" className="h-8 w-8 rounded-lg object-cover" />
        <h1 className="text-lg font-semibold text-white tracking-tight">
          Vantage
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
          href="/rmp-launch"
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            active === "rmp-launch"
              ? "border-white/40 text-white bg-white/10"
              : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
          }`}
        >
          RMP Launch
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
        <PacificClock className="ml-1 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60" />
      </nav>
    </header>
  );
}
