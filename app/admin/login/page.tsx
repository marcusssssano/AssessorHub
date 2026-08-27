"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 bg-[var(--navy-900)]">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/80 hover:text-white hover:border-white/40 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back
        </Link>
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-5 rounded-3xl border border-white/10 bg-white p-8 shadow-2xl"
        >
        <div className="flex flex-col items-center gap-3 pb-2">
          <img src="/logo-mark.png" alt="Vantage" className="h-12 w-12 rounded-2xl object-cover" />
          <div className="text-center">
            <h1 className="text-lg font-semibold text-[var(--navy-900)]">
              Admin Login
            </h1>
            <p className="text-sm text-slate-400">Sign in to manage Vantage</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-slate-500">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-medium text-slate-500">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[var(--navy-900)] px-4 py-2.5 text-white font-medium hover:bg-[var(--navy-800)] transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        </form>
      </div>
    </div>
  );
}
