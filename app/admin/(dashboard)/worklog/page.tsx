import WorkLogManager from "@/components/admin/WorkLogManager";

export default function AdminWorkLogPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Daily Work Log</h2>
      <WorkLogManager />
    </div>
  );
}
