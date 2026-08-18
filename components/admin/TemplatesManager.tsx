"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NoteTemplate } from "@/lib/types";
import TemplateForm, { type TemplateFormValues } from "./TemplateForm";

const MAX_FAVORITES = 15;
const LIST_LIMIT = 500;
const SEARCH_LIMIT = 300;

export default function TemplatesManager() {
  const supabase = useMemo(() => createClient(), []);
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const [existingCollections, setExistingCollections] = useState<string[]>([]);
  const [sectionsByCollection, setSectionsByCollection] = useState<Record<string, string[]>>({});

  const [renameCollection, setRenameCollection] = useState("");
  const [renameCollectionTo, setRenameCollectionTo] = useState("");
  const [renamingCollection, setRenamingCollection] = useState(false);

  const [renameSectionCollection, setRenameSectionCollection] = useState("");
  const [renameSection, setRenameSection] = useState("");
  const [renameSectionTo, setRenameSectionTo] = useState("");
  const [renamingSection, setRenamingSection] = useState(false);

  async function loadTemplates() {
    setLoading(true);
    const q = query.trim();

    const request = q
      ? supabase
          .from("note_templates")
          .select("*")
          .ilike("title", `%${q}%`)
          .order("title", { ascending: true })
          .limit(SEARCH_LIMIT)
      : supabase
          .from("note_templates")
          .select("*")
          .order("collection", { ascending: true })
          .order("sort_order", { ascending: true })
          .order("title", { ascending: true })
          .limit(LIST_LIMIT);

    const { data, error } = await request;

    if (error) {
      setError(error.message);
    } else {
      setTemplates(data ?? []);
    }
    setLoading(false);
  }

  async function loadCollectionsAndFavoriteCount() {
    const { data } = await supabase
      .from("note_templates")
      .select("collection, section")
      .limit(900);

    const collectionSet = new Set<string>();
    const sectionMap: Record<string, string[]> = {};
    for (const row of data ?? []) {
      collectionSet.add(row.collection);
      if (row.section) {
        if (!sectionMap[row.collection]) sectionMap[row.collection] = [];
        if (!sectionMap[row.collection].includes(row.section)) {
          sectionMap[row.collection].push(row.section);
        }
      }
    }
    for (const key in sectionMap) sectionMap[key].sort();
    setExistingCollections(Array.from(collectionSet).sort());
    setSectionsByCollection(sectionMap);

    const { count } = await supabase
      .from("note_templates")
      .select("id", { count: "exact", head: true })
      .eq("is_favorite", true);
    setFavoriteCount(count ?? 0);
  }

  useEffect(() => {
    const handle = setTimeout(() => loadTemplates(), 150);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    loadCollectionsAndFavoriteCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(values: TemplateFormValues) {
    const { error } = await supabase.from("note_templates").insert(values);
    if (error) throw error;
    setShowAddForm(false);
    await loadTemplates();
    await loadCollectionsAndFavoriteCount();
  }

  async function handleEdit(id: string, values: TemplateFormValues) {
    const { error } = await supabase.from("note_templates").update(values).eq("id", id);
    if (error) throw error;
    setEditingId(null);
    await loadTemplates();
    await loadCollectionsAndFavoriteCount();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("note_templates").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await loadTemplates();
    await loadCollectionsAndFavoriteCount();
  }

  async function handleToggleFavorite(t: NoteTemplate) {
    setFavoriteError(null);
    if (!t.is_favorite && favoriteCount >= MAX_FAVORITES) {
      setFavoriteError(`You can only favorite up to ${MAX_FAVORITES} templates. Remove one first.`);
      return;
    }
    const { error } = await supabase
      .from("note_templates")
      .update({ is_favorite: !t.is_favorite })
      .eq("id", t.id);
    if (error) {
      setFavoriteError(error.message);
      return;
    }
    await loadTemplates();
    await loadCollectionsAndFavoriteCount();
  }

  async function handleRenameCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!renameCollection || !renameCollectionTo.trim()) return;
    setRenamingCollection(true);
    const { error } = await supabase
      .from("note_templates")
      .update({ collection: renameCollectionTo.trim() })
      .eq("collection", renameCollection);
    setRenamingCollection(false);

    if (error) {
      setError(error.message);
      return;
    }
    setRenameCollection("");
    setRenameCollectionTo("");
    await loadTemplates();
    await loadCollectionsAndFavoriteCount();
  }

  async function handleRenameSection(e: React.FormEvent) {
    e.preventDefault();
    if (!renameSectionCollection || !renameSection || !renameSectionTo.trim()) return;
    setRenamingSection(true);
    const { error } = await supabase
      .from("note_templates")
      .update({ section: renameSectionTo.trim() })
      .eq("collection", renameSectionCollection)
      .eq("section", renameSection);
    setRenamingSection(false);

    if (error) {
      setError(error.message);
      return;
    }
    setRenameSectionCollection("");
    setRenameSection("");
    setRenameSectionTo("");
    await loadTemplates();
    await loadCollectionsAndFavoriteCount();
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
          <TemplateForm
            submitLabel="Add Template"
            onSubmit={handleAdd}
            onCancel={() => setShowAddForm(false)}
            existingCollections={existingCollections}
            sectionsByCollection={sectionsByCollection}
          />
        </div>
      )}

      <details className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-[var(--navy-900)]">
          Rename Collection / Section
        </summary>
        <div className="flex flex-col gap-6 border-t border-slate-100 p-5">
          <form onSubmit={handleRenameCollection} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Collection</label>
              <select
                value={renameCollection}
                onChange={(e) => setRenameCollection(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              >
                <option value="">-- select --</option>
                {existingCollections.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">New name</label>
              <input
                value={renameCollectionTo}
                onChange={(e) => setRenameCollectionTo(e.target.value)}
                placeholder="New collection name"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              />
            </div>
            <button
              type="submit"
              disabled={renamingCollection || !renameCollection || !renameCollectionTo.trim()}
              className="rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
            >
              {renamingCollection ? "Renaming..." : "Rename Collection"}
            </button>
          </form>

          <form onSubmit={handleRenameSection} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Collection</label>
              <select
                value={renameSectionCollection}
                onChange={(e) => {
                  setRenameSectionCollection(e.target.value);
                  setRenameSection("");
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              >
                <option value="">-- select --</option>
                {existingCollections.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Section</label>
              <select
                value={renameSection}
                onChange={(e) => setRenameSection(e.target.value)}
                disabled={!renameSectionCollection}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 disabled:opacity-50"
              >
                <option value="">-- select --</option>
                {(sectionsByCollection[renameSectionCollection] ?? []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">New name</label>
              <input
                value={renameSectionTo}
                onChange={(e) => setRenameSectionTo(e.target.value)}
                placeholder="New section name"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
              />
            </div>
            <button
              type="submit"
              disabled={renamingSection || !renameSectionCollection || !renameSection || !renameSectionTo.trim()}
              className="rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
            >
              {renamingSection ? "Renaming..." : "Rename Section"}
            </button>
          </form>
        </div>
      </details>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {favoriteError && <p className="text-sm text-red-600">{favoriteError}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <p className="px-5 py-3 text-xs font-medium text-slate-400 border-b border-slate-100 bg-slate-50/50">
            {templates.length} template{templates.length === 1 ? "" : "s"} · {favoriteCount}/{MAX_FAVORITES} favorited
          </p>
          <ul className="divide-y divide-slate-100">
            {templates.map((t) =>
              editingId === t.id ? (
                <li key={t.id} className="p-5 bg-[var(--accent-light)]/40">
                  <TemplateForm
                    initial={t}
                    submitLabel="Save"
                    onSubmit={(values) => handleEdit(t.id, values)}
                    onCancel={() => setEditingId(null)}
                    existingCollections={existingCollections}
                    sectionsByCollection={sectionsByCollection}
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
                      onClick={() => handleToggleFavorite(t)}
                      aria-label={t.is_favorite ? "Unfavorite" : "Favorite"}
                      className={`rounded-full p-1.5 transition-colors ${
                        t.is_favorite
                          ? "text-amber-500 hover:bg-amber-50"
                          : "text-slate-300 hover:bg-slate-100 hover:text-slate-400"
                      }`}
                    >
                      <svg className="h-5 w-5" fill={t.is_favorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m11.48 3.499 2.286 4.634a.532.532 0 0 0 .4.29l5.114.743a.535.535 0 0 1 .296.913l-3.7 3.607a.532.532 0 0 0-.153.47l.874 5.095a.534.534 0 0 1-.775.563l-4.573-2.402a.535.535 0 0 0-.498 0L6.178 19.81a.534.534 0 0 1-.775-.563l.874-5.096a.532.532 0 0 0-.153-.47l-3.7-3.606a.535.535 0 0 1 .296-.913l5.115-.743a.532.532 0 0 0 .4-.29l2.285-4.634a.534.534 0 0 1 .96 0Z" />
                      </svg>
                    </button>
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
