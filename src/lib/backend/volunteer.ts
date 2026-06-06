import { AppError } from "@/lib/http";
import { hashQrToken, secureCompare } from "@/lib/security/hash";
import { assertVolunteerAssignment } from "@/lib/security/permissions";
import type { UserContext } from "@/lib/security/permissions";
import { verifySignedQrPayload } from "@/lib/security/qr-token";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { syncOfflineClaimsSchema, verifyQrAndClaimServiceSchema } from "@/lib/validations/qr";

import { insertAuditLog, toJson } from "./shared";

export type VerifyQrResponseState =
  | "VERIFIED"
  | "ALREADY_CLAIMED"
  | "INVALID_QR"
  | "NOT_APPROVED"
  | "SERVICE_CLOSED"
  | "UNAUTHORIZED_VOLUNTEER";

const INVALID_SCAN_ACTIONS = [
  "qr.scan_invalid",
  "qr.scan_duplicate",
  "qr.scan_not_approved",
  "qr.scan_service_closed",
  "qr.scan_unauthorized_volunteer",
] as const;

function isServiceWindowOpen(startTime: string | null, endTime: string | null) {
  const now = new Date();

  if (startTime && now < new Date(startTime)) {
    return false;
  }

  if (endTime && now > new Date(endTime)) {
    return false;
  }

  return true;
}

function getServiceStatus(startTime: string | null, endTime: string | null, isActive: boolean) {
  if (!isActive) {
    return "Closed" as const;
  }

  const now = new Date();

  if (startTime && now < new Date(startTime)) {
    return "Upcoming" as const;
  }

  if (endTime && now > new Date(endTime)) {
    return "Closed" as const;
  }

  return "Active" as const;
}

async function recordScanAudit(
  actorId: string,
  eventId: string | null,
  action: string,
  entityId: string | null,
  metadata: Record<string, string | number | boolean | null>,
) {
  await insertAuditLog({
    actor_id: actorId,
    event_id: eventId,
    action,
    entity_type: "participant",
    entity_id: entityId,
    metadata: toJson(metadata),
  });
}

export async function verifyQrAndClaimService(rawInput: unknown, context: UserContext) {
  const input = verifyQrAndClaimServiceSchema.parse(rawInput);
  const admin = createSupabaseAdminClient();

  let payload;

  try {
    payload = verifySignedQrPayload(input.qrPayload);
  } catch {
    return {
      state: "INVALID_QR" as const,
      message: "The scanned QR code is invalid or tampered with.",
    };
  }

  const { data: participant, error: participantError } = await admin
    .from("participants")
    .select(
      `
      *,
      team:teams(team_name)
    `,
    )
    .eq("id", payload.participantId)
    .eq("event_id", payload.eventId)
    .single();

  if (participantError || !participant) {
    await recordScanAudit(context.userId, payload.eventId, "qr.scan_invalid", payload.participantId, {
      reason: "participant_not_found",
      serviceTypeId: input.serviceTypeId,
    });

    return {
      state: "INVALID_QR" as const,
      message: "Participant record not found for this QR pass.",
    };
  }

  const { data: serviceType, error: serviceTypeError } = await admin
    .from("service_types")
    .select("*")
    .eq("id", input.serviceTypeId)
    .eq("event_id", payload.eventId)
    .single();

  if (serviceTypeError || !serviceType) {
    throw new AppError(404, "Requested service type does not exist for this event.");
  }

  try {
    await assertVolunteerAssignment({
      context,
      eventId: payload.eventId,
      serviceTypeId: input.serviceTypeId,
    });
  } catch {
    await recordScanAudit(context.userId, payload.eventId, "qr.scan_unauthorized_volunteer", participant.id, {
      serviceTypeId: input.serviceTypeId,
    });

    return {
      state: "UNAUTHORIZED_VOLUNTEER" as const,
      message: "You are not assigned to verify this service.",
    };
  }

  if (participant.registration_status !== "approved") {
    await recordScanAudit(context.userId, payload.eventId, "qr.scan_not_approved", participant.id, {
      registrationStatus: participant.registration_status,
      serviceTypeId: input.serviceTypeId,
    });

    return {
      state: "NOT_APPROVED" as const,
      message: "This participant is not approved yet.",
    };
  }

  if (!participant.qr_token_hash) {
    await recordScanAudit(context.userId, payload.eventId, "qr.scan_invalid", participant.id, {
      reason: "missing_token_hash",
      serviceTypeId: input.serviceTypeId,
    });

    return {
      state: "INVALID_QR" as const,
      message: "The participant pass is incomplete.",
    };
  }

  const incomingTokenHash = hashQrToken(payload.token);
  if (!secureCompare(incomingTokenHash, participant.qr_token_hash)) {
    await recordScanAudit(context.userId, payload.eventId, "qr.scan_invalid", participant.id, {
      reason: "token_mismatch",
      serviceTypeId: input.serviceTypeId,
    });

    return {
      state: "INVALID_QR" as const,
      message: "The QR token does not match our records.",
    };
  }

  if (!serviceType.is_active || !isServiceWindowOpen(serviceType.start_time, serviceType.end_time)) {
    await recordScanAudit(context.userId, payload.eventId, "qr.scan_service_closed", participant.id, {
      serviceTypeId: input.serviceTypeId,
    });

    return {
      state: "SERVICE_CLOSED" as const,
      message: "This service is not active right now.",
    };
  }

  const { error: insertClaimError } = await admin.from("service_claims").insert({
    event_id: payload.eventId,
    participant_id: participant.id,
    service_type_id: serviceType.id,
    scanned_by: context.userId,
    status: "verified",
    device_id: input.deviceId ?? null,
    notes: input.notes ?? null,
  });

  if (insertClaimError && insertClaimError.code === "23505") {
    await recordScanAudit(context.userId, payload.eventId, "qr.scan_duplicate", participant.id, {
      serviceTypeId: input.serviceTypeId,
    });

    return {
      state: "ALREADY_CLAIMED" as const,
      message: "This service has already been claimed for the participant.",
      participant: {
        id: participant.id,
        fullName: participant.full_name,
        teamName: participant.team?.team_name ?? null,
      },
      service: {
        id: serviceType.id,
        name: serviceType.name,
        type: serviceType.type,
      },
    };
  }

  if (insertClaimError) {
    throw new AppError(500, "Unable to record the service claim.");
  }

  await recordScanAudit(context.userId, payload.eventId, "qr.scan_verified", participant.id, {
    serviceTypeId: input.serviceTypeId,
    deviceId: input.deviceId ?? null,
  });

  return {
    state: "VERIFIED" as const,
    message: "QR verified and service claim recorded.",
    participant: {
      id: participant.id,
      fullName: participant.full_name,
      teamName: participant.team?.team_name ?? null,
    },
    service: {
      id: serviceType.id,
      name: serviceType.name,
      type: serviceType.type,
    },
  };
}

export async function getVolunteerDuties(context: UserContext) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("volunteers")
    .select(
      `
      *,
      event:events(id, title, slug, venue, start_date, end_date, registration_open, status),
      service_type:service_types(id, name, type, is_active, start_time, end_time)
    `,
    )
    .eq("user_id", context.userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(500, "Unable to fetch volunteer duties.");
  }

  return data ?? [];
}

export async function getVolunteerRecentScans(context: UserContext, eventId?: string) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("service_claims")
    .select(
      `
      id,
      status,
      scanned_at,
      device_id,
      participant:participants(full_name, email),
      service_type:service_types(name, type)
    `,
    )
    .eq("scanned_by", context.userId)
    .order("scanned_at", { ascending: false })
    .limit(20);

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(500, "Unable to fetch recent volunteer scans.");
  }

  return data ?? [];
}

export async function getVolunteerDashboard(context: UserContext) {
  const [duties, recentScans] = await Promise.all([
    getVolunteerDuties(context),
    getVolunteerRecentScans(context),
  ]);

  const assignmentRow = duties[0] ?? null;
  if (!assignmentRow) {
    return {
      profile: context.profile,
      event: null,
      assignment: null,
      quickStats: {
        totalScans: 0,
        verifiedScans: 0,
        invalidScanAttempts: 0,
        activeServices: 0,
        assignedServiceServedCount: 0,
        assignedServicePendingCount: 0,
      },
      services: [],
      recentScans,
    };
  }

  const admin = createSupabaseAdminClient();
  const eventId = assignmentRow.event_id;

  const [
    approvedParticipants,
    servicesResult,
    claimsResult,
    volunteerVerifiedScans,
    invalidScanAttempts,
    eventRecentScans,
  ] = await Promise.all([
    admin
      .from("participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("registration_status", "approved"),
    admin.from("service_types").select("*").eq("event_id", eventId).order("created_at", { ascending: true }),
    admin.from("service_claims").select("service_type_id, status").eq("event_id", eventId),
    admin
      .from("service_claims")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("scanned_by", context.userId),
    admin
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("actor_id", context.userId)
      .in("action", [...INVALID_SCAN_ACTIONS]),
    getVolunteerRecentScans(context, eventId),
  ]);

  if (
    approvedParticipants.error ||
    servicesResult.error ||
    claimsResult.error ||
    volunteerVerifiedScans.error ||
    invalidScanAttempts.error
  ) {
    throw new AppError(500, "Unable to fetch volunteer dashboard.");
  }

  const approvedCount = approvedParticipants.count ?? 0;
  const claimCounts = (claimsResult.data ?? []).reduce<Record<string, number>>((accumulator, claim) => {
    accumulator[claim.service_type_id] = (accumulator[claim.service_type_id] ?? 0) + 1;
    return accumulator;
  }, {});

  const services = (servicesResult.data ?? []).map((service) => {
    const servedCount = claimCounts[service.id] ?? 0;

    return {
      id: service.id,
      name: service.name,
      type: service.type,
      is_active: service.is_active,
      start_time: service.start_time,
      end_time: service.end_time,
      servedCount,
      pendingCount: Math.max(approvedCount - servedCount, 0),
      status: getServiceStatus(service.start_time, service.end_time, service.is_active),
    };
  });

  const assignedService = assignmentRow.assigned_service_id
    ? services.find((service) => service.id === assignmentRow.assigned_service_id) ?? null
    : null;
  const verifiedScans = volunteerVerifiedScans.count ?? 0;
  const invalidAttempts = invalidScanAttempts.count ?? 0;

  return {
    profile: context.profile,
    event: assignmentRow.event,
    assignment: {
      id: assignmentRow.id,
      event_id: assignmentRow.event_id,
      assigned_service_id: assignmentRow.assigned_service_id,
      duty_name: assignmentRow.duty_name,
      shift_start: assignmentRow.shift_start,
      shift_end: assignmentRow.shift_end,
      is_active: assignmentRow.is_active,
      service: assignmentRow.service_type
        ? {
            ...assignmentRow.service_type,
            status: getServiceStatus(
              assignmentRow.service_type.start_time,
              assignmentRow.service_type.end_time,
              assignmentRow.service_type.is_active,
            ),
          }
        : null,
    },
    quickStats: {
      totalScans: verifiedScans + invalidAttempts,
      verifiedScans,
      invalidScanAttempts: invalidAttempts,
      activeServices: services.filter((service) => service.status === "Active").length,
      assignedServiceServedCount: assignedService?.servedCount ?? 0,
      assignedServicePendingCount: assignedService?.pendingCount ?? 0,
    },
    services,
    recentScans: eventRecentScans,
  };
}

export async function syncOfflineClaims(rawInput: unknown, context: UserContext) {
  const input = syncOfflineClaimsSchema.parse(rawInput);

  const results = [];

  for (const claim of input.claims) {
    const outcome = await verifyQrAndClaimService(claim, context);
    results.push({
      localId: claim.localId ?? null,
      serviceTypeId: claim.serviceTypeId,
      ...outcome,
    });
  }

  return {
    synced: results.filter((result) => result.state === "VERIFIED").length,
    results,
  };
}
