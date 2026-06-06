import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  alternateText,
  alternateHref,
  alternateLabel,
  children,
}: {
  title: string;
  subtitle: string;
  alternateText: string;
  alternateHref: string;
  alternateLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-10 backdrop-blur-xl lg:block">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Secure Supabase Auth
            </div>
            <h1 className="max-w-xl text-5xl font-black leading-tight">
              Access the
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                {" "}Dnyanothon 2026
              </span>
              {" "}participant portal.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Sign in to manage your registration, receive your QR pass, and stay synced with approvals, meal access, and event updates.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {[
                "Protected registration with Supabase Auth",
                "Server-side role checks for admin and volunteer actions",
                "Signed QR passes for entry and meals",
                "Email notifications for approval and updates",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-purple-900/20 backdrop-blur-xl sm:p-10">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              ← Back to Home
            </Link>
            <h2 className="text-3xl font-bold">{title}</h2>
            <p className="mt-2 text-slate-400">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-8 text-sm text-slate-400">
              {alternateText}{" "}
              <Link className="font-semibold text-purple-300 hover:text-purple-200" href={alternateHref}>
                {alternateLabel}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
