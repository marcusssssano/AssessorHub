import Link from "next/link";
import SignOutButton from "@/components/admin/SignOutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-[var(--navy-900)] border-b border-[var(--navy-700)] px-6 py-5 flex flex-wrap items-center justify-between gap-y-3">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white font-bold text-sm">
              V
            </div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              Vantage Admin
            </h1>
          </div>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            <Link
              href="/admin"
              className="rounded-full px-4 py-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Links
            </Link>
            <Link
              href="/admin/import"
              className="rounded-full px-4 py-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Bulk Import
            </Link>
            <Link
              href="/admin/templates"
              className="rounded-full px-4 py-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Note Templates
            </Link>
            <Link
              href="/admin/reports"
              className="rounded-full px-4 py-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Reports
            </Link>
            <Link
              href="/admin/users"
              className="rounded-full px-4 py-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Users
            </Link>
            <Link
              href="/links"
              className="rounded-full px-4 py-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              View Dashboard
            </Link>
          </nav>
        </div>
        <SignOutButton />
      </header>

      <main className="flex-1 px-6 py-10 max-w-6xl w-full mx-auto">{children}</main>
    </div>
  );
}
