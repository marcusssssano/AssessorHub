"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RmpMaterial } from "@/lib/types";

const BUCKET = "rmp-materials";

export default function PublicRmpLaunchMaterials() {
  const supabase = useMemo(() => createClient(), []);

  const [materials, setMaterials] = useState<RmpMaterial[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("rmp_materials")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        const list = (data ?? []) as RmpMaterial[];
        setMaterials(list);
        const urlMap: Record<string, string> = {};
        for (const m of list) {
          urlMap[m.id] = supabase.storage.from(BUCKET).getPublicUrl(m.file_path).data.publicUrl;
        }
        setUrls(urlMap);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400 text-center">Loading...</p>
      ) : materials.length === 0 ? (
        <p className="text-sm text-slate-400 text-center">No materials uploaded yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {materials.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <a
                href={urls[m.id]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                {m.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
