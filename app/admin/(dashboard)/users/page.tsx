import UsersManager from "@/components/admin/UsersManager";

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Profiles</h2>
        <p className="text-sm text-slate-500">
          These are the names shown on the &quot;Who&apos;s using AssessorHub?&quot; screen.
        </p>
      </div>
      <UsersManager />
    </div>
  );
}
