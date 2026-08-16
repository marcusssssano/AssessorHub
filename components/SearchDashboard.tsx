"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Link } from "@/lib/types";

export default function SearchDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);

      let request = supabase
        .from("links")
        .select("*")
        .order("title", { ascending: true });

      if (query.trim()) {
        request = request.ilike("title", `%${query.trim()}%`);
      }

      const { data, error } = await request;

      if (error) {
        setError(error.message);
      } else {
        setLinks(data ?? []);
      }
      setLoading(false);
    }, 150);

    return () => clearTimeout(handle);
  }, [query, supabase]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name (e.g. Maricopa, Hauskon)..."
          className="w-full rounded-full border border-slate-200 bg-white pl-12 pr-5 py-4 text-base shadow-[0_2px_12px_rgba(15,29,56,0.08)] outline-none transition-shadow focus:border-[var(--accent)] focus:shadow-[0_2px_16px_rgba(47,111,237,0.25)]"
        />
      </div>

      {error && <p className="text-sm text-red-600 px-2">{error}</p>}

      {!loading && query.trim() && links.length === 0 && !error && (
        <p className="text-sm text-slate-400 text-center">
          No links match &quot;{query}&quot;.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-[var(--accent)]/40 hover:shadow-[0_4px_16px_rgba(15,29,56,0.08)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757M10.81 15.312a4.5 4.5 0 0 1-1.242-7.244l4.5-4.5a4.5 4.5 0 0 1 6.364 6.364l-1.757 1.757"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="font-medium text-[var(--navy-900)] group-hover:text-[var(--accent)] transition-colors">
                  {link.title}
                </span>
                <span className="text-xs text-slate-400 truncate">{link.url}</span>
                {link.notes && (
                  <span className="text-xs text-slate-400 mt-1">{link.notes}</span>
                )}
              </div>
            </a>
          </li>
        ))}
      </ul>

      {loading && (
        <p className="text-sm text-slate-400 text-center">Loading...</p>
      )}
    </div>
  );
}
