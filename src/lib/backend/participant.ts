import { AppError } from "@/lib/http";
import type { UserContext } from "@/lib/security/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { EmailLogStatus } from "@/lib/types/supabase";

type ParticipantEmailLog = {
  participant_id: string | null;
  email_type: string;
  status: EmailLogStatus;
  sent_at: string | null;
  created_at: string;
  error_message: string | null;
};

type ParticipantClaim = {
  participant_id: string;
  status: string;
  scanned_at: string;
  service_type?: {
    name?: string;
    type?: string;
  } | null;
};

function buildLatestEmailMap(logs: ParticipantEmailLog[]) {
  const latestByParticipant = new Map<
    string,
    {
      registration?: ParticipantEmailLog;
      qrPass?: ParticipantEmailLog;
      rejection?: ParticipantEmailLog;
    }
  >();

  for (const log of logs) {
    if (!log.participant_id) {
      continue;
    }

    const current = latestByParticipant.get(log.participant_id) ?? {};

    if (log.email_type === "registration_confirmation" && !current.registration) {
      current.registration = log;
    }

    if (log.email_type === "qr_pass" && !current.qrPass) {
      current.qrPass = log;
    }

    if (log.email_type === "rejection" && !current.rejection) {
      current.rejection = log;
    }

    latestByParticipant.set(log.participant_id, current);
  }

  return latestByParticipant;
}

export async function getParticipantStatus(context: UserContext) {
  const admin = createSupabaseAdminClient();
  const { data: participants, error: participantError } = await admin
    .from("participants")
    .select(
      `
      *,
      event:events(id, title, slug, venue, start_date, end_date, status, registration_open),
      team:teams(id, team_name, problem_track, project_idea, member_count)
    `,
    )
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false });

  if (participantError) {
    throw new AppError(500, "Unable to load your registration status.");
  }

  if (!participants || participants.length === 0) {
    return [];
  }

  const participantIds = participants.map((participant) => participant.id);
  const [{ data: emailLogs, error: emailError }, { data: serviceClaims, error: claimsError }] =
    await Promise.all([
      admin
        .from("email_logs")
        .select("participant_id, email_type, status, sent_at, created_at, error_message")
        .in("participant_id", participantIds)
        .order("created_at", { ascending: false }),
      admin
        .from("service_claims")
        .select(
          `
          participant_id,
          status,
          scanned_at,
          service_type:service_types(name, type)
        `,
        )
        .in("participant_id", participantIds)
        .order("scanned_at", { ascending: false }),
    ]);

  if (emailError || claimsError) {
    throw new AppError(500, "Unable to load your registration status.");
  }

  const latestEmailMap = buildLatestEmailMap((emailLogs ?? []) as ParticipantEmailLog[]);
  const claimsByParticipant = ((serviceClaims ?? []) as ParticipantClaim[]).reduce<Record<string, ParticipantClaim[]>>((accumulator, claim) => {
    const participantId = claim.participant_id;
    accumulator[participantId] = accumulator[participantId] ?? [];
    accumulator[participantId].push(claim);
    return accumulator;
  }, {});

  return participants.map((participant) => {
    const emailStatus = latestEmailMap.get(participant.id);
    const claims = claimsByParticipant[participant.id] ?? [];

    return {
      ...participant,
      latestRegistrationEmail: emailStatus?.registration ?? null,
      latestQrEmail: emailStatus?.qrPass ?? null,
      latestRejectionEmail: emailStatus?.rejection ?? null,
      claims,
    };
  });
}
