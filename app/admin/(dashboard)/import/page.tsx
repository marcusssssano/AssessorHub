import CsvImport from "@/components/admin/CsvImport";

export default function ImportPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Bulk Import from CSV</h2>
      <CsvImport />
    </div>
  );
}
