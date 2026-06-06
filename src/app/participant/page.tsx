import Link from "next/link";
import { redirect } from "next/navigation";

import { getParticipantStatus } from "@/lib/backend/participant";
import { AppError } from "@/lib/http";
import { requireAuthenticatedUser } from "@/lib/security/permissions";

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (status === "approved") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (status === "rejected") return "border-red-500/30 bg-red-500/10 text-red-200";
  if (status === "waitlisted") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-purple-500/30 bg-purple-500/10 text-purple-200";
}

function emailStatusLabel(status?: string | null) {
  if (!status) return "Not sent yet";
  if (status === "sent") return "Sent";
  if (status === "failed") return "Failed";
  return status;
}

export default async function ParticipantPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  try {
    const user = await requireAuthenticatedUser();
    const registrations = await getParticipantStatus(user);
    const resolvedSearchParams = await searchParams;

    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_35%),linear-gradient(180deg,#050a14_0%,#0b1120_100%)] px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Participant Portal
                </div>
                <h1 className="mt-4 text-4xl font-black" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Your Dnyanothsav 2026 Status
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Track your registration approval, QR pass delivery, and meal verification readiness from one place.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Register Another Team
                </Link>
                <Link
                  href="/"
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:text-white"
                >
                  Back To Home
                </Link>
              </div>
            </div>
          </div>

          {resolvedSearchParams.registered === "1" && (
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Registration submitted successfully. Approval emails and QR passes appear here once the admin team processes your entry.
            </div>
          )}

          {registrations.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
              <h2 className="text-2xl font-bold">No Registration Found Yet</h2>
              <p className="mt-3 text-slate-300">
                This signed-in account has not registered for Dnyanothsav 2026 yet.
              </p>
              <Link
                href="/register"
                className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-pink-500"
              >
                Go To Registration
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {registrations.map((registration) => (
                <section
                  key={registration.id}
                  className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold">{registration.event?.title ?? "Dnyanothsav 2026"}</h2>
                        <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${statusTone(registration.registration_status)}`}>
                          {registration.registration_status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        {registration.team?.team_name ?? "Solo"} • {registration.team?.problem_track ?? "Track pending"} • {registration.college_name ?? "College pending"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {registration.event?.venue ?? "Venue pending"} • {formatDateTime(registration.event?.start_date)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                      Registered on {formatDateTime(registration.created_at)}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">Registration Email</p>
                      <p className="mt-3 text-lg font-semibold text-white">
                        {emailStatusLabel(registration.latestRegistrationEmail?.status)}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        {registration.latestRegistrationEmail?.sent_at
                          ? `Sent on ${formatDateTime(registration.latestRegistrationEmail.sent_at)}`
                          : "You should receive this right after registration."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">QR Pass Email</p>
                      <p className="mt-3 text-lg font-semibold text-white">
                        {registration.registration_status === "approved"
                          ? emailStatusLabel(registration.latestQrEmail?.status)
                          : "Waiting for approval"}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        {registration.latestQrEmail?.sent_at
                          ? `Last sent on ${formatDateTime(registration.latestQrEmail.sent_at)}`
                          : registration.registration_status === "approved"
                            ? "Approved, but the QR email has not been confirmed yet."
                            : "The QR code is generated only after admin approval."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Meal Verification</p>
                      <p className="mt-3 text-lg font-semibold text-white">
                        {registration.claims.length > 0 ? `${registration.claims.length} claim(s)` : "No scans yet"}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        {registration.qr_generated_at
                          ? `QR refreshed on ${formatDateTime(registration.qr_generated_at)}`
                          : "Your meal coupons become active once the QR pass is issued."}
                      </p>
                    </div>
                  </div>

                  {registration.latestQrEmail?.status === "failed" && (
                    <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                      Your registration is approved, but the last QR email attempt failed. Contact the event admin so they can resend the QR pass.
                    </div>
                  )}

                  {registration.registration_status === "rejected" && registration.latestRejectionEmail?.sent_at && (
                    <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      A rejection update was emailed on {formatDateTime(registration.latestRejectionEmail.sent_at)}.
                    </div>
                  )}

                  {registration.claims.length > 0 && (
                    <div className="mt-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-300">Recent Service Claims</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {registration.claims.slice(0, 6).map((claim, index) => (
                          <div key={`${claim.scanned_at}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                            <p className="font-semibold text-white">{claim.service_type?.name ?? "Service Claim"}</p>
                            <p className="mt-1 text-sm text-slate-400">{claim.status}</p>
                            <p className="mt-2 text-xs text-slate-500">{formatDateTime(claim.scanned_at)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof AppError && error.status === 401) {
      redirect("/login?next=/participant");
    }

    throw error;
  }
}
