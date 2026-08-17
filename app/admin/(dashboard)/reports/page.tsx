import ReportsManager from "@/components/admin/ReportsManager";

export default function AdminReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Monthly Reports</h2>
      <ReportsManager />
    </div>
  );
}
