"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ReportEntry } from "@/lib/types";
import {
  BRANCHES,
  CATEGORIES,
  categoryLabel,
  currentMonth,
  inputValueToMonth,
  monthToInputValue,
  type CategoryKey,
} from "@/lib/reports";
import ReportChart from "@/components/ReportChart";

export default function ReportsManager() {
  const supabase = useMemo(() => createClient(), []);
  const [month, setMonth] = useState(currentMonth());
  const [branch, setBranch] = useState<string>(BRANCHES[0]);

  const [referenceFile, setReferenceFile] = useState("");
  const [category, setCategory] = useState<CategoryKey>(CATEGORIES[0].key);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadEntries() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("report_entries")
      .select("*")
      .eq("activity_month", month)
      .eq("branch", branch)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setEntries(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, branch]);

  const counts = useMemo(() => {
    const base: Record<CategoryKey, number> = {
      exempted_reason_code: 0,
      incorrect_scanned_label: 0,
      processed_return_mail: 0,
    };
    for (const e of entries) {
      if (e.category in base) base[e.category as CategoryKey]++;
    }
    return base;
  }, [entries]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);

    if (!referenceFile.trim()) {
      setAddError("Reference file name is required.");
      return;
    }

    setAdding(true);
    const { error } = await supabase.from("report_entries").insert({
      activity_month: month,
      branch,
      reference_file: referenceFile.trim(),
      category,
    });
    setAdding(false);

    if (error) {
      setAddError(error.message);
      return;
    }

    setReferenceFile("");
    await loadEntries();
  }

  async function handleDelete(id: string, referenceFile: string) {
    if (!confirm(`Delete entry "${referenceFile}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("report_entries").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await loadEntries();
  }

  async function handleEditSave(
    id: string,
    values: { reference_file: string; category: CategoryKey }
  ) {
    const { error } = await supabase.from("report_entries").update(values).eq("id", id);
    if (error) throw error;
    setEditingId(null);
    await loadEntries();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Activity Month</label>
            <input
              type="month"
              value={monthToInputValue(month)}
              onChange={(e) => setMonth(inputValueToMonth(e.target.value))}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4">
          <div className="flex flex-1 min-w-[200px] flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Reference File</label>
            <input
              value={referenceFile}
              onChange={(e) => setReferenceFile(e.target.value)}
              placeholder="e.g. 1002_23.png"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryKey)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
          >
            {adding ? "Adding..." : "+ Add Entry"}
          </button>
        </form>
        {addError && <p className="text-sm text-red-600">{addError}</p>}
      </div>

      <ReportChart activityMonth={month} branch={branch} counts={counts} fileNamePrefix="AssessorHub-Report" />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <p className="px-5 py-3 text-xs font-medium text-slate-400 border-b border-slate-100 bg-slate-50/50">
            {entries.length} entr{entries.length === 1 ? "y" : "ies"} for {branch} — {monthToInputValue(month)}
          </p>
          <ul className="divide-y divide-slate-100">
            {entries.map((entry) =>
              editingId === entry.id ? (
                <EntryEditRow
                  key={entry.id}
                  entry={entry}
                  onSave={(values) => handleEditSave(entry.id, values)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="min-w-0 flex flex-col">
                    <span className="font-medium text-[var(--navy-900)] truncate">
                      {entry.reference_file}
                    </span>
                    <span className="text-xs text-slate-400">{categoryLabel(entry.category)}</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 text-sm">
                    <button
                      onClick={() => setEditingId(entry.id)}
                      className="rounded-full px-3 py-1.5 text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id, entry.reference_file)}
                      className="rounded-full px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function EntryEditRow({
  entry,
  onSave,
  onCancel,
}: {
  entry: ReportEntry;
  onSave: (values: { reference_file: string; category: CategoryKey }) => Promise<void>;
  onCancel: () => void;
}) {
  const [referenceFile, setReferenceFile] = useState(entry.reference_file);
  const [category, setCategory] = useState<CategoryKey>(entry.category as CategoryKey);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!referenceFile.trim()) {
      setError("Reference file name is required.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ reference_file: referenceFile.trim(), category });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="p-5 bg-[var(--accent-light)]/40">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-1 min-w-[200px] flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500">Reference File</label>
          <input
            value={referenceFile}
            onChange={(e) => setReferenceFile(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>
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
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </li>
  );
}
