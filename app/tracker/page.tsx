import PublicHeader from "@/components/PublicHeader";
import PublicTrackerViewer from "@/components/PublicTrackerViewer";

export default function TrackerPage() {
  return (
    <div className="flex-1 flex flex-col">
      <PublicHeader active="tracker" />

      <main className="flex-1 flex flex-col items-center px-6 py-16 gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold text-[var(--navy-900)]">
            CSSC Return Mail Tracker
          </h2>
          <p className="text-sm text-slate-500">
            View and download the monthly branch completion tracker
          </p>
        </div>
        <PublicTrackerViewer />
      </main>
    </div>
  );
}
