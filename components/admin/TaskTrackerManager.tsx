"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { computeTimeToFinish, formatDate, STATUSES, todayStr, TONE_COLORS } from "@/lib/tasktracker";
import type { TaskStatus, TaskTrackerEntry } from "@/lib/types";
import TaskTrackerChart from "@/components/TaskTrackerChart";

const STATUS_BADGE: Record<TaskStatus, string> = {
  "Not Started": "bg-slate-100 text-slate-600",
  "In Progress": "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

function emptyForm() {
  return {
    task: "",
    deadline: todayStr(),
    status: "Not Started" as TaskStatus,
    note: "",
  };
}

function sortEntries(entries: TaskTrackerEntry[]): TaskTrackerEntry[] {
  const open = entries
    .filter((e) => e.status !== "Completed")
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const done = entries
    .filter((e) => e.status === "Completed")
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  return [...open, ...done];
}

export default function TaskTrackerManager() {
  const supabase = useMemo(() => createClient(), []);
  const [entries, setEntries] = useState<TaskTrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  async function loadEntries(searchTerm: string) {
    setLoading(true);
    setError(null);

    const request = searchTerm.trim()
      ? supabase
          .from("task_tracker_entries")
          .select("*")
          .ilike("task", `%${searchTerm.trim()}%`)
          .limit(500)
      : supabase.from("task_tracker_entries").select("*").limit(500);

    const { data, error } = await request;

    if (error) {
      setError(error.message);
    } else {
      setEntries(sortEntries(data ?? []));
    }
    setLoading(false);
  }

  useEffect(() => {
    const handle = setTimeout(() => loadEntries(query), 150);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const visibleEntries = useMemo(
    () => (statusFilter === "All" ? entries : entries.filter((e) => e.status === statusFilter)),
    [entries, statusFilter]
  );

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm());
  }

  function startEdit(entry: TaskTrackerEntry) {
    setEditingId(entry.id);
    setForm({
      task: entry.task,
      deadline: entry.deadline,
      status: entry.status,
      note: entry.note ?? "",
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.task.trim()) {
      setError("Task is required.");
      return;
    }
    if (!form.deadline) {
      setError("Deadline is required.");
      return;
    }

    const editingEntry = editingId ? entries.find((e) => e.id === editingId) : undefined;
    const wasAlreadyCompleted = editingEntry?.status === "Completed";
    const completed_at =
      form.status === "Completed" ? (wasAlreadyCompleted ? editingEntry!.completed_at : new Date().toISOString()) : null;

    setSaving(true);
    const payload = {
      task: form.task.trim(),
      deadline: form.deadline,
      status: form.status,
      note: form.note.trim() || null,
      completed_at,
    };

    const { error } = editingId
      ? await supabase.from("task_tracker_entries").update(payload).eq("id", editingId)
      : await supabase.from("task_tracker_entries").insert(payload);
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    startAdd();
    await loadEntries(query);
  }

  async function handleDelete(id: string, task: string) {
    if (!confirm(`Delete task "${task}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("task_tracker_entries").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    if (editingId === id) startAdd();
    await loadEntries(query);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--navy-900)] mb-4">
          {editingId ? "Edit Task" : "Add Task"}
        </h3>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Task</label>
            <input
              value={form.task}
              onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))}
              placeholder="e.g. Send Return Mail Reminder to the Branch"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => e.target.value && setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Note</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={3}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="self-start rounded-full bg-[var(--navy-900)] px-6 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Task"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={startAdd}
                className="self-start rounded-full px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(["All", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : visibleEntries.length === 0 ? (
        <p className="text-sm text-slate-400">No tasks found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                <th className="px-5 py-3">Task</th>
                <th className="px-5 py-3">Deadline</th>
                <th className="px-5 py-3">Time to Finish</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Note</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleEntries.map((entry) => {
                const ttf = computeTimeToFinish(entry.deadline, entry.status, entry.completed_at);
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors align-top">
                    <td className="px-5 py-3 font-medium text-[var(--navy-900)] max-w-xs">{entry.task}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-600">{formatDate(entry.deadline)}</td>
                    <td className="px-5 py-3 whitespace-nowrap font-medium" style={{ color: TONE_COLORS[ttf.tone] }}>
                      {ttf.label}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[entry.status]}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 max-w-xs text-slate-500 whitespace-pre-wrap">{entry.note}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-xs whitespace-nowrap">
                        <button
                          onClick={() => startEdit(entry)}
                          className="rounded-full px-3 py-1.5 text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id, entry.task)}
                          className="rounded-full px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <TaskTrackerChart entries={visibleEntries} fileNamePrefix="Task-Tracker" />
    </div>
  );
}
