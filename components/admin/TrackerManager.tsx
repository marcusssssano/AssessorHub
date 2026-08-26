"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { currentMonth, inputValueToMonth, monthToInputValue } from "@/lib/reports";
import type { TrackerBranch } from "@/lib/types";
import TrackerChart from "@/components/TrackerChart";

export default function TrackerManager() {
  const supabase = useMemo(() => createClient(), []);
  const [month, setMonth] = useState(currentMonth());

  const [branches, setBranches] = useState<TrackerBranch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [newBranchName, setNewBranchName] = useState("");
  const [addingBranch, setAddingBranch] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editingBranchName, setEditingBranchName] = useState("");

  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("CSSC Return Mail Tracker");
  const [loadingTitle, setLoadingTitle] = useState(true);
  const [savingTitle, setSavingTitle] = useState(false);
  const [titleSaved, setTitleSaved] = useState(false);

  async function loadBranches() {
    setLoadingBranches(true);
    const { data, error } = await supabase
      .from("tracker_branches")
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

  async function loadStatuses() {
    setLoadingStatuses(true);
    const { data, error } = await supabase
      .from("tracker_statuses")
      .select("branch_id, completed")
      .eq("activity_month", month)
      .limit(500);

    if (error) {
      setError(error.message);
    } else {
      const map: Record<string, boolean> = {};
      for (const row of data ?? []) {
        map[row.branch_id] = row.completed;
      }
      setStatuses(map);
    }
    setLoadingStatuses(false);
  }

  async function loadTitle() {
    setLoadingTitle(true);
    const { data, error } = await supabase
      .from("tracker_settings")
      .select("title")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .maybeSingle();

    if (!error && data) {
      setTitle(data.title);
    }
    setLoadingTitle(false);
  }

  useEffect(() => {
    loadBranches();
    loadTitle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  async function handleSaveTitle() {
    if (!title.trim()) return;
    setSavingTitle(true);
    setTitleSaved(false);
    const { error } = await supabase
      .from("tracker_settings")
      .update({ title: title.trim() })
      .eq("id", "00000000-0000-0000-0000-000000000001");
    setSavingTitle(false);

    if (error) {
      setError(error.message);
      return;
    }
    setTitleSaved(true);
    setTimeout(() => setTitleSaved(false), 2000);
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
      .from("tracker_branches")
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
      .from("tracker_branches")
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
        `Delete branch "${name}"? This removes it from the tracker and deletes all of its recorded status history. This cannot be undone.`
      )
    )
      return;
    const { error } = await supabase.from("tracker_branches").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await loadBranches();
    await loadStatuses();
  }

  async function handleToggleStatus(branchId: string) {
    const next = !statuses[branchId];
    setStatuses((prev) => ({ ...prev, [branchId]: next }));

    const { error } = await supabase
      .from("tracker_statuses")
      .upsert(
        { activity_month: month, branch_id: branchId, completed: next },
        { onConflict: "activity_month,branch_id" }
      );

    if (error) {
      setError(error.message);
      setStatuses((prev) => ({ ...prev, [branchId]: !next }));
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500">Report Title</label>
          {loadingTitle ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : (
            <div className="flex items-center gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              />
              <button
                onClick={handleSaveTitle}
                disabled={savingTitle}
                className="shrink-0 rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
              >
                {savingTitle ? "Saving..." : "Save"}
              </button>
              {titleSaved && <span className="text-sm text-emerald-600">Saved!</span>}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 w-56">
          <label className="text-xs font-medium text-slate-500">Activity Month</label>
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

      {loadingBranches || loadingStatuses ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : branches.length === 0 ? (
        <p className="text-sm text-slate-400">
          Add at least one branch above to start tracking.
        </p>
      ) : (
        <>
          <details className="rounded-2xl border border-slate-200 bg-white shadow-sm" open>
            <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-[var(--navy-900)]">
              Toggle status for {monthToInputValue(month)}
            </summary>
            <ul className="border-t border-slate-100 divide-y divide-slate-100">
              {branches.map((b) => {
                const completed = !!statuses[b.id];
                return (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <span className="font-medium text-[var(--navy-900)]">{b.name}</span>
                    <button
                      onClick={() => handleToggleStatus(b.id)}
                      className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                        completed
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-red-50 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${completed ? "bg-emerald-500" : "bg-red-500"}`} />
                      {completed ? "Completed" : "Not Started"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </details>

          <TrackerChart
            activityMonth={month}
            branches={branches}
            statuses={statuses}
            title={title}
            fileNamePrefix="CSSC-Return-Mail-Tracker"
          />
        </>
      )}
    </div>
  );
}
