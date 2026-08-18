"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NoteTemplate } from "@/lib/types";
import TemplateModal from "./TemplateModal";

const FAVORITES_KEY = "__favorites__";
const COLLECTION_LIMIT = 800;
const SEARCH_LIMIT = 100;

export default function TemplatesBrowser() {
  const supabase = useMemo(() => createClient(), []);
  const [collections, setCollections] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<NoteTemplate[]>([]);
  const [activeItems, setActiveItems] = useState<NoteTemplate[]>([]);
  const [loadingShell, setLoadingShell] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [selected, setSelected] = useState<NoteTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NoteTemplate[] | null>(null);

  // Initial shell: distinct collections + favorites, both cheap/bounded.
  useEffect(() => {
    async function loadShell() {
      setLoadingShell(true);

      const [{ data: collectionRows, error: collErr }, { data: favRows, error: favErr }] = await Promise.all([
        supabase.from("note_templates").select("collection").limit(900),
        supabase
          .from("note_templates")
          .select("*")
          .eq("is_favorite", true)
          .order("collection", { ascending: true })
          .limit(15),
      ]);

      if (collErr || favErr) {
        setError((collErr ?? favErr)!.message);
        setLoadingShell(false);
        return;
      }

      const uniqueCollections = Array.from(new Set((collectionRows ?? []).map((r) => r.collection))).sort();
      setCollections(uniqueCollections);
      setFavorites(favRows ?? []);

      if (uniqueCollections.length > 0) {
        setActiveCollection((prev) => prev ?? ((favRows ?? []).length > 0 ? FAVORITES_KEY : uniqueCollections[0]));
      }
      setLoadingShell(false);
    }
    loadShell();
  }, [supabase]);

  // Templates for the active collection tab (skipped for favorites, which is already loaded).
  useEffect(() => {
    async function loadCollectionItems() {
      if (!activeCollection || activeCollection === FAVORITES_KEY) return;
      setLoadingItems(true);
      const { data, error } = await supabase
        .from("note_templates")
        .select("*")
        .eq("collection", activeCollection)
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true })
        .limit(COLLECTION_LIMIT);

      if (error) {
        setError(error.message);
      } else {
        setActiveItems(data ?? []);
      }
      setLoadingItems(false);
    }
    loadCollectionItems();
  }, [activeCollection, supabase]);

  // Cross-collection search, server-side.
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      return;
    }
    const handle = setTimeout(async () => {
      const { data, error } = await supabase
        .from("note_templates")
        .select("*")
        .ilike("title", `%${q}%`)
        .order("title", { ascending: true })
        .limit(SEARCH_LIMIT);

      if (error) {
        setError(error.message);
      } else {
        setSearchResults(data ?? []);
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [searchQuery, supabase]);

  const sections = useMemo(() => {
    const grouped = new Map<string, NoteTemplate[]>();
    for (const t of activeItems) {
      const key = t.section ?? "";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(t);
    }
    return grouped;
  }, [activeItems]);

  if (loadingShell) {
    return <p className="text-sm text-slate-400 text-center">Loading templates...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600 text-center">{error}</p>;
  }

  if (collections.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center">
        No note templates yet. Add some from the admin panel.
      </p>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <div className="relative">
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search all templates by title..."
          className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm shadow-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
        />
      </div>

      {searchResults ? (
        <div className="flex flex-col gap-2">
          {searchResults.length === 0 ? (
            <p className="text-sm text-slate-400 text-center">
              No templates match &quot;{searchQuery}&quot;.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {searchResults.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-[var(--accent)]/40 hover:shadow-[0_4px_16px_rgba(15,29,56,0.08)]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span className="text-sm font-medium text-[var(--navy-900)] truncate">{t.title}</span>
                    <span className="text-xs text-slate-400 truncate">
                      {t.collection}
                      {t.section ? ` · ${t.section}` : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-2">
            {favorites.length > 0 && (
              <button
                onClick={() => setActiveCollection(FAVORITES_KEY)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCollection === FAVORITES_KEY
                    ? "bg-[var(--navy-900)] text-white"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-[var(--accent)]/40"
                }`}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill={activeCollection === FAVORITES_KEY ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.48 3.499 2.286 4.634a.532.532 0 0 0 .4.29l5.114.743a.535.535 0 0 1 .296.913l-3.7 3.607a.532.532 0 0 0-.153.47l.874 5.095a.534.534 0 0 1-.775.563l-4.573-2.402a.535.535 0 0 0-.498 0L6.178 19.81a.534.534 0 0 1-.775-.563l.874-5.096a.532.532 0 0 0-.153-.47l-3.7-3.606a.535.535 0 0 1 .296-.913l5.115-.743a.532.532 0 0 0 .4-.29l2.285-4.634a.534.534 0 0 1 .96 0Z" />
                </svg>
                Favorites
              </button>
            )}
            {collections.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCollection(c)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCollection === c
                    ? "bg-[var(--navy-900)] text-white"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-[var(--accent)]/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {loadingItems ? (
            <p className="text-sm text-slate-400 text-center">Loading...</p>
          ) : activeCollection === FAVORITES_KEY ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {favorites.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-[var(--accent)]/40 hover:shadow-[0_4px_16px_rgba(15,29,56,0.08)]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m11.48 3.499 2.286 4.634a.532.532 0 0 0 .4.29l5.114.743a.535.535 0 0 1 .296.913l-3.7 3.607a.532.532 0 0 0-.153.47l.874 5.095a.534.534 0 0 1-.775.563l-4.573-2.402a.535.535 0 0 0-.498 0L6.178 19.81a.534.534 0 0 1-.775-.563l.874-5.096a.532.532 0 0 0-.153-.47l-3.7-3.606a.535.535 0 0 1 .296-.913l5.115-.743a.532.532 0 0 0 .4-.29l2.285-4.634a.534.534 0 0 1 .96 0Z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span className="text-sm font-medium text-[var(--navy-900)] truncate">{t.title}</span>
                    <span className="text-xs text-slate-400 truncate">
                      {t.collection}
                      {t.section ? ` · ${t.section}` : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Array.from(sections.entries()).map(([section, items]) => (
                <div key={section || "_"} className="flex flex-col gap-3">
                  {section && (
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 px-1">
                      {section}
                    </h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelected(t)}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-[var(--accent)]/40 hover:shadow-[0_4px_16px_rgba(15,29,56,0.08)]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-[var(--navy-900)]">{t.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selected && <TemplateModal template={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
