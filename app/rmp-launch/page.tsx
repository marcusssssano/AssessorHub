import PublicHeader from "@/components/PublicHeader";
import PublicRmpLaunchViewer from "@/components/PublicRmpLaunchViewer";

export default function RmpLaunchPage() {
  return (
    <div className="flex-1 flex flex-col">
      <PublicHeader active="rmp-launch" />

      <main className="flex-1 flex flex-col items-center px-6 py-16 gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold text-[var(--navy-900)]">RMP Launch</h2>
          <p className="text-sm text-slate-500">Training topics and progress</p>
        </div>
        <div className="w-full" style={{ maxWidth: 900 }}>
          <PublicRmpLaunchViewer />
        </div>
      </main>
    </div>
  );
}
