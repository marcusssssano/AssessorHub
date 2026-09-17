"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { currentMonth, inputValueToMonth, monthToInputValue } from "@/lib/reports";
import { pacificNow } from "@/lib/time";
import type { WeeklyScanBranch, WeeklyScanEntry } from "@/lib/types";
import WeeklyScanChart from "@/components/WeeklyScanChart";

interface RowState {
  week1: boolean;
  week2: boolean;
  week3: boolean;
  week4: boolean;
  week5: boolean;
  note: string;
}

const WEEK_KEYS: (keyof RowState)[] = ["week1", "week2", "week3", "week4", "week5"];

export default function PublicWeeklyScanViewer() {
  const supabase = useMemo(() => createClient(), []);
  const [month, setMonth] = useState(currentMonth());
  const [branches, setBranches] = useState<WeeklyScanBranch[]>([]);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: branchData, error: branchErr }, { data: rowData, error: rowErr }] = await Promise.all([
        supabase
          .from("weekly_scan_branches")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true })
          .limit(500),
        supabase.from("weekly_scan_entries").select("*").eq("activity_month", month).limit(500),
      ]);

      if (branchErr || rowErr) {
        setError((branchErr ?? rowErr)!.message);
      } else {
        setBranches(branchData ?? []);
        const map: Record<string, RowState> = {};
        for (const e of (rowData ?? []) as WeeklyScanEntry[]) {
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
      setLoading(false);
    }
    load();
  }, [month, supabase]);

  return (
    <div className="w-full flex flex-col gap-6" style={{ maxWidth: 1300 }}>
      <div className="flex justify-center">
        <div className="flex flex-col gap-1.5 w-56">
          <label className="text-xs font-medium text-slate-500">Report Month</label>
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
        <p className="text-sm text-slate-400 text-center">No branches configured yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm mx-auto w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                <th className="px-5 py-3">Branch</th>
                {[1, 2, 3, 4, 5].map((n) => (
                  <th key={n} className="px-3 py-3 text-center">
                    Week {n}
                  </th>
                ))}
                <th className="px-5 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branches.map((b) => {
                const row = rows[b.id] ?? { week1: false, week2: false, week3: false, week4: false, week5: false, note: "" };
                return (
                  <tr key={b.id} className="align-top">
                    <td className="px-5 py-3 font-medium text-[var(--navy-900)] whitespace-nowrap">{b.name}</td>
                    {WEEK_KEYS.map((wk) => (
                      <td key={wk} className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                            row[wk] ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                          }`}
                        >
                          {row[wk] && (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </span>
                      </td>
                    ))}
                    <td className="px-5 py-3 text-slate-500 whitespace-pre-wrap max-w-xs">{row.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mx-auto">
        <WeeklyScanChart
          activityMonth={month}
          branches={branches}
          rows={rows}
          fileNamePrefix="Weekly-Scan-Return-Mail-Tracker"
        />
      </div>
    </div>
  );
}

// A reasonable free-pick window: current month (Pacific time) plus the prior 5.
function monthOptions(): string[] {
  const now = pacificNow();
  const opts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    opts.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return opts;
}
