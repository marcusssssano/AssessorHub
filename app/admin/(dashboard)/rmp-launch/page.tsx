import Link from "next/link";
import RmpLaunchManager from "@/components/admin/RmpLaunchManager";

export default function AdminRmpLaunchPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/admin" className="text-sm text-[var(--accent)] hover:underline w-fit">
          ← Back to Admin
        </Link>
        <h2 className="text-xl font-semibold">RMP Launch</h2>
      </div>
      <RmpLaunchManager />
    </div>
  );
}
