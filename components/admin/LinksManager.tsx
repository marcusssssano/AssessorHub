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

  async function loadLinks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .order("title", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setLinks(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = links.filter((link) =>
    link.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  async function handleAdd(values: LinkFormValues) {
    const { error } = await supabase.from("links").insert(values);
    if (error) throw error;
    setShowAddForm(false);
    await loadLinks();
  }

  async function handleEdit(id: string, values: LinkFormValues) {
    const { error } = await supabase.from("links").update(values).eq("id", id);
    if (error) throw error;
    setEditingId(null);
    await loadLinks();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await loadLinks();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by title..."
          className="w-full max-w-sm rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700"
        >
          {showAddForm ? "Close" : "+ Add Link"}
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-lg border border-black/10 bg-white p-4">
          <LinkForm submitLabel="Add Link" onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="rounded-lg border border-black/10 bg-white overflow-hidden">
          <p className="px-4 py-2 text-xs text-gray-500 border-b border-black/5">
            {filtered.length} link{filtered.length === 1 ? "" : "s"}
          </p>
          <ul className="divide-y divide-black/5">
            {filtered.map((link) =>
              editingId === link.id ? (
                <li key={link.id} className="p-4 bg-blue-50/50">
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
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0 flex flex-col">
                    <span className="font-medium text-gray-900 truncate">{link.title}</span>
                    <span className="text-xs text-gray-500 truncate">{link.url}</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-3 text-sm">
                    <button
                      onClick={() => setEditingId(link.id)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(link.id, link.title)}
                      className="text-red-600 hover:underline"
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
