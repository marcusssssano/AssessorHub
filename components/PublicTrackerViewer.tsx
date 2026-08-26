"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { currentMonth, inputValueToMonth, monthToInputValue } from "@/lib/reports";
import type { TrackerBranch } from "@/lib/types";
import TrackerChart from "@/components/TrackerChart";

export default function PublicTrackerViewer() {
  const supabase = useMemo(() => createClient(), []);
  const [month, setMonth] = useState(currentMonth());
  const [branches, setBranches] = useState<TrackerBranch[]>([]);
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [title, setTitle] = useState("CSSC Return Mail Tracker");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [
        { data: branchData, error: branchErr },
        { data: statusData, error: statusErr },
        { data: settingsData },
      ] = await Promise.all([
        supabase
          .from("tracker_branches")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true })
          .limit(500),
        supabase
          .from("tracker_statuses")
          .select("branch_id, completed")
          .eq("activity_month", month)
          .limit(500),
        supabase
          .from("tracker_settings")
          .select("title")
          .eq("id", "00000000-0000-0000-0000-000000000001")
          .maybeSingle(),
      ]);

      if (branchErr || statusErr) {
        setError((branchErr ?? statusErr)!.message);
      } else {
        setBranches(branchData ?? []);
        const map: Record<string, boolean> = {};
        for (const row of statusData ?? []) map[row.branch_id] = row.completed;
        setStatuses(map);
        if (settingsData) setTitle(settingsData.title);
      }
      setLoading(false);
    }
    load();
  }, [month, supabase]);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex justify-center">
        <div className="flex flex-col gap-1.5 w-56">
          <label className="text-xs font-medium text-slate-500">Month</label>
          <select
            value={monthToInputValue(month)}
            onChange={(e) => setMonth(inputValueToMonth(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          >
            {monthOptions().map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400 text-center">Loading...</p>
      ) : branches.length === 0 ? (
        <p className="text-sm text-slate-400 text-center">
          No branches configured yet.
        </p>
      ) : (
        <TrackerChart
          activityMonth={month}
          branches={branches}
          statuses={statuses}
          title={title}
          fileNamePrefix="CSSC-Return-Mail-Tracker"
        />
      )}
    </div>
  );
}

// A reasonable free-pick window: current month plus the prior 5.
function monthOptions(): string[] {
  const now = new Date();
  const opts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return opts;
}
