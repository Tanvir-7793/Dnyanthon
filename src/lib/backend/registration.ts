import { sendRegistrationConfirmationEmail } from "@/lib/email/resend";
import { AppError } from "@/lib/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserContext } from "@/lib/security/permissions";
import type { Database } from "@/lib/types/supabase";
import type { RegisterForEventInput } from "@/lib/validations/registration";
import { registerForEventSchema } from "@/lib/validations/registration";

import {
  assertEventIsOpen,
  cleanNullable,
  formatErrorMessage,
  formatEventDateLabel,
  formatSupabaseErrorMessage,
  insertAuditLog,
  insertEmailLog,
  isUniqueViolation,
  resolveEventOrThrow,
  toJson,
} from "./shared";

function ensureUniqueEmails(input: RegisterForEventInput) {
  const emails = [input.email.toLowerCase(), ...input.teamMembers.map((member) => member.email.toLowerCase())];
  const uniqueEmails = new Set(emails);

  if (uniqueEmails.size !== emails.length) {
    throw new AppError(400, "Each participant email must be unique within the team.");
  }
}

async function findOrCreateTeam(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  input: RegisterForEventInput,
  eventId: string,
  userId: string,
) {
  const { data: existingTeam } = await admin
    .from("teams")
    .select("*")
    .eq("event_id", eventId)
    .eq("team_name", input.teamName)
    .maybeSingle();

  if (existingTeam) {
    if (existingTeam.member_count + 1 + input.teamMembers.length > 4) {
      throw new AppError(400, "This team is already full.");
    }

    return existingTeam;
  }

  const { data: team, error } = await admin
    .from("teams")
    .insert({
      event_id: eventId,
      team_name: input.teamName,
      leader_id: userId,
      college_name: input.collegeName,
      problem_track: input.problemTrack,
      project_idea: input.projectIdea?.trim() || null,
      member_count: 1 + input.teamMembers.length,
      metadata: toJson({
        createdFrom: "registration_form",
      }),
    } satisfies Database["public"]["Tables"]["teams"]["Insert"])
    .select("*")
    .single();

  if (error || !team) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, "A team with this name already exists for the event.");
    }

    console.error("Failed to create team", error);
    throw new AppError(500, formatSupabaseErrorMessage(error, "Unable to create the team."));
  }

  return team;
}

export async function registerForEvent(rawInput: unknown, context: UserContext) {
  const input = registerForEventSchema.parse(rawInput);
  ensureUniqueEmails(input);

  if (context.email.toLowerCase() !== input.email.toLowerCase()) {
    throw new AppError(400, "Please use the same email as your signed-in account for the team leader.");
  }

  const admin = createSupabaseAdminClient();
  const event = await resolveEventOrThrow({ eventId: input.eventId, eventSlug: input.eventSlug });
  assertEventIsOpen(event);

  const allEmails = [input.email, ...input.teamMembers.map((member) => member.email)];
  const { data: duplicateParticipants, error: duplicateError } = await admin
    .from("participants")
    .select("email")
    .eq("event_id", event.id)
    .in("email", allEmails);

  if (duplicateError) {
    console.error("Failed to check duplicate participants", duplicateError);
    throw new AppError(
      500,
      formatSupabaseErrorMessage(duplicateError, "Unable to validate duplicate registrations."),
    );
  }

  if (duplicateParticipants && duplicateParticipants.length > 0) {
    throw new AppError(409, "One or more participant emails are already registered for this event.");
  }

  const team = await findOrCreateTeam(admin, input, event.id, context.userId);

  const participantRows: Database["public"]["Tables"]["participants"]["Insert"][] = [
    {
      user_id: context.userId,
      event_id: event.id,
      team_id: team.id,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      college_name: input.collegeName,
      department: cleanNullable(input.department),
      year: input.year,
      github_url: cleanNullable(input.githubUrl),
      linkedin_url: cleanNullable(input.linkedinUrl),
      registration_status: "pending",
      metadata: toJson({
        tshirtSize: input.tshirtSize ?? null,
        dietary: input.dietary ?? null,
        source: input.source ?? null,
        updates: input.updates,
        isTeamLeader: true,
      }),
    },
    ...input.teamMembers.map(
      (member): Database["public"]["Tables"]["participants"]["Insert"] => ({
        user_id: null,
        event_id: event.id,
        team_id: team.id,
        full_name: member.name,
        email: member.email,
        phone: member.phone,
        college_name: member.college,
        department: null,
        year: input.year,
        github_url: null,
        linkedin_url: null,
        registration_status: "pending",
        metadata: toJson({
          registeredByUserId: context.userId,
          registeredByLeaderEmail: input.email,
          isTeamLeader: false,
        }),
      }),
    ),
  ];

  const { data: insertedParticipants, error: insertParticipantsError } = await admin
    .from("participants")
    .insert(participantRows)
    .select("id, full_name, email, user_id");

  if (insertParticipantsError || !insertedParticipants) {
    if (isUniqueViolation(insertParticipantsError)) {
      throw new AppError(409, "A participant with one of these emails is already registered.");
    }

    console.error("Failed to insert participants", insertParticipantsError);
    throw new AppError(
      500,
      formatSupabaseErrorMessage(insertParticipantsError, "Unable to complete event registration."),
    );
  }

  let emailStatus: "sent" | "failed" = "sent";
  let providerMessageId: string | null = null;
  let emailErrorMessage: string | null = null;

  try {
    const emailResponse = await sendRegistrationConfirmationEmail({
      recipientEmail: input.email,
      participantName: input.fullName,
      teamName: team.team_name,
      track: input.problemTrack,
      eventTitle: event.title,
      eventDateLabel: formatEventDateLabel(event),
      venue: event.venue ?? "Venue to be announced",
    });

    providerMessageId = emailResponse.data.id;
  } catch (error) {
    console.error(error);
    emailStatus = "failed";
    emailErrorMessage = formatErrorMessage(error, "Registration email could not be sent.");
  }

  const leaderParticipant = insertedParticipants.find((participant) => participant.user_id === context.userId);

  if (leaderParticipant) {
    await insertEmailLog({
      event_id: event.id,
      participant_id: leaderParticipant.id,
      recipient_email: input.email,
      email_type: "registration_confirmation",
      provider_message_id: providerMessageId,
      status: emailStatus,
      error_message: emailErrorMessage,
      sent_at: emailStatus === "sent" ? new Date().toISOString() : null,
    });
  }

  await insertAuditLog({
    actor_id: context.userId,
    event_id: event.id,
    action: "participant.registered",
    entity_type: "team",
    entity_id: team.id,
    metadata: toJson({
      participantCount: insertedParticipants.length,
      leaderEmail: input.email,
      emails: insertedParticipants.map((participant) => participant.email),
    }),
  });

  return {
    success: true,
    message:
      emailStatus === "sent"
        ? "Registration submitted successfully. Check your email for confirmation."
        : "Registration submitted successfully. We could not send the confirmation email yet.",
    eventId: event.id,
    teamId: team.id,
    participantIds: insertedParticipants.map((participant) => participant.id),
  };
}
