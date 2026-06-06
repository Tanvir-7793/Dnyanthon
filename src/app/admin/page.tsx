import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { listManagedEvents } from "@/lib/backend/admin";
import { AppError } from "@/lib/http";
import { getConfiguredAdminEmail } from "@/lib/security/admin-account";
import { requireAuthenticatedUser } from "@/lib/security/permissions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  let user;

  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AppError) {
      if (error.status === 401) {
        redirect("/admin-login");
      }

      if (error.status === 403) {
        return (
          <div className="min-h-screen bg-[linear-gradient(180deg,#050a14_0%,#0b1120_100%)] px-6 py-20 text-white">
            <div className="mx-auto max-w-3xl rounded-[30px] border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">Admin Access</p>
              <h1
                className="mt-4 text-4xl font-black"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                This Account Is Not An Admin Yet
              </h1>
              <p className="mt-4 text-slate-300">
                Sign in with an admin account, or promote this user in Supabase by setting
                `public.profiles.role` to `admin` or `super_admin`.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/admin-login"
                  className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Sign In As Admin
                </Link>
                <Link
                  href="/"
                  className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:text-white"
                >
                  Back To Home
                </Link>
              </div>
            </div>
          </div>
        );
      }
    }

    throw error;
  }

  if (user.role !== "admin" && user.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#050a14_0%,#0b1120_100%)] px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl rounded-[30px] border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">Admin Access</p>
          <h1
            className="mt-4 text-4xl font-black"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            This Account Is Not An Admin Yet
          </h1>
          <p className="mt-4 text-slate-300">
            Sign in with an admin account, or promote this user in Supabase by setting
            `public.profiles.role` to `admin` or `super_admin`.
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-left text-sm text-slate-200">
            <p>
              <span className="font-semibold text-white">Configured admin email:</span> {getConfiguredAdminEmail()}
            </p>
            <p className="mt-2">
              <span className="font-semibold text-white">Signed in email:</span> {user.email}
            </p>
            <p>
              <span className="font-semibold text-white">Current role:</span> {user.role}
            </p>
          </div>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/admin-login"
              className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Sign In As Admin
            </Link>
            <SignOutButton
              redirectTo="/admin-login"
              className="rounded-full border border-rose-400/20 bg-rose-500/10 px-6 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-70"
            />
            <Link
              href="/"
              className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:text-white"
            >
              Back To Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const events = await listManagedEvents(user);

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#050a14_0%,#0b1120_100%)] px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl rounded-[30px] border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">Admin Access</p>
          <h1
            className="mt-4 text-4xl font-black"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            No Managed Events Found
          </h1>
          <p className="mt-4 text-slate-300">
            Your account is an admin, but it is not currently attached to any event via `events.created_by`.
          </p>
        </div>
      </div>
    );
  }

  const resolvedSearchParams = await searchParams;
  const defaultEventId = events[0]?.id;
  const requestedEventId = resolvedSearchParams.eventId;
  const selectedEventId =
    requestedEventId && events.some((event) => event.id === requestedEventId)
      ? requestedEventId
      : defaultEventId;

  if (!selectedEventId) {
    redirect("/");
  }

  return (
    <AdminDashboardClient
      eventId={selectedEventId}
      events={events.map((event) => ({
        id: event.id,
        title: event.title,
        slug: event.slug,
        venue: event.venue,
        start_date: event.start_date,
        status: event.status,
      }))}
      user={{
        name: user.profile.full_name,
        email: user.email,
        role: user.role,
      }}
    />
  );
}
