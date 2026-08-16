import Link from "next/link";
import SearchDashboard from "@/components/SearchDashboard";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-[var(--navy-900)] border-b border-[var(--navy-700)] px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white font-bold text-sm">
            AH
          </div>
          <h1 className="text-lg font-semibold text-white tracking-tight">
            AssessorHub
          </h1>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/80 hover:text-white hover:border-white/40 transition-colors"
        >
          Admin
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-16 gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold text-[var(--navy-900)]">
            Find a link
          </h2>
          <p className="text-sm text-slate-500">
            Search county assessor sites, parcel viewers, and more
          </p>
        </div>
        <SearchDashboard />
      </main>
    </div>
  );
}
