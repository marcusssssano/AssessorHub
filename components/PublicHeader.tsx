import Link from "next/link";

export default function PublicHeader({ active }: { active: "links" | "templates" | "reports" }) {
  return (
    <header className="bg-[var(--navy-900)] border-b border-[var(--navy-700)] px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white font-bold text-sm">
          AH
        </div>
        <h1 className="text-lg font-semibold text-white tracking-tight">
          AssessorHub
        </h1>
      </div>
      <nav className="flex items-center gap-2">
        <Link
          href="/"
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
          href="/admin"
          className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/80 hover:text-white hover:border-white/40 transition-colors"
        >
          Admin
        </Link>
      </nav>
    </header>
  );
}
