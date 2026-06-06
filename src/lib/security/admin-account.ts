import "server-only";

import { AppError } from "@/lib/http";
import { getAdminAuthEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export function getConfiguredAdminEmail() {
  return getAdminAuthEnv().ADMIN_LOGIN_EMAIL;
}

export async function ensureConfiguredAdminAccount() {
  const { ADMIN_LOGIN_EMAIL, ADMIN_LOGIN_PASSWORD } = getAdminAuthEnv();
  const admin = createSupabaseAdminClient();

  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (usersError) {
    throw new AppError(500, "Unable to prepare the admin account.", false);
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
      console.error("Unable to create configured admin user", createError);
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
      console.error("Unable to update configured admin password", updateAuthError);
      throw new AppError(500, "Unable to prepare the admin account.", false);
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
    console.error("Unable to promote configured admin profile", profileError);
    throw new AppError(500, "Unable to prepare the admin account.", false);
  }

  return {
    email: ADMIN_LOGIN_EMAIL,
    password: ADMIN_LOGIN_PASSWORD,
  };
}
