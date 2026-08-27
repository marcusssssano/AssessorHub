import Link from "next/link";
import TrackerManager from "@/components/admin/TrackerManager";

export default function AdminRegularTrackerPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/admin/reports" className="text-sm text-[var(--accent)] hover:underline w-fit">
          ← Back to Reports
        </Link>
        <h2 className="text-xl font-semibold">Regular Return Mail Tracker</h2>
      </div>
      <TrackerManager trackerType="regular" />
    </div>
  );
}
