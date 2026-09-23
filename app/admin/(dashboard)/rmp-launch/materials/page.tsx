import Link from "next/link";
import RmpLaunchMaterials from "@/components/admin/RmpLaunchMaterials";

export default function AdminRmpLaunchMaterialsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/admin/rmp-launch" className="text-sm text-[var(--accent)] hover:underline w-fit">
          ← Back to RMP Launch
        </Link>
        <h2 className="text-xl font-semibold">RMP Launch — Materials</h2>
      </div>
      <RmpLaunchMaterials />
    </div>
  );
}
