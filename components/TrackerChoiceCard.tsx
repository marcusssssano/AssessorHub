"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TrackerChoiceCard({ csscHref, regularHref }: { csscHref: string; regularHref: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-light)]/40"
      >
        <span className="text-base font-semibold text-[var(--navy-900)] group-hover:text-[var(--accent)] transition-colors">
          Return Mail Tracker
        </span>
        <span className="text-sm text-slate-500">
          Monthly branch completion status for CSSC or Regular return mail, tracked as Complete or Not Started.
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--navy-950)]/50 px-6 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-[var(--navy-900)]">Choose a Tracker</h3>
              <button
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <Link
                href={csscHref}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-[var(--navy-900)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
              >
                CSSC Return Mail Tracker
              </Link>
              <Link
                href={regularHref}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-[var(--navy-900)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
              >
                Regular Return Mail Tracker
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
