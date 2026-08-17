"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NoteTemplate } from "@/lib/types";
import TemplateForm, { type TemplateFormValues } from "./TemplateForm";

export default function TemplatesManager() {
  const supabase = useMemo(() => createClient(), []);
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase
      .from("note_templates")
      .select("*")
      .order("collection", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setTemplates(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = templates.filter((t) =>
    t.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  async function handleAdd(values: TemplateFormValues) {
    const { error } = await supabase.from("note_templates").insert(values);
    if (error) throw error;
    setShowAddForm(false);
    await loadTemplates();
  }

  async function handleEdit(id: string, values: TemplateFormValues) {
    const { error } = await supabase.from("note_templates").update(values).eq("id", id);
    if (error) throw error;
    setEditingId(null);
    await loadTemplates();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("note_templates").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await loadTemplates();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
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
            placeholder="Filter by title..."
            className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="shrink-0 rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors"
        >
          {showAddForm ? "Close" : "+ Add Template"}
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <TemplateForm submitLabel="Add Template" onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <p className="px-5 py-3 text-xs font-medium text-slate-400 border-b border-slate-100 bg-slate-50/50">
            {filtered.length} template{filtered.length === 1 ? "" : "s"}
          </p>
          <ul className="divide-y divide-slate-100">
            {filtered.map((t) =>
              editingId === t.id ? (
                <li key={t.id} className="p-5 bg-[var(--accent-light)]/40">
                  <TemplateForm
                    initial={t}
                    submitLabel="Save"
                    onSubmit={(values) => handleEdit(t.id, values)}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="min-w-0 flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--navy-900)] truncate">{t.title}</span>
                      <span className="shrink-0 rounded-full bg-[var(--accent-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                        {t.collection}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 truncate">
                      {t.section ? `${t.section} · ` : ""}
                      {t.body.slice(0, 80)}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 text-sm">
                    <button
                      onClick={() => setEditingId(t.id)}
                      className="rounded-full px-3 py-1.5 text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.title)}
                      className="rounded-full px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
