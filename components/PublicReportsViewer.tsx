"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { monthToInputValue, inputValueToMonth, OVERALL_REPORT_KEY, type CategoryKey } from "@/lib/reports";
import ReportChart from "@/components/ReportChart";
import OverallReportChart, { type BranchCounts } from "@/components/OverallReportChart";

interface MonthBranch {
  activity_month: string;
  branch: string;
}

export default function PublicReportsViewer() {
  const supabase = useMemo(() => createClient(), []);
  const [available, setAvailable] = useState<MonthBranch[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [month, setMonth] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<CategoryKey, number> | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [countsByBranch, setCountsByBranch] = useState<BranchCounts | null>(null);
  const [overallDescription, setOverallDescription] = useState<string | null>(null);
  const [loadingOverall, setLoadingOverall] = useState(false);

  useEffect(() => {
    async function loadAvailable() {
      setLoadingAvailable(true);
      const { data, error } = await supabase
        .from("report_entries")
        .select("activity_month, branch")
        .order("created_at", { ascending: false })
        .limit(900);

      if (error) {
        setError(error.message);
      } else {
        setAvailable(data ?? []);
      }
      setLoadingAvailable(false);
    }
    loadAvailable();
  }, [supabase]);

  const months = useMemo(() => {
    const set = new Set(available.map((r) => r.activity_month));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [available]);

  const branchesForMonth = useMemo(() => {
    if (!month) return [];
    const set = new Set(available.filter((r) => r.activity_month === month).map((r) => r.branch));
    return Array.from(set).sort();
  }, [available, month]);

  useEffect(() => {
    if (!month && months.length > 0) {
      setMonth(months[0]);
    }
  }, [months, month]);

  useEffect(() => {
    if (branchesForMonth.length > 0 && !branchesForMonth.includes(branch ?? "")) {
      setBranch(branchesForMonth[0]);
    } else if (branchesForMonth.length === 0) {
      setBranch(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchesForMonth]);

  useEffect(() => {
    async function loadCounts() {
      if (!month || !branch) {
        setCounts(null);
        return;
      }
      setLoadingCounts(true);
      const { data, error } = await supabase
        .from("report_entries")
        .select("category, count")
        .eq("activity_month", month)
        .eq("branch", branch);

      if (error) {
        setError(error.message);
      } else {
        const base: Record<CategoryKey, number> = {
          exempted_reason_code: 0,
          incorrect_scanned_label: 0,
          processed_return_mail: 0,
        };
        for (const row of data ?? []) {
          if (row.category in base) base[row.category as CategoryKey] += row.count;
        }
        setCounts(base);
      }
      setLoadingCounts(false);
    }
    loadCounts();
  }, [month, branch, supabase]);

  useEffect(() => {
    async function loadDescription() {
      if (!month || !branch) {
        setDescription(null);
        return;
      }
      const { data } = await supabase
        .from("report_descriptions")
        .select("description")
        .eq("activity_month", month)
        .eq("branch", branch)
        .maybeSingle();

      setDescription(data?.description ?? null);
    }
    loadDescription();
  }, [month, branch, supabase]);

  useEffect(() => {
    async function loadOverall() {
      if (!month) {
        setCountsByBranch(null);
        setOverallDescription(null);
        return;
      }
      setLoadingOverall(true);

      const [entriesRes, descRes] = await Promise.all([
        supabase
          .from("report_entries")
          .select("branch, category")
          .eq("activity_month", month)
          .in("category", ["exempted_reason_code", "incorrect_scanned_label"])
          .limit(5000),
        supabase
          .from("report_descriptions")
          .select("description")
          .eq("activity_month", month)
          .eq("branch", OVERALL_REPORT_KEY)
          .maybeSingle(),
      ]);

      if (!entriesRes.error) {
        const map: BranchCounts = {};
        for (const row of entriesRes.data ?? []) {
          if (!map[row.branch]) map[row.branch] = { exempted_reason_code: 0, incorrect_scanned_label: 0 };
          if (row.category === "exempted_reason_code") map[row.branch].exempted_reason_code += 1;
          else if (row.category === "incorrect_scanned_label") map[row.branch].incorrect_scanned_label += 1;
        }
        setCountsByBranch(map);
      }
      setOverallDescription(descRes.data?.description ?? null);
      setLoadingOverall(false);
    }
    loadOverall();
  }, [month, supabase]);

  if (loadingAvailable) {
    return <p className="text-sm text-slate-400 text-center">Loading reports...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600 text-center">{error}</p>;
  }

  if (months.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center">
        No reports available yet.
      </p>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex flex-wrap justify-center gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500">Month</label>
          <select
            value={month ? monthToInputValue(month) : ""}
            onChange={(e) => setMonth(inputValueToMonth(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          >
            {months.map((m) => (
              <option key={m} value={monthToInputValue(m)}>
                {monthToInputValue(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500">Branch</label>
          <select
            value={branch ?? ""}
            onChange={(e) => setBranch(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          >
            {branchesForMonth.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingCounts && <p className="text-sm text-slate-400 text-center">Loading chart...</p>}

      {!loadingCounts && counts && month && branch && (
        <ReportChart
          activityMonth={month}
          branch={branch}
          counts={counts}
          description={description}
          fileNamePrefix="AssessorHub-Report"
        />
      )}

      {month && (
        <details className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-[var(--navy-900)]">
            Overall Monthly Report — All Branches
          </summary>
          <div className="border-t border-slate-100 p-5 flex justify-center">
            {loadingOverall || !countsByBranch ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : (
              <OverallReportChart
                activityMonth={month}
                countsByBranch={countsByBranch}
                description={overallDescription}
                fileNamePrefix="AssessorHub-Overall-Report"
              />
            )}
          </div>
        </details>
      )}
    </div>
  );
}
