import PublicHeader from "@/components/PublicHeader";
import PublicReportsViewer from "@/components/PublicReportsViewer";

export default function ReportsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <PublicHeader active="reports" />

      <main className="flex-1 flex flex-col items-center px-6 py-16 gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold text-[var(--navy-900)]">
            Monthly Reports
          </h2>
          <p className="text-sm text-slate-500">
            View and download a branch&apos;s monthly activity report
          </p>
        </div>
        <PublicReportsViewer />
      </main>
    </div>
  );
}
