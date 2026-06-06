"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const next = searchParams.get("next") || "/register";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        router.push(next);
        router.refresh();
        return;
      }

      const redirectTo = new URL("/auth/confirm", window.location.origin);
      redirectTo.searchParams.set("next", next);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo.toString(),
          data: {
            full_name: fullName,
            phone,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        router.push(next);
        router.refresh();
        return;
      }

      setMessage("Account created. Please check your email and confirm your address before signing in.");
    } catch (caughtError) {
      const authError =
        caughtError instanceof Error ? caughtError.message : "Unable to complete authentication.";
      setError(authError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {mode === "signup" && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
              placeholder="Your full name"
              type="text"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="phone">
              Phone Number
            </label>
            <input
              id="phone"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
              placeholder="+91 98765 43210"
              type="tel"
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300" htmlFor="email">
          Email Address
        </label>
        <input
          id="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
          placeholder="you@example.com"
          type="email"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
          placeholder="At least 8 characters"
          type="password"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-bold text-white shadow-lg shadow-purple-900/30 transition hover:from-purple-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
      </button>

      {mode === "login" && (
        <p className="text-center text-sm text-slate-400">
          Need an account?{" "}
          <Link className="font-semibold text-purple-300 hover:text-purple-200" href={`/signup?next=${encodeURIComponent(next)}`}>
            Sign up
          </Link>
        </p>
      )}
    </form>
  );
}
