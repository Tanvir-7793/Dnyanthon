import { redirect } from "next/navigation";

import RegistrationPage from "@/components/Registration";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Register() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/register");
  }

  return <RegistrationPage />;
}

