import Link from "next/link";
import SignOutButton from "@/components/admin/SignOutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-black/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold">AssessorHub Admin</h1>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Links
            </Link>
            <Link href="/admin/import" className="text-gray-600 hover:text-gray-900">
              Bulk Import
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              View Dashboard
            </Link>
          </nav>
        </div>
        <SignOutButton />
      </header>

      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
