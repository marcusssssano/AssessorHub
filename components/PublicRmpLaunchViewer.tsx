"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RmpTopic } from "@/lib/types";

interface SubtopicProgress {
  total: number;
  done: number;
}

export default function PublicRmpLaunchViewer() {
  const supabase = useMemo(() => createClient(), []);

  const [topics, setTopics] = useState<RmpTopic[]>([]);
  const [progress, setProgress] = useState<Record<string, SubtopicProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
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
    load();
  }, [supabase]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center">
        <Link
          href="/rmp-launch/materials"
          className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-[var(--navy-900)] hover:bg-slate-50 transition-colors"
        >
          View Materials
        </Link>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400 text-center">Loading...</p>
      ) : topics.length === 0 ? (
        <p className="text-sm text-slate-400 text-center">No topics yet.</p>
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
                <Link href={`/rmp-launch/${topic.id}`} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[var(--navy-900)] hover:underline">{topic.title}</h3>
                    {isDone ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
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
                  {topic.description && <p className="text-sm text-slate-500 line-clamp-2">{topic.description}</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
