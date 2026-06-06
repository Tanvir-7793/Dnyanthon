import "server-only";

import type { User } from "@supabase/supabase-js";

import { AppError } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createSupabaseServerClient,
  createSupabaseTokenValidationClient,
} from "@/lib/supabase/server";
import type { ProfileRow, Role, VolunteerRow } from "@/lib/types/supabase";

export type UserContext = {
  userId: string;
  email: string;
  role: Role;
  profile: ProfileRow;
};

function logAuthFailure(request: Request | undefined, reason: string) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const headers = request?.headers;
  const cookieHeader = headers?.get("cookie");

  console.warn("[auth] request rejected", {
    reason,
    method: request?.method ?? null,
    url: request ? new URL(request.url).pathname : null,
    origin: headers?.get("origin") ?? null,
    referer: headers?.get("referer") ?? null,
    userAgent: headers?.get("user-agent") ?? null,
    hasAuthorizationHeader: Boolean(headers?.get("authorization")),
    hasCookieHeader: Boolean(cookieHeader),
    cookiePreview: cookieHeader ? cookieHeader.slice(0, 120) : null,
  });
}

async function ensureProfileForUser(user: User) {
  const admin = createSupabaseAdminClient();
  const fullName =
    typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim().length > 0
      ? user.user_metadata.full_name.trim()
      : user.email?.split("@")[0] || "Participant";
  const phone =
    typeof user.user_metadata?.phone === "string" && user.user_metadata.phone.trim().length > 0
      ? user.user_metadata.phone.trim()
      : null;
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url.trim().length > 0
      ? user.user_metadata.avatar_url.trim()
      : null;

  const { error: upsertError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      email: user.email ?? "",
      phone,
      role: "participant",
      avatar_url: avatarUrl,
    },
    {
      onConflict: "id",
    },
  );

  if (upsertError) {
    console.error("Failed to self-heal missing profile", upsertError);
    return null;
  }

  const { data: repairedProfile, error: repairedProfileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (repairedProfileError || !repairedProfile) {
    console.error("Profile still missing after self-heal", repairedProfileError);
    return null;
  }

  return repairedProfile;
}

function getBearerAccessToken(request?: Request) {
  const authorizationHeader = request?.headers.get("authorization")?.trim();
  if (!authorizationHeader) {
    return null;
  }

  const bearerMatch = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!bearerMatch) {
    throw new AppError(401, "You must be signed in to continue.");
  }

  const accessToken = bearerMatch[1]?.trim();
  if (!accessToken) {
    throw new AppError(401, "You must be signed in to continue.");
  }

  return accessToken;
}

async function getAuthenticatedSupabaseUser(request?: Request) {
  const accessToken = getBearerAccessToken(request);

  if (accessToken) {
    const supabase = createSupabaseTokenValidationClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      logAuthFailure(request, error?.message ?? "invalid_bearer_token");
      throw new AppError(401, "You must be signed in to continue.");
    }

    return user;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    logAuthFailure(request, error?.message ?? "missing_server_session");
    throw new AppError(401, "You must be signed in to continue.");
  }

  return user;
}

export async function requireAuthenticatedUser(request?: Request): Promise<UserContext> {
  const user = await getAuthenticatedSupabaseUser(request);

  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const resolvedProfile = profile ?? (await ensureProfileForUser(user));

  if ((profileError && !resolvedProfile) || !resolvedProfile) {
    throw new AppError(403, "Your profile is not available yet. Please sign in again.");
  }

  return {
    userId: user.id,
    email: user.email ?? resolvedProfile.email,
    role: resolvedProfile.role,
    profile: resolvedProfile,
  };
}

export function assertRole(context: UserContext, allowedRoles: Role[]) {
  if (!allowedRoles.includes(context.role)) {
    throw new AppError(403, "You do not have permission to perform this action.");
  }
}

export async function assertCanManageEvent(eventId: string, context: UserContext) {
  if (context.role === "super_admin") {
    return;
  }

  if (context.role !== "admin") {
    throw new AppError(403, "Admin access is required.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("created_by", context.userId)
    .single();

  if (error || !data) {
    throw new AppError(403, "You do not manage this event.");
  }
}

export async function assertVolunteerAssignment(options: {
  context: UserContext;
  eventId: string;
  serviceTypeId?: string;
}) {
  if (options.context.role === "super_admin" || options.context.role === "admin") {
    return null;
  }

  if (options.context.role !== "volunteer") {
    throw new AppError(403, "Volunteer access is required.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("volunteers")
    .select("*")
    .eq("user_id", options.context.userId)
    .eq("event_id", options.eventId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new AppError(403, "You are not assigned to this event.");
  }

  if (
    options.serviceTypeId &&
    data.assigned_service_id &&
    data.assigned_service_id !== options.serviceTypeId
  ) {
    throw new AppError(403, "You are not assigned to this service.");
  }

  return data as VolunteerRow;
}

export async function requireAdminUser(request?: Request) {
  const context = await requireAuthenticatedUser(request);
  assertRole(context, ["admin", "super_admin"]);
  return context;
}

export async function requireVolunteerUser(request?: Request) {
  const context = await requireAuthenticatedUser(request);
  assertRole(context, ["volunteer", "admin", "super_admin"]);
  return context;
}
