import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicTrackerViewer from "@/components/PublicTrackerViewer";

export default function RegularTrackerPage() {
  return (
    <div className="flex-1 flex flex-col">
      <PublicHeader active="reports" />

      <main className="flex-1 flex flex-col items-center px-6 py-16 gap-8">
        <Link
          href="/reports"
          className="self-start ml-[max(1.5rem,calc(50%-32rem))] text-sm text-[var(--accent)] hover:underline"
        >
          ← Back to Reports
        </Link>
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold text-[var(--navy-900)]">
            Regular Return Mail Tracker
          </h2>
          <p className="text-sm text-slate-500">
            View and download the monthly branch completion tracker
          </p>
        </div>
        <PublicTrackerViewer trackerType="regular" />
      </main>
    </div>
  );
}
