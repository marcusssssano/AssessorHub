"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ReportEntry } from "@/lib/types";
import {
  BRANCHES,
  CATEGORIES,
  currentMonth,
  inputValueToMonth,
  monthToInputValue,
  type CategoryKey,
} from "@/lib/reports";
import ReportChart from "@/components/ReportChart";
import EditReportEntryModal from "@/components/admin/EditReportEntryModal";

const PAGE_SIZE = 5;

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
  const [editingEntry, setEditingEntry] = useState<ReportEntry | null>(null);
  const [filterText, setFilterText] = useState("");
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});

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
    setVisibleCounts({});
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

  const filteredEntries = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.reference_file.toLowerCase().includes(q));
  }, [entries, filterText]);

  const groups = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: filteredEntries.filter((e) => e.category === cat.key),
    }));
  }, [filteredEntries]);

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
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-[var(--navy-900)]">
              {entries.length} entr{entries.length === 1 ? "y" : "ies"} for {branch} — {monthToInputValue(month)}
            </h3>
            <div className="relative w-full max-w-xs">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter by reference file..."
                className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              />
            </div>
          </div>

          {groups.map((group) => {
            const visible = visibleCounts[group.key] ?? PAGE_SIZE;
            const shown = group.items.slice(0, visible);
            const remaining = group.items.length - shown.length;

            return (
              <div
                key={group.key}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                  <span className="text-sm font-semibold text-[var(--navy-900)]">{group.label}</span>
                  <span className="rounded-full bg-[var(--accent-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
                    {group.items.length}
                  </span>
                </div>

                {group.items.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-slate-400">No entries.</p>
                ) : (
                  <>
                    <ul className="divide-y divide-slate-100">
                      {shown.map((entry) => (
                        <li
                          key={entry.id}
                          className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50/60 transition-colors"
                        >
                          <span className="font-medium text-[var(--navy-900)] truncate">
                            {entry.reference_file}
                          </span>
                          <div className="shrink-0 flex items-center gap-2 text-sm">
                            <button
                              onClick={() => setEditingEntry(entry)}
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
                      ))}
                    </ul>
                    {remaining > 0 && (
                      <button
                        onClick={() =>
                          setVisibleCounts((v) => ({ ...v, [group.key]: visible + PAGE_SIZE }))
                        }
                        className="w-full px-5 py-3 text-sm text-[var(--accent)] hover:bg-slate-50 transition-colors border-t border-slate-100"
                      >
                        Show {Math.min(remaining, PAGE_SIZE)} more ({remaining} remaining)
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editingEntry && (
        <EditReportEntryModal
          entry={editingEntry}
          onSave={(values) => handleEditSave(editingEntry.id, values)}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}
