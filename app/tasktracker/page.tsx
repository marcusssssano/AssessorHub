import PublicHeader from "@/components/PublicHeader";
import PublicTaskTrackerViewer from "@/components/PublicTaskTrackerViewer";

export default function TaskTrackerPage() {
  return (
    <div className="flex-1 flex flex-col">
      <PublicHeader active="tasktracker" />

      <main className="flex-1 flex flex-col items-center px-6 py-16 gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold text-[var(--navy-900)]">Task Tracker</h2>
          <p className="text-sm text-slate-500">Track deadlines, status, and progress on ongoing tasks</p>
        </div>
        <PublicTaskTrackerViewer />
      </main>
    </div>
  );
}
