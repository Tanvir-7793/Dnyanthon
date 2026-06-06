"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminLoginForm({ adminEmail }: { adminEmail: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push("/admin");
      router.refresh();
    } catch (caughtError) {
      const authError =
        caughtError instanceof Error ? caughtError.message : "Unable to sign in to the admin panel.";
      setError(authError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300" htmlFor="adminEmail">
          Admin Email
        </label>
        <input
          id="adminEmail"
          readOnly
          value={adminEmail}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 outline-none"
          type="email"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300" htmlFor="adminPassword">
          Password
        </label>
        <input
          id="adminPassword"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
          placeholder="Enter admin password"
          type="password"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-bold text-white shadow-lg shadow-purple-900/30 transition hover:from-purple-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Please wait..." : "Sign In As Admin"}
      </button>
    </form>
  );
}
