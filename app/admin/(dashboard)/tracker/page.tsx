import TrackerManager from "@/components/admin/TrackerManager";

export default function AdminTrackerPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">CSSC Return Mail Tracker</h2>
      <TrackerManager />
    </div>
  );
}
