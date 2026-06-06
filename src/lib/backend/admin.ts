import { sendApprovalPassEmail, sendRejectionEmail } from "@/lib/email/resend";
import { escapeCsvValue, AppError } from "@/lib/http";
import { SERVICE_LABELS } from "@/lib/constants";
import {
  createSignedQrPayload,
  generateQrCodeDataUrl,
} from "@/lib/security/qr-token";
import type { UserContext } from "@/lib/security/permissions";
import { assertCanManageEvent } from "@/lib/security/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  approveParticipantSchema,
  approveTeamSchema,
  eventIdQuerySchema,
  rejectParticipantSchema,
  resendParticipantQrSchema,
} from "@/lib/validations/registration";

import {
  formatErrorMessage,
  formatEventDateLabel,
  insertAuditLog,
  insertEmailLog,
  resolveEventOrThrow,
  toJson,
} from "./shared";

type ParticipantWithContext = Awaited<ReturnType<typeof getParticipantWithContext>>;

async function getParticipantWithContext(participantId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("participants")
    .select(
      `
      *,
      team:teams(*),
      event:events(*)
    `,
    )
    .eq("id", participantId)
    .single();

  if (error || !data) {
    throw new AppError(404, "Participant not found.");
  }

  return data;
}

async function listTeamParticipantsWithContext(participant: ParticipantWithContext) {
  if (!participant.team_id) {
    return [participant];
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("participants")
    .select(
      `
      *,
      team:teams(*),
      event:events(*)
    `,
    )
    .eq("team_id", participant.team_id)
    .eq("event_id", participant.event_id)
    .order("created_at", { ascending: true });

  if (error || !data) {
    throw new AppError(500, "Unable to load the team participants.");
  }

  return data;
}

function getUniqueEmailRecipients(emails: string[]) {
  const uniqueRecipients: string[] = [];
  const seen = new Set<string>();

  for (const email of emails) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || seen.has(normalizedEmail)) {
      continue;
    }

    seen.add(normalizedEmail);
    uniqueRecipients.push(email.trim());
  }

  return uniqueRecipients;
}

function extractBase64FromDataUrl(dataUrl: string) {
  const separator = "base64,";
  const separatorIndex = dataUrl.indexOf(separator);

  if (separatorIndex === -1) {
    throw new AppError(500, "Unable to prepare the QR pass image.");
  }

  return dataUrl.slice(separatorIndex + separator.length);
}

async function deliverParticipantQrPass(options: {
  participant: ParticipantWithContext;
  actorId: string;
  auditAction: "participant.approved" | "participant.qr_resent";
}) {
  const admin = createSupabaseAdminClient();
  const { participant, actorId, auditAction } = options;
  const generatedAt = new Date().toISOString();
  const teamParticipants = await listTeamParticipantsWithContext(participant);
  const qrEmailParticipants = teamParticipants.filter(
    (teamParticipant) => teamParticipant.id === participant.id || teamParticipant.registration_status === "approved",
  );

  const qrMembers = await Promise.all(
    qrEmailParticipants.map(async (teamParticipant) => {
      const { tokenHash, encodedPayload } = createSignedQrPayload({
        eventId: teamParticipant.event_id,
        participantId: teamParticipant.id,
      });
      const qrCodeDataUrl = await generateQrCodeDataUrl(encodedPayload);

      return {
        participant: teamParticipant,
        previousQrState: {
          qr_token_hash: teamParticipant.qr_token_hash,
          qr_generated_at: teamParticipant.qr_generated_at,
        },
        nextQrState:
          auditAction === "participant.approved" && teamParticipant.id === participant.id
            ? {
                registration_status: "approved" as const,
                qr_token_hash: tokenHash,
                qr_generated_at: generatedAt,
              }
            : {
                qr_token_hash: tokenHash,
                qr_generated_at: generatedAt,
              },
        emailMember: {
          participantName: teamParticipant.full_name,
          teamName: teamParticipant.team?.team_name ?? "Solo Participant",
          qrInlineContentId: `participant-qr-${teamParticipant.id}`,
          qrPayload: encodedPayload,
          qrPngBase64: extractBase64FromDataUrl(qrCodeDataUrl),
          validForLabels: Object.values(SERVICE_LABELS),
        },
      };
    }),
  );

  const updatedMembers: Array<(typeof qrMembers)[number]> = [];

  try {
    for (const member of qrMembers) {
      const { error: updateError } = await admin.from("participants").update(member.nextQrState).eq("id", member.participant.id);

      if (updateError) {
        throw new AppError(
          500,
          auditAction === "participant.approved"
            ? "Unable to approve participant."
            : "Unable to refresh the participant QR pass.",
        );
      }

      updatedMembers.push(member);
    }
  } catch (error) {
    for (const updatedMember of updatedMembers) {
      const { error: rollbackError } = await admin
        .from("participants")
        .update(updatedMember.previousQrState)
        .eq("id", updatedMember.participant.id);

      if (rollbackError) {
        console.error("Failed to restore previous QR pass after update error", rollbackError);
      }
    }

    throw error;
  }

  let emailStatus: "sent" | "failed" = "sent";
  let providerMessageId: string | null = null;
  let emailErrorMessage: string | null = null;
  const recipientEmails = getUniqueEmailRecipients(qrMembers.map((member) => member.participant.email));
  const [primaryRecipientEmail, ...bccRecipients] = recipientEmails;

  try {
    const emailResponse = await sendApprovalPassEmail({
      recipientEmail: primaryRecipientEmail,
      bcc: bccRecipients.length > 0 ? bccRecipients : undefined,
      greetingName: qrMembers.length > 1 ? participant.team?.team_name ?? "Team" : participant.full_name,
      teamName: participant.team?.team_name ?? "Solo Participant",
      eventTitle: participant.event?.title ?? "Dnyanothon 2026",
      eventDateLabel: formatEventDateLabel(participant.event ?? participant),
      venue: participant.event?.venue ?? "Venue to be announced",
      members: qrMembers.map((member) => member.emailMember),
    });

    providerMessageId = emailResponse.data.id;
  } catch (error) {
    console.error(error);
    emailStatus = "failed";
    emailErrorMessage = formatErrorMessage(
      error,
      auditAction === "participant.approved"
        ? "Approval email could not be sent."
        : "QR email could not be resent.",
    );

    for (const member of qrMembers) {
      const { error: rollbackError } = await admin
        .from("participants")
        .update(member.previousQrState)
        .eq("id", member.participant.id);

      if (rollbackError) {
        console.error("Failed to restore previous QR pass after email error", rollbackError);
      }
    }
  }

  const emailLogSentAt = emailStatus === "sent" ? new Date().toISOString() : null;
  await Promise.all(
    qrMembers.map((member) =>
      insertEmailLog({
        event_id: member.participant.event_id,
        participant_id: member.participant.id,
        recipient_email: member.participant.email,
        email_type: "qr_pass",
        provider_message_id: providerMessageId,
        status: emailStatus,
        error_message: emailErrorMessage,
        sent_at: emailLogSentAt,
      }),
    ),
  );

  await insertAuditLog({
    actor_id: actorId,
    event_id: participant.event_id,
    action: auditAction,
    entity_type: "participant",
    entity_id: participant.id,
    metadata: toJson({
      emailStatus,
      registrationStatusBefore: participant.registration_status,
      qrMemberCount: qrMembers.length,
      qrParticipantIds: qrMembers.map((member) => member.participant.id),
      qrRecipientEmails: recipientEmails,
    }),
  });

  return {
    emailStatus,
    message:
      auditAction === "participant.approved"
        ? emailStatus === "sent"
          ? qrMembers.length > 1
            ? `Participant approved and team QR passes emailed for ${qrMembers.length} approved members.`
            : "Participant approved and QR pass emailed successfully."
          : "Participant approved, but the QR email could not be sent."
        : emailStatus === "sent"
          ? qrMembers.length > 1
            ? `Team QR passes resent for ${qrMembers.length} approved members.`
            : "Participant QR pass resent successfully."
          : "Participant QR pass refreshed, but the email could not be sent.",
  };
}

export async function approveParticipant(rawInput: unknown, context: UserContext) {
  const input = approveParticipantSchema.parse(rawInput);
  const participant = await getParticipantWithContext(input.participantId);

  await assertCanManageEvent(participant.event_id, context);
  const result = await deliverParticipantQrPass({
    participant,
    actorId: context.userId,
    auditAction: "participant.approved",
  });

  return {
    success: true,
    message: result.message,
    participantId: participant.id,
  };
}

async function getTeamWithContext(teamId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("teams")
    .select(
      `
      *,
      leader:profiles!teams_leader_id_fkey(full_name, email),
      event:events(*)
    `
    )
    .eq("id", teamId)
    .single();

  if (error || !data) {
    throw new AppError(404, "Team not found.");
  }

  return data;
}

async function listTeamParticipants(teamId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("participants")
    .select(
      `
      *,
      team:teams(*),
      event:events(*)
    `
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    throw new AppError(500, "Unable to load team participants.");
  }

  return data;
}

async function deliverTeamQrPasses(options: {
  team: Awaited<ReturnType<typeof getTeamWithContext>>;
  participants: ParticipantWithContext[];
  actorId: string;
}) {
  const admin = createSupabaseAdminClient();
  const { team, participants, actorId } = options;
  const generatedAt = new Date().toISOString();

  const qrMembers = await Promise.all(
    participants.map(async (teamParticipant) => {
      const { tokenHash, encodedPayload } = createSignedQrPayload({
        eventId: teamParticipant.event_id,
        participantId: teamParticipant.id,
      });
      const qrCodeDataUrl = await generateQrCodeDataUrl(encodedPayload);

      return {
        participant: teamParticipant,
        previousQrState: {
          registration_status: teamParticipant.registration_status,
          qr_token_hash: teamParticipant.qr_token_hash,
          qr_generated_at: teamParticipant.qr_generated_at,
        },
        nextQrState: {
          registration_status: "approved" as const,
          qr_token_hash: tokenHash,
          qr_generated_at: generatedAt,
        },
        emailMember: {
          participantName: teamParticipant.full_name,
          teamName: team.team_name,
          qrInlineContentId: `participant-qr-${teamParticipant.id}`,
          qrPayload: encodedPayload,
          qrPngBase64: extractBase64FromDataUrl(qrCodeDataUrl),
          validForLabels: Object.values(SERVICE_LABELS),
        },
      };
    })
  );

  const updatedMembers: Array<(typeof qrMembers)[number]> = [];

  try {
    for (const member of qrMembers) {
      const { error: updateError } = await admin
        .from("participants")
        .update(member.nextQrState)
        .eq("id", member.participant.id);

      if (updateError) {
        throw new AppError(500, "Unable to approve team participants.");
      }

      updatedMembers.push(member);
    }
  } catch (error) {
    for (const updatedMember of updatedMembers) {
      const { error: rollbackError } = await admin
        .from("participants")
        .update(updatedMember.previousQrState)
        .eq("id", updatedMember.participant.id);

      if (rollbackError) {
        console.error("Failed to restore previous QR state after update error", rollbackError);
      }
    }
    throw error;
  }

  const leaderEmail = team.leader?.email || participants[0]?.email;
  const leaderName = team.leader?.full_name || participants[0]?.full_name || "Team Leader";

  const otherEmails = participants
    .map((p) => p.email)
    .filter((email) => email && email.trim().toLowerCase() !== leaderEmail?.trim().toLowerCase());

  const recipientEmails = getUniqueEmailRecipients([leaderEmail, ...otherEmails]);
  const [primaryRecipientEmail, ...bccRecipients] = recipientEmails;

  let emailStatus: "sent" | "failed" = "sent";
  let providerMessageId: string | null = null;
  let emailErrorMessage: string | null = null;

  try {
    const emailResponse = await sendApprovalPassEmail({
      recipientEmail: primaryRecipientEmail,
      bcc: bccRecipients.length > 0 ? bccRecipients : undefined,
      greetingName: leaderName,
      teamName: team.team_name,
      eventTitle: team.event?.title ?? "Dnyanothon 2026",
      eventDateLabel: formatEventDateLabel(team.event ?? team),
      venue: team.event?.venue ?? "Venue to be announced",
      members: qrMembers.map((member) => member.emailMember),
    });

    providerMessageId = emailResponse.data.id;
  } catch (error) {
    console.error(error);
    emailStatus = "failed";
    emailErrorMessage = formatErrorMessage(error, "Team approval email could not be sent.");

    for (const member of qrMembers) {
      const { error: rollbackError } = await admin
        .from("participants")
        .update(member.previousQrState)
        .eq("id", member.participant.id);

      if (rollbackError) {
        console.error("Failed to restore previous QR state after email error", rollbackError);
      }
    }
  }

  const emailLogSentAt = emailStatus === "sent" ? new Date().toISOString() : null;
  await Promise.all(
    qrMembers.map((member) =>
      insertEmailLog({
        event_id: team.event_id,
        participant_id: member.participant.id,
        recipient_email: member.participant.email,
        email_type: "qr_pass",
        provider_message_id: providerMessageId,
        status: emailStatus,
        error_message: emailErrorMessage,
        sent_at: emailLogSentAt,
      })
    )
  );

  await insertAuditLog({
    actor_id: actorId,
    event_id: team.event_id,
    action: "team.approved",
    entity_type: "team",
    entity_id: team.id,
    metadata: toJson({
      emailStatus,
      qrMemberCount: qrMembers.length,
      recipientEmails,
    }),
  });

  return {
    emailStatus,
    message:
      emailStatus === "sent"
        ? `Team "${team.team_name}" approved and QR passes emailed to leader (${leaderEmail}).`
        : `Team approved, but the email could not be sent.`,
  };
}

export async function approveTeam(rawInput: unknown, context: UserContext) {
  const input = approveTeamSchema.parse(rawInput);
  const team = await getTeamWithContext(input.teamId);

  await assertCanManageEvent(team.event_id, context);
  const participants = await listTeamParticipants(input.teamId);

  if (participants.length === 0) {
    throw new AppError(400, "Cannot approve a team with no members.");
  }

  const result = await deliverTeamQrPasses({
    team,
    participants,
    actorId: context.userId,
  });

  return {
    success: true,
    message: result.message,
    teamId: team.id,
  };
}

export async function resendParticipantQrEmail(rawInput: unknown, context: UserContext) {
  const input = resendParticipantQrSchema.parse(rawInput);
  const participant = await getParticipantWithContext(input.participantId);

  await assertCanManageEvent(participant.event_id, context);

  if (participant.registration_status !== "approved") {
    throw new AppError(400, "Only approved participants can receive QR passes.");
  }

  const result = await deliverParticipantQrPass({
    participant,
    actorId: context.userId,
    auditAction: "participant.qr_resent",
  });

  return {
    success: true,
    message: result.message,
    participantId: participant.id,
  };
}

export async function rejectParticipant(rawInput: unknown, context: UserContext) {
  const input = rejectParticipantSchema.parse(rawInput);
  const admin = createSupabaseAdminClient();
  const participant = await getParticipantWithContext(input.participantId);

  await assertCanManageEvent(participant.event_id, context);

  const { error: updateError } = await admin
    .from("participants")
    .update({
      registration_status: "rejected",
      qr_token_hash: null,
      qr_generated_at: null,
    })
    .eq("id", participant.id);

  if (updateError) {
    throw new AppError(500, "Unable to reject participant.");
  }

  let emailStatus: "sent" | "failed" = "sent";
  let providerMessageId: string | null = null;
  let emailErrorMessage: string | null = null;

  try {
    const emailResponse = await sendRejectionEmail({
      recipientEmail: participant.email,
      participantName: participant.full_name,
      eventTitle: participant.event?.title ?? "Dnyanothon 2026",
      reason: input.reason,
    });

    providerMessageId = emailResponse.data.id;
  } catch (error) {
    console.error(error);
    emailStatus = "failed";
    emailErrorMessage = formatErrorMessage(error, "Rejection email could not be sent.");
  }

  await insertEmailLog({
    event_id: participant.event_id,
    participant_id: participant.id,
    recipient_email: participant.email,
    email_type: "rejection",
    provider_message_id: providerMessageId,
    status: emailStatus,
    error_message: emailErrorMessage,
    sent_at: emailStatus === "sent" ? new Date().toISOString() : null,
  });

  await insertAuditLog({
    actor_id: context.userId,
    event_id: participant.event_id,
    action: "participant.rejected",
    entity_type: "participant",
    entity_id: participant.id,
    metadata: toJson({
      reason: input.reason,
      emailStatus,
    }),
  });

  return {
    success: true,
    message:
      emailStatus === "sent"
        ? "Participant rejected and notified by email."
        : "Participant rejected, but the rejection email could not be sent.",
    participantId: participant.id,
  };
}

export async function getAdminDashboardStats(rawInput: unknown, context: UserContext) {
  const input = eventIdQuerySchema.parse(rawInput);
  await assertCanManageEvent(input.eventId, context);

  const admin = createSupabaseAdminClient();

  const [
    totalRegistrations,
    approvedParticipants,
    pendingParticipants,
    teamsRegistered,
    serviceClaims,
    invalidScanAttempts,
    recentScans,
  ] = await Promise.all([
    admin.from("participants").select("*", { count: "exact", head: true }).eq("event_id", input.eventId),
    admin
      .from("participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", input.eventId)
      .eq("registration_status", "approved"),
    admin
      .from("participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", input.eventId)
      .eq("registration_status", "pending"),
    admin.from("teams").select("*", { count: "exact", head: true }).eq("event_id", input.eventId),
    admin
      .from("service_claims")
      .select("id, status, scanned_at, service_type:service_types(name, type)")
      .eq("event_id", input.eventId),
    admin
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("event_id", input.eventId)
      .in("action", [
        "qr.scan_invalid",
        "qr.scan_duplicate",
        "qr.scan_not_approved",
        "qr.scan_service_closed",
        "qr.scan_unauthorized_volunteer",
      ]),
    admin
      .from("service_claims")
      .select(
        `
        id,
        status,
        scanned_at,
        device_id,
        participant:participants(full_name, email),
        service_type:service_types(name, type),
        volunteer:profiles!service_claims_scanned_by_fkey(full_name)
      `,
      )
      .eq("event_id", input.eventId)
      .order("scanned_at", { ascending: false })
      .limit(12),
  ]);

  const claimRows = serviceClaims.data ?? [];
  const countByType = claimRows.reduce<Record<string, number>>((accumulator, claim) => {
    const type = claim.service_type?.type ?? "unknown";
    accumulator[type] = (accumulator[type] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    totalRegistrations: totalRegistrations.count ?? 0,
    approvedParticipants: approvedParticipants.count ?? 0,
    pendingParticipants: pendingParticipants.count ?? 0,
    teamsRegistered: teamsRegistered.count ?? 0,
    lunchServedCount: countByType.lunch ?? 0,
    dinnerServedCount: countByType.dinner ?? 0,
    snacksServedCount: countByType.snacks ?? 0,
    invalidScanAttempts: invalidScanAttempts.count ?? 0,
    recentScans: recentScans.data ?? [],
  };
}

export async function listParticipants(rawInput: unknown, context: UserContext) {
  const input = eventIdQuerySchema.parse(rawInput);
  await assertCanManageEvent(input.eventId, context);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("participants")
    .select(
      `
      *,
      team:teams(team_name, problem_track)
    `,
    )
    .eq("event_id", input.eventId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(500, "Unable to fetch participants.");
  }

  const participants = data ?? [];

  if (participants.length === 0) {
    return participants;
  }

  const participantIds = participants.map((participant) => participant.id);
  const { data: emailLogs, error: emailLogError } = await admin
    .from("email_logs")
    .select("participant_id, email_type, status, sent_at, created_at, error_message")
    .in("participant_id", participantIds)
    .order("created_at", { ascending: false });

  if (emailLogError) {
    throw new AppError(500, "Unable to fetch participants.");
  }

  const latestQrEmailByParticipant = new Map<
    string,
    {
      status: string;
      sent_at: string | null;
      created_at: string;
      error_message: string | null;
    }
  >();

  for (const log of emailLogs ?? []) {
    if (log.email_type !== "qr_pass" || !log.participant_id || latestQrEmailByParticipant.has(log.participant_id)) {
      continue;
    }

    latestQrEmailByParticipant.set(log.participant_id, {
      status: log.status,
      sent_at: log.sent_at,
      created_at: log.created_at,
      error_message: log.error_message,
    });
  }

  return participants.map((participant) => ({
    ...participant,
    latest_qr_email: latestQrEmailByParticipant.get(participant.id) ?? null,
  }));
}

export async function listTeams(rawInput: unknown, context: UserContext) {
  const input = eventIdQuerySchema.parse(rawInput);
  await assertCanManageEvent(input.eventId, context);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("teams")
    .select(
      `
      *,
      leader:profiles!teams_leader_id_fkey(full_name, email),
      participants:participants(id, full_name, email, registration_status)
    `,
    )
    .eq("event_id", input.eventId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(500, "Unable to fetch teams.");
  }

  return data ?? [];
}

export async function listRecentScans(rawInput: unknown, context: UserContext) {
  const input = eventIdQuerySchema.parse(rawInput);
  await assertCanManageEvent(input.eventId, context);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("service_claims")
    .select(
      `
      id,
      status,
      scanned_at,
      device_id,
      notes,
      participant:participants(full_name, email),
      service_type:service_types(name, type),
      volunteer:profiles!service_claims_scanned_by_fkey(full_name, email)
    `,
    )
    .eq("event_id", input.eventId)
    .order("scanned_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new AppError(500, "Unable to fetch recent scans.");
  }

  return data ?? [];
}

export async function getMealServiceStatus(rawInput: unknown, context: UserContext) {
  const input = eventIdQuerySchema.parse(rawInput);
  await assertCanManageEvent(input.eventId, context);

  const admin = createSupabaseAdminClient();
  const [{ data: services, error: servicesError }, { data: claims, error: claimsError }] =
    await Promise.all([
      admin.from("service_types").select("*").eq("event_id", input.eventId).order("created_at", { ascending: true }),
      admin.from("service_claims").select("service_type_id, status").eq("event_id", input.eventId),
    ]);

  if (servicesError || claimsError) {
    throw new AppError(500, "Unable to fetch meal service status.");
  }

  const counts = (claims ?? []).reduce<Record<string, number>>((accumulator, claim) => {
    accumulator[claim.service_type_id] = (accumulator[claim.service_type_id] ?? 0) + 1;
    return accumulator;
  }, {});

  return (services ?? []).map((service) => ({
    ...service,
    servedCount: counts[service.id] ?? 0,
  }));
}

export async function getVolunteerActivity(rawInput: unknown, context: UserContext) {
  const input = eventIdQuerySchema.parse(rawInput);
  await assertCanManageEvent(input.eventId, context);

  const admin = createSupabaseAdminClient();
  const [{ data: volunteers, error: volunteersError }, { data: claims, error: claimsError }] =
    await Promise.all([
      admin
        .from("volunteers")
        .select(
          `
          *,
          profile:profiles!volunteers_user_id_fkey(full_name, email),
          service_type:service_types(name, type)
        `,
        )
        .eq("event_id", input.eventId)
        .order("created_at", { ascending: true }),
      admin.from("service_claims").select("scanned_by, scanned_at").eq("event_id", input.eventId),
    ]);

  if (volunteersError || claimsError) {
    throw new AppError(500, "Unable to fetch volunteer activity.");
  }

  const scanMap = (claims ?? []).reduce<Record<string, { count: number; lastScanAt: string | null }>>(
    (accumulator, claim) => {
      if (!claim.scanned_by) {
        return accumulator;
      }

      const current = accumulator[claim.scanned_by] ?? { count: 0, lastScanAt: null };
      current.count += 1;
      current.lastScanAt = !current.lastScanAt || current.lastScanAt < claim.scanned_at ? claim.scanned_at : current.lastScanAt;
      accumulator[claim.scanned_by] = current;
      return accumulator;
    },
    {},
  );

  return (volunteers ?? []).map((volunteer) => ({
    ...volunteer,
    scanCount: scanMap[volunteer.user_id]?.count ?? 0,
    lastScanAt: scanMap[volunteer.user_id]?.lastScanAt ?? null,
  }));
}

export async function exportParticipantsCsv(rawInput: unknown, context: UserContext) {
  const participants = await listParticipants(rawInput, context);
  const headers = [
    "full_name",
    "email",
    "phone",
    "college_name",
    "department",
    "year",
    "team_name",
    "registration_status",
    "created_at",
  ];

  const lines = participants.map((participant) =>
    [
      participant.full_name,
      participant.email,
      participant.phone,
      participant.college_name,
      participant.department,
      participant.year,
      participant.team?.team_name ?? "",
      participant.registration_status,
      participant.created_at,
    ]
      .map((value) => escapeCsvValue(value))
      .join(","),
  );

  return [headers.join(","), ...lines].join("\n");
}

export async function getEventForAdmin(eventId: string, context: UserContext) {
  eventIdQuerySchema.parse({ eventId });
  await assertCanManageEvent(eventId, context);
  return resolveEventOrThrow({ eventId });
}

export async function listManagedEvents(context: UserContext) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("events").select("*").order("start_date", { ascending: true });

  if (context.role !== "super_admin") {
    query = query.eq("created_by", context.userId);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(500, "Unable to fetch managed events.");
  }

  return data ?? [];
}
