import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { getConfiguredAdminEmail, ensureConfiguredAdminAccount } from "@/lib/security/admin-account";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLoginPage() {
  await ensureConfiguredAdminAccount();

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
      <AdminLoginForm adminEmail={getConfiguredAdminEmail()} />
    </AuthShell>
  );
}
