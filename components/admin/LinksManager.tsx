"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Link } from "@/lib/types";
import LinkForm, { type LinkFormValues } from "./LinkForm";

export default function LinksManager() {
  const supabase = useMemo(() => createClient(), []);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadLinks(searchTerm: string) {
    setLoading(true);
    setError(null);

    const request = searchTerm.trim()
      ? supabase
          .from("links")
          .select("*")
          .ilike("title", `%${searchTerm.trim()}%`)
          .order("title", { ascending: true })
          .limit(200)
      : supabase
          .from("links")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

    const { data, error } = await request;

    if (error) {
      setError(error.message);
    } else {
      setLinks(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    const handle = setTimeout(() => loadLinks(query), 150);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleAdd(values: LinkFormValues) {
    const { error } = await supabase.from("links").insert(values);
    if (error) throw error;
    setShowAddForm(false);
    await loadLinks(query);
  }

  async function handleEdit(id: string, values: LinkFormValues) {
    const { error } = await supabase.from("links").update(values).eq("id", id);
    if (error) throw error;
    setEditingId(null);
    await loadLinks(query);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await loadLinks(query);
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
            placeholder="Search by title..."
            className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="shrink-0 rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors"
        >
          {showAddForm ? "Close" : "+ Add Link"}
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <LinkForm submitLabel="Add Link" onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <p className="px-5 py-3 text-xs font-medium text-slate-400 border-b border-slate-100 bg-slate-50/50">
            {query.trim()
              ? `${links.length} result${links.length === 1 ? "" : "s"}`
              : `${links.length} most recently added`}
          </p>
          <ul className="divide-y divide-slate-100">
            {links.map((link) =>
              editingId === link.id ? (
                <li key={link.id} className="p-5 bg-[var(--accent-light)]/40">
                  <LinkForm
                    initial={link}
                    submitLabel="Save"
                    onSubmit={(values) => handleEdit(link.id, values)}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li
                  key={link.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="min-w-0 flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--navy-900)] truncate">{link.title}</span>
                      {link.county && (
                        <span className="shrink-0 rounded-full bg-[var(--accent-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                          {link.county}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 truncate">{link.url}</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 text-sm">
                    <button
                      onClick={() => setEditingId(link.id)}
                      className="rounded-full px-3 py-1.5 text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(link.id, link.title)}
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
