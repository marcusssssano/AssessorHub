"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RmpSubtopic, RmpTopic } from "@/lib/types";

const MAX_SUBTOPICS = 10;

export default function RmpLaunchTopicDetail({ topicId }: { topicId: string }) {
  const supabase = useMemo(() => createClient(), []);

  const [topic, setTopic] = useState<RmpTopic | null>(null);
  const [subtopics, setSubtopics] = useState<RmpSubtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNoteFor, setSavingNoteFor] = useState<string | null>(null);
  const [noteSavedFor, setNoteSavedFor] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function load() {
    setLoading(true);
    const [{ data: topicData, error: topicError }, { data: subtopicData, error: subtopicError }] =
      await Promise.all([
        supabase.from("rmp_topics").select("*").eq("id", topicId).maybeSingle(),
        supabase
          .from("rmp_subtopics")
          .select("*")
          .eq("topic_id", topicId)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

    if (topicError) {
      setError(topicError.message);
    } else if (subtopicError) {
      setError(subtopicError.message);
    } else if (!topicData) {
      setNotFound(true);
    } else {
      setTopic(topicData);
      const list = (subtopicData ?? []) as RmpSubtopic[];
      setSubtopics(list);
      setNoteDrafts((prev) => {
        const next = { ...prev };
        for (const s of list) {
          if (next[s.id] === undefined) next[s.id] = s.notes ?? "";
        }
        return next;
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  async function handleAddSubtopic(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!newName.trim()) {
      setError("Subtopic name is required.");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("rmp_subtopics").insert({
      topic_id: topicId,
      name: newName.trim(),
      sort_order: subtopics.length,
    });
    setAdding(false);

    if (error) {
      setError(error.message);
      return;
    }
    setNewName("");
    await load();
  }

  async function handleToggleDone(subtopic: RmpSubtopic) {
    const next = !subtopic.done;
    setSubtopics((prev) => prev.map((s) => (s.id === subtopic.id ? { ...s, done: next } : s)));
    const { error } = await supabase.from("rmp_subtopics").update({ done: next }).eq("id", subtopic.id);
    if (error) {
      setError(error.message);
      setSubtopics((prev) => prev.map((s) => (s.id === subtopic.id ? { ...s, done: !next } : s)));
    }
  }

  async function handleUndoAll() {
    if (subtopics.length === 0) return;
    if (!confirm("Mark every subtopic in this topic as not done? Use this before starting a fresh training.")) return;
    const previous = subtopics;
    setSubtopics((prev) => prev.map((s) => ({ ...s, done: false })));
    const { error } = await supabase.from("rmp_subtopics").update({ done: false }).eq("topic_id", topicId);
    if (error) {
      setError(error.message);
      setSubtopics(previous);
    }
  }

  function handleNoteChange(id: string, value: string) {
    setNoteDrafts((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSaveNote(id: string) {
    setSavingNoteFor(id);
    setNoteSavedFor(null);
    const value = noteDrafts[id] ?? "";
    const { error } = await supabase
      .from("rmp_subtopics")
      .update({ notes: value.trim() || null })
      .eq("id", id);
    setSavingNoteFor(null);
    if (error) {
      setError(error.message);
      return;
    }
    setSubtopics((prev) => prev.map((s) => (s.id === id ? { ...s, notes: value.trim() || null } : s)));
    setNoteSavedFor(id);
    setTimeout(() => setNoteSavedFor(null), 2000);
  }

  function startEdit(subtopic: RmpSubtopic) {
    setEditingId(subtopic.id);
    setEditingName(subtopic.name);
  }

  async function handleSaveEdit(id: string) {
    if (!editingName.trim()) return;
    const { error } = await supabase.from("rmp_subtopics").update({ name: editingName.trim() }).eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setEditingId(null);
    await load();
  }

  async function handleDeleteSubtopic(id: string, name: string) {
    if (!confirm(`Delete subtopic "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("rmp_subtopics").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await load();
  }

  const atLimit = subtopics.length >= MAX_SUBTOPICS;
  const isDone = subtopics.length > 0 && subtopics.every((s) => s.done);

  if (notFound) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/admin/rmp-launch" className="text-sm text-[var(--accent)] hover:underline w-fit">
          ← Back to RMP Launch
        </Link>
        <p className="text-sm text-slate-500">Topic not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/admin/rmp-launch" className="text-sm text-[var(--accent)] hover:underline w-fit">
          ← Back to RMP Launch
        </Link>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{topic?.title ?? "Loading..."}</h2>
          {isDone && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
              Done
            </span>
          )}
        </div>
        {topic?.description && <p className="text-sm text-slate-500">{topic.description}</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm font-medium text-slate-500">
              {subtopics.length} / {MAX_SUBTOPICS} subtopics
            </span>
            <button
              onClick={handleUndoAll}
              disabled={subtopics.length === 0}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Undo All (reset for fresh training)
            </button>
          </div>

          {atLimit && (
            <p className="text-sm text-amber-600">
              Maximum of {MAX_SUBTOPICS} subtopics reached. Delete one to add another.
            </p>
          )}

          {!atLimit && (
            <form
              onSubmit={handleAddSubtopic}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-end gap-3"
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500">New subtopic name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sales Comparison Approach"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                />
              </div>
              <button
                type="submit"
                disabled={adding}
                className="rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
              >
                {adding ? "Adding..." : "+ Add Subtopic"}
              </button>
            </form>
          )}

          {subtopics.length === 0 ? (
            <p className="text-sm text-slate-400">No subtopics yet. Add one above.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {subtopics.map((s) => (
                <li key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex flex-1 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={s.done}
                        onChange={() => handleToggleDone(s)}
                        className="h-4 w-4 rounded border-slate-300 text-[var(--accent)] focus:ring-[var(--accent)]/30"
                      />
                      {editingId === s.id ? (
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onClick={(e) => e.preventDefault()}
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                        />
                      ) : (
                        <span
                          className={`text-sm font-medium ${
                            s.done ? "text-slate-400 line-through" : "text-[var(--navy-900)]"
                          }`}
                        >
                          {s.name}
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-2 text-xs shrink-0">
                      {editingId === s.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(s.id)}
                            className="rounded-full bg-[var(--navy-900)] px-3 py-1.5 text-white font-medium hover:bg-[var(--navy-800)] transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-full px-3 py-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(s)}
                            className="rounded-full px-3 py-1.5 text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleDeleteSubtopic(s.id, s.name)}
                            className="rounded-full px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 pl-7">
                    <label className="text-xs font-medium text-slate-500">Notes</label>
                    <textarea
                      value={noteDrafts[s.id] ?? ""}
                      onChange={(e) => handleNoteChange(s.id, e.target.value)}
                      placeholder="Write anything you need for this subtopic..."
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveNote(s.id)}
                        disabled={savingNoteFor === s.id}
                        className="rounded-full bg-[var(--navy-900)] px-3 py-1.5 text-xs text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50 w-fit"
                      >
                        {savingNoteFor === s.id ? "Saving..." : "Save Notes"}
                      </button>
                      {noteSavedFor === s.id && <span className="text-xs text-emerald-600">Saved!</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
