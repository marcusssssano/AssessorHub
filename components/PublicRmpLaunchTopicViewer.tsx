"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RmpSubtopic, RmpTopic } from "@/lib/types";
import RmpSubtopicNotesModal from "@/components/RmpSubtopicNotesModal";

export default function PublicRmpLaunchTopicViewer({ topicId }: { topicId: string }) {
  const supabase = useMemo(() => createClient(), []);

  const [topic, setTopic] = useState<RmpTopic | null>(null);
  const [subtopics, setSubtopics] = useState<RmpSubtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notesModalFor, setNotesModalFor] = useState<RmpSubtopic | null>(null);

  useEffect(() => {
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
        setSubtopics((subtopicData ?? []) as RmpSubtopic[]);
      }
      setLoading(false);
    }
    load();
  }, [topicId, supabase]);

  const isDone = subtopics.length > 0 && subtopics.every((s) => s.done);

  if (notFound) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/rmp-launch" className="text-sm text-[var(--accent)] hover:underline w-fit">
          ← Back to RMP Launch
        </Link>
        <p className="text-sm text-slate-500">Topic not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/rmp-launch" className="text-sm text-[var(--accent)] hover:underline w-fit">
          ← Back to RMP Launch
        </Link>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{topic?.title ?? "Loading..."}</h2>
          {isDone && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Done
            </span>
          )}
        </div>
        {topic?.description && <p className="text-sm text-slate-500">{topic.description}</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : subtopics.length === 0 ? (
        <p className="text-sm text-slate-400">No subtopics yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {subtopics.map((s) => (
            <li key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    s.done ? "bg-emerald-500 border-emerald-500" : "bg-slate-300 border-slate-300"
                  }`}
                >
                  {s.done && (
                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </span>
                <span className={`text-sm font-medium ${s.done ? "text-slate-400 line-through" : "text-[var(--navy-900)]"}`}>
                  {s.name}
                </span>
              </div>
              <div className="pl-7">
                <button
                  onClick={() => setNotesModalFor(s)}
                  className="flex w-full flex-col gap-1 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-500 hover:border-[var(--accent)] hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs font-medium text-slate-400">Notes</span>
                  <span className="line-clamp-2 break-words">{s.notes ? s.notes : "No notes yet."}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {notesModalFor && (
        <RmpSubtopicNotesModal subtopic={notesModalFor} onClose={() => setNotesModalFor(null)} readOnly />
      )}
    </div>
  );
}
