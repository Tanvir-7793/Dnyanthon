import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SignupPage({
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
      title="Create your account"
      subtitle="Sign up once, then complete hackathon registration with your verified identity."
      alternateText="Already have an account?"
      alternateHref={`/login?next=${encodeURIComponent(next)}`}
      alternateLabel="Sign in"
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
