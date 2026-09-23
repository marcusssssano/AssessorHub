"use client";

import { useEffect, useState } from "react";
import type { RmpSubtopic } from "@/lib/types";

export default function RmpSubtopicNotesModal({
  subtopic,
  onSave,
  onClose,
}: {
  subtopic: RmpSubtopic;
  onSave: (notes: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState(subtopic.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const ok = await onSave(notes);
    setSaving(false);
    if (ok) {
      onClose();
    } else {
      setError("Something went wrong saving your notes.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--navy-950)]/50 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-[var(--navy-900)] break-words">{subtopic.name}</h3>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <textarea
          autoFocus
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write anything you need for this subtopic..."
          rows={14}
          className="mt-4 w-full flex-1 resize-y whitespace-pre-wrap break-words rounded-xl border border-slate-200 px-4 py-3 text-sm leading-relaxed outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
