import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/env";
import type { Database } from "@/lib/types/supabase";

export function createSupabaseAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("Supabase admin client cannot be imported in the browser.");
  }

  const env = getSupabaseAdminEnv();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
