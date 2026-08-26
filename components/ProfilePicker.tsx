"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AppUser } from "@/lib/types";

export default function ProfilePicker() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<AppUser | null>(null);
  const [welcoming, setWelcoming] = useState<AppUser | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("app_users")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })
        .limit(50);

      if (error) {
        setError(error.message);
      } else {
        setUsers(data ?? []);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  function handleConfirm() {
    if (!pending) return;
    try {
      sessionStorage.setItem("ah_user_name", pending.name);
    } catch {
      // ignore
    }
    setWelcoming(pending);
    setPending(null);
    setTimeout(() => {
      router.push("/links");
    }, 1300);
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-10 bg-[var(--navy-900)]">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-white font-bold text-xl">
          AH
        </div>
        <h1 className="text-2xl font-semibold text-white">Who&apos;s using AssessorHub?</h1>
      </div>

      {loading && <p className="text-sm text-white/50">Loading profiles...</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}

      {!loading && !error && users.length === 0 && (
        <p className="text-sm text-white/50">
          No profiles yet. Add one from the admin panel.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-6">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => setPending(u)}
            className="group flex flex-col items-center gap-3"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[var(--accent)] text-white text-3xl font-bold shadow-lg transition-transform group-hover:scale-105 group-hover:ring-4 group-hover:ring-white/20">
              {u.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
              {u.name}
            </span>
          </button>
        ))}
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
          onClick={() => setPending(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-white text-xl font-bold">
              {pending.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-base text-[var(--navy-900)]">
              Are you sure you want to proceed using <strong>{pending.name}&apos;s Dashboard</strong>?
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setPending(null)}
                className="flex-1 rounded-full px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-full bg-[var(--navy-900)] px-5 py-2.5 text-sm text-white font-medium hover:bg-[var(--navy-800)] transition-colors"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {welcoming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--navy-900)]">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)] text-white text-2xl font-bold">
              {welcoming.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-2xl font-semibold text-white">Welcome {welcoming.name}!</p>
          </div>
        </div>
      )}
    </div>
  );
}
