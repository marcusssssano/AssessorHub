import PublicHeader from "@/components/PublicHeader";
import TemplatesBrowser from "@/components/TemplatesBrowser";

export default function TemplatesPage() {
  return (
    <div className="flex-1 flex flex-col">
      <PublicHeader active="templates" />

      <main className="flex-1 flex flex-col items-center px-6 py-16 gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold text-[var(--navy-900)]">
            Note Templates
          </h2>
          <p className="text-sm text-slate-500">
            Click a template to view and copy the note
          </p>
        </div>
        <TemplatesBrowser />
      </main>
    </div>
  );
}
