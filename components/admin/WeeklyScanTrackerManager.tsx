"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { currentMonth, inputValueToMonth, monthToInputValue } from "@/lib/reports";
import type { WeeklyScanBranch, WeeklyScanEntry } from "@/lib/types";
import WeeklyScanChart from "@/components/WeeklyScanChart";

const WEEK_KEYS = ["week1", "week2", "week3", "week4", "week5"] as const;
type WeekKey = (typeof WEEK_KEYS)[number];

interface RowState {
  week1: boolean;
  week2: boolean;
  week3: boolean;
  week4: boolean;
  week5: boolean;
  note: string;
}

function emptyRow(): RowState {
  return { week1: false, week2: false, week3: false, week4: false, week5: false, note: "" };
}

export default function WeeklyScanTrackerManager() {
  const supabase = useMemo(() => createClient(), []);
  const [month, setMonth] = useState(currentMonth());

  const [branches, setBranches] = useState<WeeklyScanBranch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [newBranchName, setNewBranchName] = useState("");
  const [addingBranch, setAddingBranch] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editingBranchName, setEditingBranchName] = useState("");

  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [loadingRows, setLoadingRows] = useState(true);
  const [savingNoteFor, setSavingNoteFor] = useState<string | null>(null);
  const [noteSavedFor, setNoteSavedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadBranches() {
    setLoadingBranches(true);
    const { data, error } = await supabase
      .from("weekly_scan_branches")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .limit(500);

    if (error) {
      setError(error.message);
    } else {
      setBranches(data ?? []);
    }
    setLoadingBranches(false);
  }

  async function loadRows() {
    setLoadingRows(true);
    const { data, error } = await supabase
      .from("weekly_scan_entries")
      .select("*")
      .eq("activity_month", month)
      .limit(500);

    if (error) {
      setError(error.message);
    } else {
      const map: Record<string, RowState> = {};
      for (const e of (data ?? []) as WeeklyScanEntry[]) {
        map[e.branch_id] = {
          week1: e.week1,
          week2: e.week2,
          week3: e.week3,
          week4: e.week4,
          week5: e.week5,
          note: e.note ?? "",
        };
      }
      setRows(map);
    }
    setLoadingRows(false);
  }

  useEffect(() => {
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  function rowFor(branchId: string): RowState {
    return rows[branchId] ?? emptyRow();
  }

  async function persistRow(branchId: string, row: RowState) {
    const { error } = await supabase.from("weekly_scan_entries").upsert(
      {
        activity_month: month,
        branch_id: branchId,
        week1: row.week1,
        week2: row.week2,
        week3: row.week3,
        week4: row.week4,
        week5: row.week5,
        note: row.note.trim() || null,
      },
      { onConflict: "activity_month,branch_id" }
    );
    if (error) setError(error.message);
    return !error;
  }

  async function handleToggleWeek(branchId: string, weekKey: WeekKey) {
    const current = rowFor(branchId);
    const next = { ...current, [weekKey]: !current[weekKey] };
    setRows((prev) => ({ ...prev, [branchId]: next }));
    const ok = await persistRow(branchId, next);
    if (!ok) setRows((prev) => ({ ...prev, [branchId]: current }));
  }

  function handleNoteChange(branchId: string, value: string) {
    setRows((prev) => ({ ...prev, [branchId]: { ...rowFor(branchId), note: value } }));
  }

  async function handleSaveNote(branchId: string) {
    setSavingNoteFor(branchId);
    setNoteSavedFor(null);
    const ok = await persistRow(branchId, rowFor(branchId));
    setSavingNoteFor(null);
    if (ok) {
      setNoteSavedFor(branchId);
      setTimeout(() => setNoteSavedFor(null), 2000);
    }
  }

  async function handleAddBranch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!newBranchName.trim()) {
      setError("Branch name is required.");
      return;
    }
    setAddingBranch(true);
    const { error } = await supabase
      .from("weekly_scan_branches")
      .insert({ name: newBranchName.trim().toUpperCase(), sort_order: branches.length });
    setAddingBranch(false);

    if (error) {
      setError(error.message);
      return;
    }
    setNewBranchName("");
    await loadBranches();
  }

  async function handleSaveBranchEdit(id: string) {
    if (!editingBranchName.trim()) return;
    const { error } = await supabase
      .from("weekly_scan_branches")
      .update({ name: editingBranchName.trim().toUpperCase() })
      .eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setEditingBranchId(null);
    await loadBranches();
  }

  async function handleDeleteBranch(id: string, name: string) {
    if (
      !confirm(
        `Delete branch "${name}"? This removes it from the tracker and deletes all of its recorded weekly history. This cannot be undone.`
      )
    )
      return;
    const { error } = await supabase.from("weekly_scan_branches").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await loadBranches();
    await loadRows();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 w-56">
          <label className="text-xs font-medium text-slate-500">Report Month</label>
          <input
            type="month"
            value={monthToInputValue(month)}
            onChange={(e) => setMonth(inputValueToMonth(e.target.value))}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>
      </div>

      <details className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-[var(--navy-900)]">
          Manage Branches
        </summary>
        <div className="flex flex-col gap-4 border-t border-slate-100 p-5">
          <form onSubmit={handleAddBranch} className="flex items-end gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">New branch name</label>
              <input
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="e.g. AMI"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              />
            </div>
            <button
              type="submit"
              disabled={addingBranch}
              className="rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
            >
              {addingBranch ? "Adding..." : "+ Add Branch"}
            </button>
          </form>

          {loadingBranches ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : branches.length === 0 ? (
            <p className="text-sm text-slate-400">No branches yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-100">
              {branches.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  {editingBranchId === b.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        autoFocus
                        value={editingBranchName}
                        onChange={(e) => setEditingBranchName(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                      />
                      <button
                        onClick={() => handleSaveBranchEdit(b.id)}
                        className="rounded-full bg-[var(--navy-900)] px-3 py-1.5 text-xs text-white font-medium hover:bg-[var(--navy-800)] transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingBranchId(null)}
                        className="rounded-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-[var(--navy-900)]">{b.name}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => {
                            setEditingBranchId(b.id);
                            setEditingBranchName(b.name);
                          }}
                          className="rounded-full px-3 py-1.5 text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(b.id, b.name)}
                          className="rounded-full px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loadingBranches || loadingRows ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : branches.length === 0 ? (
        <p className="text-sm text-slate-400">Add at least one branch above to start tracking.</p>
      ) : (
        <>
          <details className="rounded-2xl border border-slate-200 bg-white shadow-sm" open>
            <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-[var(--navy-900)]">
              Weekly scan status for {monthToInputValue(month)}
            </summary>
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                    <th className="px-5 py-3">Branch</th>
                    {WEEK_KEYS.map((_, i) => (
                      <th key={i} className="px-3 py-3 text-center">
                        Week {i + 1}
                      </th>
                    ))}
                    <th className="px-5 py-3">Note</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branches.map((b) => {
                    const row = rowFor(b.id);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition-colors align-top">
                        <td className="px-5 py-3 font-medium text-[var(--navy-900)] whitespace-nowrap">{b.name}</td>
                        {WEEK_KEYS.map((wk) => (
                          <td key={wk} className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={row[wk]}
                              onChange={() => handleToggleWeek(b.id, wk)}
                              className="h-4 w-4 rounded border-slate-300 text-[var(--accent)] focus:ring-[var(--accent)]/30"
                            />
                          </td>
                        ))}
                        <td className="px-5 py-3 min-w-[220px]">
                          <input
                            value={row.note}
                            onChange={(e) => handleNoteChange(b.id, e.target.value)}
                            placeholder="Note for this branch..."
                            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                          />
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveNote(b.id)}
                              disabled={savingNoteFor === b.id}
                              className="rounded-full bg-[var(--navy-900)] px-3 py-1.5 text-xs text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
                            >
                              {savingNoteFor === b.id ? "Saving..." : "Save"}
                            </button>
                            {noteSavedFor === b.id && <span className="text-xs text-emerald-600">Saved!</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>

          <WeeklyScanChart
            activityMonth={month}
            branches={branches}
            rows={rows}
            fileNamePrefix="Weekly-Scan-Return-Mail-Tracker"
          />
        </>
      )}
    </div>
  );
}
