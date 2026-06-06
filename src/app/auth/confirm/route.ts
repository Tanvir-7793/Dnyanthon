import { NextResponse } from "next/server";

import { getAppEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/register";

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "email" | "recovery" | "invite" | "email_change",
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, getAppEnv().APP_URL));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirmation_failed", getAppEnv().APP_URL));
}
