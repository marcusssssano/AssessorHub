"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppUser } from "@/lib/types";

export default function UsersManager() {
  const supabase = useMemo(() => createClient(), []);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_users")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .limit(200);

    if (error) {
      setError(error.message);
    } else {
      setUsers(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!newName.trim()) {
      setError("Name is required.");
      return;
    }
    setAdding(true);
    const { error } = await supabase
      .from("app_users")
      .insert({ name: newName.trim().toUpperCase(), sort_order: users.length });
    setAdding(false);

    if (error) {
      setError(error.message);
      return;
    }
    setNewName("");
    await loadUsers();
  }

  async function handleSaveEdit(id: string) {
    if (!editingName.trim()) return;
    const { error } = await supabase
      .from("app_users")
      .update({ name: editingName.trim().toUpperCase() })
      .eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setEditingId(null);
    await loadUsers();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete profile "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("app_users").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await loadUsers();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleAdd} className="flex items-end gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">New profile name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. MARCUS"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
          >
            {adding ? "Adding..." : "+ Add Profile"}
          </button>
        </form>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <p className="px-5 py-3 text-xs font-medium text-slate-400 border-b border-slate-100 bg-slate-50/50">
            {users.length} profile{users.length === 1 ? "" : "s"}
          </p>
          <ul className="divide-y divide-slate-100">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors"
              >
                {editingId === u.id ? (
                  <div className="flex flex-1 items-center gap-3">
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                    />
                    <button
                      onClick={() => handleSaveEdit(u.id)}
                      className="rounded-full bg-[var(--navy-900)] px-4 py-2 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-full px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--accent)] font-bold text-sm">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[var(--navy-900)]">{u.name}</span>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 text-sm">
                      <button
                        onClick={() => {
                          setEditingId(u.id);
                          setEditingName(u.name);
                        }}
                        className="rounded-full px-3 py-1.5 text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        className="rounded-full px-3 py-1.5 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
