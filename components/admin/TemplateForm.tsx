"use client";

import { useState } from "react";
import type { NoteTemplate } from "@/lib/types";

export interface TemplateFormValues {
  collection: string;
  section: string;
  title: string;
  body: string;
}

export default function TemplateForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: NoteTemplate;
  submitLabel: string;
  onSubmit: (values: TemplateFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [collection, setCollection] = useState(initial?.collection ?? "");
  const [section, setSection] = useState(initial?.section ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!collection.trim() || !title.trim() || !body.trim()) {
      setError("Collection, title, and body are required.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        collection: collection.trim(),
        section: section.trim(),
        title: title.trim(),
        body: body,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500">Collection</label>
          <input
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            placeholder="e.g. C3 Notes - General"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500">Section (optional)</label>
          <input
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="e.g. Accomplished"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-500">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. SAME ADDRESS"
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-500">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="Template text..."
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 font-mono"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
