import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicRmpLaunchMaterials from "@/components/PublicRmpLaunchMaterials";

export default function RmpLaunchMaterialsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <PublicHeader active="rmp-launch" />

      <main className="flex-1 flex flex-col items-center px-6 py-16 gap-8">
        <Link href="/rmp-launch" className="self-start ml-[max(1.5rem,calc(50%-32rem))] text-sm text-[var(--accent)] hover:underline">
          ← Back to RMP Launch
        </Link>
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold text-[var(--navy-900)]">RMP Launch — Materials</h2>
        </div>
        <div className="w-full" style={{ maxWidth: 700 }}>
          <PublicRmpLaunchMaterials />
        </div>
      </main>
    </div>
  );
}
