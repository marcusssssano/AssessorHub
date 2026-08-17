"use client";

import { useEffect, useState } from "react";
import type { ReportEntry } from "@/lib/types";
import { CATEGORIES, type CategoryKey } from "@/lib/reports";

export default function EditReportEntryModal({
  entry,
  onSave,
  onClose,
}: {
  entry: ReportEntry;
  onSave: (values: { reference_file: string | null; category: CategoryKey; count: number }) => Promise<void>;
  onClose: () => void;
}) {
  const [referenceFile, setReferenceFile] = useState(entry.reference_file ?? "");
  const [count, setCount] = useState(String(entry.count));
  const [category, setCategory] = useState<CategoryKey>(entry.category as CategoryKey);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCountBased = category === "processed_return_mail";

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isCountBased) {
      const n = parseInt(count, 10);
      if (!count.trim() || !Number.isFinite(n) || n <= 0) {
        setError("Enter a count of 1 or more.");
        return;
      }
      setSaving(true);
      try {
        await onSave({ reference_file: null, category, count: n });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setSaving(false);
      }
      return;
    }

    if (!referenceFile.trim()) {
      setError("Reference file name is required.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ reference_file: referenceFile.trim(), category, count: 1 });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--navy-950)]/50 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-[var(--navy-900)]">Edit Entry</h3>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryKey)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {isCountBased ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Count</label>
              <input
                autoFocus
                type="number"
                min={1}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Reference File</label>
              <input
                autoFocus
                value={referenceFile}
                onChange={(e) => setReferenceFile(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-2 mt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
