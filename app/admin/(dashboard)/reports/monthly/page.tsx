import Link from "next/link";
import ReportsManager from "@/components/admin/ReportsManager";

export default function AdminReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/admin/reports" className="text-sm text-[var(--accent)] hover:underline w-fit">
          ← Back to Reports
        </Link>
        <h2 className="text-xl font-semibold">Monthly Reports</h2>
      </div>
      <ReportsManager />
    </div>
  );
}
