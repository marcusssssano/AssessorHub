"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  computeTimeToFinish,
  formatDate,
  formatLoggedDate,
  rowAccentColor,
  STATUSES,
  TONE_COLORS,
} from "@/lib/tasktracker";
import type { TaskStatus, TaskTrackerEntry } from "@/lib/types";
import TaskTrackerChart from "@/components/TaskTrackerChart";

const STATUS_BADGE: Record<TaskStatus, string> = {
  "Not Started": "bg-slate-100 text-slate-600",
  "In Progress": "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

function sortEntries(entries: TaskTrackerEntry[]): TaskTrackerEntry[] {
  const open = entries
    .filter((e) => e.status !== "Completed")
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const done = entries
    .filter((e) => e.status === "Completed")
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  return [...open, ...done];
}

export default function PublicTaskTrackerViewer() {
  const supabase = useMemo(() => createClient(), []);
  const [entries, setEntries] = useState<TaskTrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");

  async function loadEntries(searchTerm: string) {
    setLoading(true);
    setError(null);

    const request = searchTerm.trim()
      ? supabase.from("task_tracker_entries").select("*").ilike("task", `%${searchTerm.trim()}%`).limit(500)
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

  return (
    <div className="w-full flex flex-col gap-6" style={{ maxWidth: 1600 }}>
      <div className="flex flex-wrap items-center justify-center gap-4">
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
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400 text-center">Loading...</p>
      ) : visibleEntries.length === 0 ? (
        <p className="text-sm text-slate-400 text-center">No tasks found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm mx-auto w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                <th className="px-5 py-3">Task</th>
                <th className="px-5 py-3">Logged</th>
                <th className="px-5 py-3">Deadline</th>
                <th className="px-5 py-3">Time to Finish</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const openEntries = visibleEntries.filter((e) => e.status !== "Completed");
                const doneEntries = visibleEntries.filter((e) => e.status === "Completed");

                function renderRow(entry: TaskTrackerEntry) {
                  const ttf = computeTimeToFinish(entry.deadline, entry.status, entry.completed_at);
                  const accent = rowAccentColor(entry.status, entry.deadline, entry.completed_at);
                  return (
                    <tr key={entry.id} className="align-top">
                      <td className="px-5 py-3 max-w-xs" style={{ borderLeft: `4px solid ${accent}` }}>
                        <span className="font-medium text-[var(--navy-900)]">{entry.task}</span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-slate-500">
                        {formatLoggedDate(entry.created_at)}
                      </td>
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
                    </tr>
                  );
                }

                return (
                  <>
                    {openEntries.length > 0 && (
                      <tr>
                        <td colSpan={6} className="bg-slate-50 px-5 py-2 text-xs font-semibold text-slate-500">
                          OPEN TASKS ({openEntries.length})
                        </td>
                      </tr>
                    )}
                    {openEntries.map(renderRow)}
                    {doneEntries.length > 0 && (
                      <tr>
                        <td colSpan={6} className="bg-slate-50 px-5 py-2 text-xs font-semibold text-slate-500">
                          COMPLETED ({doneEntries.length})
                        </td>
                      </tr>
                    )}
                    {doneEntries.map(renderRow)}
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}

      <div className="mx-auto">
        <TaskTrackerChart entries={visibleEntries} fileNamePrefix="Task-Tracker" />
      </div>
    </div>
  );
}
