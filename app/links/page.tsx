import PublicHeader from "@/components/PublicHeader";
import SearchDashboard from "@/components/SearchDashboard";

export default function LinksPage() {
  return (
    <div className="flex-1 flex flex-col">
      <PublicHeader active="links" />

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
