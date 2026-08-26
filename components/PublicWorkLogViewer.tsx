"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { currentISOWeek, mondayOfISOWeek, weekdayDates } from "@/lib/worklog";
import type { WorkLogEntry } from "@/lib/types";
import WeeklyWorkLogChart from "@/components/WeeklyWorkLogChart";

export default function PublicWorkLogViewer() {
  const supabase = useMemo(() => createClient(), []);
  const [week, setWeek] = useState(currentISOWeek());
  const mondayDate = mondayOfISOWeek(week);
  const dates = weekdayDates(mondayDate);

  const [entries, setEntries] = useState<WorkLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, supabase]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, WorkLogEntry | undefined> = {};
    for (const e of entries) map[e.entry_date] = e;
    return map;
  }, [entries]);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex justify-center">
        <div className="flex flex-col gap-1.5 w-56">
          <label className="text-xs font-medium text-slate-500">Week</label>
          <input
            type="week"
            value={week}
            onChange={(e) => e.target.value && setWeek(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400 text-center">Loading...</p>
      ) : (
        <WeeklyWorkLogChart
          mondayDate={mondayDate}
          entriesByDate={entriesByDate}
          fileNamePrefix="Weekly-Work-Log"
        />
      )}
    </div>
  );
}
