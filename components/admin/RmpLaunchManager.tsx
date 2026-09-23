"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RmpTopic } from "@/lib/types";

const MAX_TOPICS = 20;

interface SubtopicProgress {
  total: number;
  done: number;
}

export default function RmpLaunchManager() {
  const supabase = useMemo(() => createClient(), []);

  const [topics, setTopics] = useState<RmpTopic[]>([]);
  const [progress, setProgress] = useState<Record<string, SubtopicProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  async function loadTopics() {
    setLoading(true);
    const [{ data: topicData, error: topicError }, { data: subtopicData, error: subtopicError }] =
      await Promise.all([
        supabase.from("rmp_topics").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
        supabase.from("rmp_subtopics").select("topic_id, done"),
      ]);

    if (topicError) {
      setError(topicError.message);
    } else if (subtopicError) {
      setError(subtopicError.message);
    } else {
      setTopics(topicData ?? []);
      const map: Record<string, SubtopicProgress> = {};
      for (const s of (subtopicData ?? []) as { topic_id: string; done: boolean }[]) {
        const current = map[s.topic_id] ?? { total: 0, done: 0 };
        current.total += 1;
        if (s.done) current.done += 1;
        map[s.topic_id] = current;
      }
      setProgress(map);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddTopic(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!newTitle.trim()) {
      setError("Title is required.");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("rmp_topics").insert({
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      sort_order: topics.length,
    });
    setAdding(false);

    if (error) {
      setError(error.message);
      return;
    }
    setNewTitle("");
    setNewDescription("");
    setShowAddForm(false);
    await loadTopics();
  }

  function startEdit(topic: RmpTopic) {
    setEditingId(topic.id);
    setEditingTitle(topic.title);
    setEditingDescription(topic.description ?? "");
  }

  async function handleSaveEdit(id: string) {
    if (!editingTitle.trim()) return;
    const { error } = await supabase
      .from("rmp_topics")
      .update({ title: editingTitle.trim(), description: editingDescription.trim() || null })
      .eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setEditingId(null);
    await loadTopics();
  }

  async function handleDeleteTopic(id: string, title: string) {
    if (
      !confirm(`Delete topic "${title}"? This removes all of its subtopics too. This cannot be undone.`)
    )
      return;
    const { error } = await supabase.from("rmp_topics").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await loadTopics();
  }

  const atLimit = topics.length >= MAX_TOPICS;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-500">
            {topics.length} / {MAX_TOPICS} topics
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/rmp-launch/materials"
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-[var(--navy-900)] hover:bg-slate-50 transition-colors"
          >
            View Materials
          </Link>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            disabled={atLimit}
            className="rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
          >
            + Add Topic
          </button>
        </div>
      </div>

      {atLimit && (
        <p className="text-sm text-amber-600">Maximum of {MAX_TOPICS} topics reached. Delete one to add another.</p>
      )}

      {showAddForm && !atLimit && (
        <form
          onSubmit={handleAddTopic}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Title</label>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Property Valuation Basics"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Description</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What does this topic cover?"
              rows={3}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={adding}
              className="rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
            >
              {adding ? "Creating..." : "Create Topic"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-full px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : topics.length === 0 ? (
        <p className="text-sm text-slate-400">No topics yet. Add one above to start building the training.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {topics.map((topic) => {
            const p = progress[topic.id] ?? { total: 0, done: 0 };
            const isDone = p.total > 0 && p.done === p.total;
            return (
              <li
                key={topic.id}
                className={`rounded-2xl border p-5 shadow-sm transition-colors ${
                  isDone ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
                }`}
              >
                {editingId === topic.id ? (
                  <div className="flex flex-col gap-3">
                    <input
                      autoFocus
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                    />
                    <textarea
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      rows={3}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(topic.id)}
                        className="rounded-full bg-[var(--navy-900)] px-4 py-1.5 text-xs text-white font-medium hover:bg-[var(--navy-800)] transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-full px-4 py-1.5 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <Link href={`/admin/rmp-launch/${topic.id}`} className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-[var(--navy-900)] hover:underline">
                          {topic.title}
                        </h3>
                        {isDone ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                            Done
                          </span>
                        ) : p.total > 0 ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                            {p.done} / {p.total} subtopics
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                            No subtopics yet
                          </span>
                        )}
                      </div>
                      {topic.description && (
                        <p className="text-sm text-slate-500 line-clamp-2">{topic.description}</p>
                      )}
                    </Link>
                    <div className="flex items-center gap-2 text-xs shrink-0">
                      <button
                        onClick={() => startEdit(topic)}
                        className="rounded-full px-3 py-1.5 text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTopic(topic.id, topic.title)}
                        className="rounded-full px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
