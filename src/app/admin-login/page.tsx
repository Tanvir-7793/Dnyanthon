export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { getConfiguredAdminEmail, ensureConfiguredAdminAccount } from "@/lib/security/admin-account";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLoginPage() {
  let provisioningWarning: string | null = null;
  try {
    await ensureConfiguredAdminAccount();
  } catch (error) {
    // Last-resort catch: ensureConfigured now returns null on most failures,
    // but keep page rendering even if it still throws (e.g. hard create conflict).
    console.warn("[admin-login] ensureConfiguredAdminAccount threw, rendering login anyway:", error);
    provisioningWarning =
      error instanceof Error && error.message ? error.message : "Admin auto-provisioning failed. You can still sign in if the account exists, or create it manually in Supabase Auth.";
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email?.toLowerCase() === getConfiguredAdminEmail().toLowerCase()) {
    redirect("/admin");
  }

  return (
    <AuthShell
      title="Admin sign in"
      subtitle="Use the dedicated Dnyanothsav admin account to manage approvals, scans, meals, and event operations."
      alternateText="Need participant access instead?"
      alternateHref="/login?next=/register"
      alternateLabel="Go to participant login"
    >
      {provisioningWarning && (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <p className="font-semibold">Admin provisioning warning</p>
          <p className="mt-1 text-xs leading-relaxed opacity-90">{provisioningWarning}</p>
          <p className="mt-2 text-xs opacity-70">
            If this is a DNS/connection error (<code className="rounded bg-black/20 px-1 py-0.5">ENOTFOUND</code>), verify
            <code className="rounded bg-black/20 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-black/20 px-1 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code> in{" "}
            <code className="rounded bg-black/20 px-1 py-0.5">.env.local</code> and that the Supabase project is not
            paused.
          </p>
        </div>
      )}
      <AdminLoginForm adminEmail={getConfiguredAdminEmail()} />
    </AuthShell>
  );
}
