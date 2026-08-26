"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  currentISOWeek,
  dateToISOWeek,
  formatDayLabel,
  mondayOfISOWeek,
  WEEKDAY_LABELS,
  weekdayDates,
} from "@/lib/worklog";
import type { WorkLogEntry } from "@/lib/types";
import WeeklyWorkLogChart from "@/components/WeeklyWorkLogChart";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function WorkLogManager() {
  const supabase = useMemo(() => createClient(), []);
  const [week, setWeek] = useState(currentISOWeek());
  const mondayDate = mondayOfISOWeek(week);
  const dates = weekdayDates(mondayDate);

  const [entries, setEntries] = useState<WorkLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formDate, setFormDate] = useState(todayStr());
  const [returnMailCount, setReturnMailCount] = useState("0");
  const [completedTasks, setCompletedTasks] = useState("");
  const [ongoingTasks, setOngoingTasks] = useState("");
  const [nextTasks, setNextTasks] = useState("");
  const [saving, setSaving] = useState(false);

  const entriesByDate = useMemo(() => {
    const map: Record<string, WorkLogEntry | undefined> = {};
    for (const e of entries) map[e.entry_date] = e;
    return map;
  }, [entries]);

  async function loadWeek() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("work_log_entries")
      .select("*")
      .gte("entry_date", dates[0])
      .lte("entry_date", dates[4])
      .limit(10);

    if (error) {
      setError(error.message);
    } else {
      setEntries(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadWeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week]);

  function loadIntoForm(entry: WorkLogEntry | undefined, date: string) {
    setFormDate(date);
    setReturnMailCount(String(entry?.return_mail_count ?? 0));
    setCompletedTasks(entry?.completed_tasks ?? "");
    setOngoingTasks(entry?.ongoing_tasks ?? "");
    setNextTasks(entry?.next_tasks ?? "");
  }

  useEffect(() => {
    // When the form's date is picked, prefill from any existing entry for that date.
    async function loadForDate() {
      if (dates.includes(formDate)) {
        loadIntoForm(entriesByDate[formDate], formDate);
        return;
      }
      const { data } = await supabase
        .from("work_log_entries")
        .select("*")
        .eq("entry_date", formDate)
        .maybeSingle();
      loadIntoForm(data ?? undefined, formDate);
    }
    loadForDate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formDate, entriesByDate]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const n = parseInt(returnMailCount, 10);
    if (!formDate) {
      setError("Select a date.");
      return;
    }
    if (!Number.isFinite(n) || n < 0) {
      setError("Enter a valid number of return mail processed.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("work_log_entries").upsert(
      {
        entry_date: formDate,
        return_mail_count: n,
        completed_tasks: completedTasks.trim() || null,
        ongoing_tasks: ongoingTasks.trim() || null,
        next_tasks: nextTasks.trim() || null,
      },
      { onConflict: "entry_date" }
    );
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    const savedWeek = dateToISOWeek(new Date(formDate + "T00:00:00Z"));
    if (savedWeek !== week) {
      setWeek(savedWeek);
    } else {
      await loadWeek();
    }
  }

  async function handleDelete(date: string) {
    if (!confirm(`Delete the work log entry for ${date}? This cannot be undone.`)) return;
    const { error } = await supabase.from("work_log_entries").delete().eq("entry_date", date);
    if (error) {
      setError(error.message);
      return;
    }
    if (formDate === date) {
      loadIntoForm(undefined, date);
    }
    await loadWeek();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 w-56">
          <label className="text-xs font-medium text-slate-500">Report Week</label>
          <input
            type="week"
            value={week}
            onChange={(e) => e.target.value && setWeek(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--navy-900)] mb-4">Daily Work Log</h3>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Select Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500"># of Return Mail Processed</label>
              <input
                type="number"
                min={0}
                value={returnMailCount}
                onChange={(e) => setReturnMailCount(e.target.value)}
                className="w-40 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">
                Completed Tasks <span className="text-slate-400">(one per line)</span>
              </label>
              <textarea
                value={completedTasks}
                onChange={(e) => setCompletedTasks(e.target.value)}
                rows={5}
                placeholder={"Processed CSSC Return Mail for: NNJ & TPC branch.\nReviewed owner emails & updated info in C3."}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">
                Ongoing Tasks <span className="text-slate-400">(one per line)</span>
              </label>
              <textarea
                value={ongoingTasks}
                onChange={(e) => setOngoingTasks(e.target.value)}
                rows={5}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">
                Next Task to Process <span className="text-slate-400">(one per line)</span>
              </label>
              <textarea
                value={nextTasks}
                onChange={(e) => setNextTasks(e.target.value)}
                rows={5}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-full bg-[var(--navy-900)] px-6 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </div>

      <details className="rounded-2xl border border-slate-200 bg-white shadow-sm" open>
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-[var(--navy-900)]">
          This Week&apos;s Entries
        </summary>
        {loading ? (
          <p className="px-5 py-4 text-sm text-slate-400">Loading...</p>
        ) : (
          <ul className="border-t border-slate-100 divide-y divide-slate-100">
            {dates.map((date, i) => {
              const entry = entriesByDate[date];
              return (
                <li
                  key={date}
                  className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-[var(--navy-900)]">
                      {WEEKDAY_LABELS[i]} · {formatDayLabel(date)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {entry ? `${entry.return_mail_count} return mail processed` : "No entry"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={() => setFormDate(date)}
                      className="rounded-full px-3 py-1.5 text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
                    >
                      {entry ? "Edit" : "Add"}
                    </button>
                    {entry && (
                      <button
                        onClick={() => handleDelete(date)}
                        className="rounded-full px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </details>

      <WeeklyWorkLogChart
        mondayDate={mondayDate}
        entriesByDate={entriesByDate}
        fileNamePrefix="Weekly-Work-Log"
      />
    </div>
  );
}
