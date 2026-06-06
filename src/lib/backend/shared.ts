import { AppError, normalizeOptionalString } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, EventRow, Json } from "@/lib/types/supabase";

type EventRef = {
  eventId?: string;
  eventSlug?: string;
};

export async function resolveEventOrThrow(ref: EventRef) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("events").select("*");

  if (ref.eventId) {
    query = query.eq("id", ref.eventId);
  } else if (ref.eventSlug) {
    query = query.eq("slug", ref.eventSlug);
  } else {
    throw new AppError(400, "Event reference is required.");
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("Supabase error in resolveEventOrThrow:", error);
      throw new AppError(500, `Database error: ${error.message}`);
    }
    
    const refType = ref.eventId ? "ID" : "slug";
    const refValue = ref.eventId || ref.eventSlug;
    throw new AppError(404, `Event not found. No event exists with ${refType} "${refValue}".`);
  }

  return data as EventRow;
}

export function assertEventIsOpen(event: EventRow) {
  if (!event.registration_open) {
    throw new AppError(400, "Registrations are currently closed for this event.");
  }

  if (!["published", "live"].includes(event.status)) {
    throw new AppError(400, "This event is not accepting registrations right now.");
  }
}

export function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export function formatSupabaseErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim().length > 0
  ) {
    return process.env.NODE_ENV === "production"
      ? fallback
      : `${fallback} (${error.message})`;
  }

  return fallback;
}

export function formatErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallback;
}

export async function insertAuditLog(input: Database["public"]["Tables"]["audit_logs"]["Insert"]) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    metadata: {},
    ...input,
  });

  if (error) {
    console.error("Failed to insert audit log", error);
  }
}

export async function insertEmailLog(input: Database["public"]["Tables"]["email_logs"]["Insert"]) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("email_logs").insert(input);

  if (error) {
    console.error("Failed to insert email log", error);
  }
}

export function formatEventDateLabel(event: Pick<EventRow, "start_date" | "end_date">) {
  if (!event.start_date) {
    return "Date to be announced";
  }

  const formatter = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  const start = formatter.format(new Date(event.start_date));
  const end = event.end_date ? formatter.format(new Date(event.end_date)) : null;

  return end ? `${start} to ${end}` : start;
}

export function cleanNullable(value?: string | null) {
  return normalizeOptionalString(value) ?? null;
}

export function toJson<T extends Json>(value: T) {
  return value;
}
