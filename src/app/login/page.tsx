import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedSearchParams = await searchParams;
  const next = resolvedSearchParams.next || "/register";

  if (user) {
    redirect(next);
  }

  return (
    <AuthShell
      title="Sign in to continue"
      subtitle="Access your participant dashboard and secure registration flow."
      alternateText="New to Dnyanothsav?"
      alternateHref={`/signup?next=${encodeURIComponent(next)}`}
      alternateLabel="Create an account"
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
