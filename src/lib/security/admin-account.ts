import "server-only";

import { AppError } from "@/lib/http";
import { getAdminAuthEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export function getConfiguredAdminEmail() {
  return getAdminAuthEnv().ADMIN_LOGIN_EMAIL;
}

export async function ensureConfiguredAdminAccount(): Promise<{ email: string; password: string } | null> {
  const { ADMIN_LOGIN_EMAIL, ADMIN_LOGIN_PASSWORD } = getAdminAuthEnv();

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch (envError) {
    console.warn("[admin-account] Supabase admin env not configured, skipping auto-provision:", envError);
    return null;
  }

  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (usersError) {
    console.warn("[admin-account] listUsers failed, skipping auto-provision:", {
      message: usersError.message,
      status: (usersError as { status?: number }).status,
      name: usersError.name,
    });
    // Don't hard-fail the login page — admin may already exist or provisioning can be retried later.
    // Return null so the page still renders; ops can create the account manually in Supabase Auth.
    return null;
  }

  const normalizedEmail = ADMIN_LOGIN_EMAIL.toLowerCase();
  let authUser = usersData.users.find((user) => user.email?.toLowerCase() === normalizedEmail) ?? null;

  if (!authUser) {
    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email: ADMIN_LOGIN_EMAIL,
      password: ADMIN_LOGIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: "Dnyanothsav Admin",
      },
    });

    if (createError || !createdUser.user) {
      console.error("[admin-account] createUser failed:", createError);
      // If create failed due to race/user already exists, treat as non-fatal
      const msg = (createError as { message?: string })?.message?.toLowerCase() ?? "";
      if (msg.includes("already") || msg.includes("exists") || msg.includes("duplicate")) {
        console.warn("[admin-account] Admin user likely already exists, continuing without provisioning.");
        return null;
      }
      throw new AppError(500, "Unable to prepare the admin account.", false);
    }

    authUser = createdUser.user;
  } else {
    const { error: updateAuthError } = await admin.auth.admin.updateUserById(authUser.id, {
      password: ADMIN_LOGIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        ...authUser.user_metadata,
        full_name:
          typeof authUser.user_metadata?.full_name === "string" && authUser.user_metadata.full_name.trim().length > 0
            ? authUser.user_metadata.full_name
            : "Dnyanothsav Admin",
      },
    });

    if (updateAuthError) {
      console.warn("[admin-account] updateUserById failed, continuing (login may still work):", updateAuthError);
      // Don't block login — password sync is best-effort. Return null but don't throw.
      return {
        email: ADMIN_LOGIN_EMAIL,
        password: ADMIN_LOGIN_PASSWORD,
      };
    }
  }

  const fullName =
    typeof authUser.user_metadata?.full_name === "string" && authUser.user_metadata.full_name.trim().length > 0
      ? authUser.user_metadata.full_name.trim()
      : "Dnyanothsav Admin";

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: authUser.id,
      full_name: fullName,
      email: ADMIN_LOGIN_EMAIL,
      phone: null,
      role: "super_admin",
      avatar_url: null,
    },
    {
      onConflict: "id",
    },
  );

  if (profileError) {
    console.warn("[admin-account] profile upsert failed, login may still proceed:", profileError);
    // Profile sync is best-effort — admin can be promoted manually via `public.profiles.role = super_admin`
    return {
      email: ADMIN_LOGIN_EMAIL,
      password: ADMIN_LOGIN_PASSWORD,
    };
  }

  return {
    email: ADMIN_LOGIN_EMAIL,
    password: ADMIN_LOGIN_PASSWORD,
  };
}
