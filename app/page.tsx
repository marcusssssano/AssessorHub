import Link from "next/link";
import SearchDashboard from "@/components/SearchDashboard";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-black/10 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">AssessorHub</h1>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">
          Admin
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8">
        <SearchDashboard />
      </main>
    </div>
  );
}
