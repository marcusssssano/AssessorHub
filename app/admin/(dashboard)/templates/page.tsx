import TemplatesManager from "@/components/admin/TemplatesManager";

export default function AdminTemplatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Manage Note Templates</h2>
      <TemplatesManager />
    </div>
  );
}
