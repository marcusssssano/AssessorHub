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
      <input
        autoFocus
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name (e.g. Maricopa, Hauskon)..."
        className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-lg shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && query.trim() && links.length === 0 && !error && (
        <p className="text-sm text-gray-500">No links match &quot;{query}&quot;.</p>
      )}

      <ul className="flex flex-col divide-y divide-black/5 rounded-lg border border-black/10 bg-white overflow-hidden">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-0.5 px-4 py-3 hover:bg-blue-50 transition-colors"
            >
              <span className="font-medium text-gray-900">{link.title}</span>
              <span className="text-xs text-gray-500 truncate">{link.url}</span>
              {link.notes && (
                <span className="text-xs text-gray-400 mt-1">{link.notes}</span>
              )}
            </a>
          </li>
        ))}
      </ul>

      {loading && <p className="text-sm text-gray-400 text-center">Loading...</p>}
    </div>
  );
}
