import TaskTrackerManager from "@/components/admin/TaskTrackerManager";

export default function AdminTaskTrackerPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Task Tracker</h2>
      <TaskTrackerManager />
    </div>
  );
}
