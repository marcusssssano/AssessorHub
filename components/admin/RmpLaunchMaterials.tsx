"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RmpMaterial } from "@/lib/types";

const MAX_MATERIALS = 2;
const BUCKET = "rmp-materials";

export default function RmpLaunchMaterials() {
  const supabase = useMemo(() => createClient(), []);

  const [materials, setMaterials] = useState<RmpMaterial[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    if (!file) {
      setError("Choose a PDF file.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }

    setUploading(true);
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: "application/pdf",
    });
    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase.from("rmp_materials").insert({
      title: title.trim(),
      file_path: path,
    });
    setUploading(false);

    if (insertError) {
      await supabase.storage.from(BUCKET).remove([path]);
      setError(insertError.message);
      return;
    }

    setTitle("");
    setFile(null);
    await load();
  }

  async function handleDelete(material: RmpMaterial) {
    if (!confirm(`Delete "${material.title}"? This cannot be undone.`)) return;
    const { error: deleteError } = await supabase.from("rmp_materials").delete().eq("id", material.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await supabase.storage.from(BUCKET).remove([material.file_path]);
    await load();
  }

  const atLimit = materials.length >= MAX_MATERIALS;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <span className="text-sm font-medium text-slate-500">
          {materials.length} / {MAX_MATERIALS} materials uploaded
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {atLimit ? (
        <p className="text-sm text-amber-600">
          Maximum of {MAX_MATERIALS} materials reached. Delete one to upload another.
        </p>
      ) : (
        <form onSubmit={handleUpload} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. RMP Launch Reference Guide"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">PDF file</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50 w-fit"
          >
            {uploading ? "Uploading..." : "Upload PDF"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : materials.length === 0 ? (
        <p className="text-sm text-slate-400">No materials uploaded yet.</p>
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
              <button
                onClick={() => handleDelete(m)}
                className="rounded-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
