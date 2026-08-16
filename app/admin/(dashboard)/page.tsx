import LinksManager from "@/components/admin/LinksManager";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Manage Links</h2>
      <LinksManager />
    </div>
  );
}
