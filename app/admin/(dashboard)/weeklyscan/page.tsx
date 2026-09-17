import Link from "next/link";
import WeeklyScanTrackerManager from "@/components/admin/WeeklyScanTrackerManager";

export default function AdminWeeklyScanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/admin/reports" className="text-sm text-[var(--accent)] hover:underline w-fit">
          ← Back to Reports
        </Link>
        <h2 className="text-xl font-semibold">Weekly Scan Return Mail Tracker</h2>
      </div>
      <WeeklyScanTrackerManager />
    </div>
  );
}
