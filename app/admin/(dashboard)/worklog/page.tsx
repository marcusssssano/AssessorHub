import Link from "next/link";
import WorkLogManager from "@/components/admin/WorkLogManager";

export default function AdminWorkLogPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/admin/reports" className="text-sm text-[var(--accent)] hover:underline w-fit">
          ← Back to Reports
        </Link>
        <h2 className="text-xl font-semibold">Daily Work Log</h2>
      </div>
      <WorkLogManager />
    </div>
  );
}
