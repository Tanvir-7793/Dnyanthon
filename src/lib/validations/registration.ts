import { z } from "zod";

export const teamMemberSchema = z.object({
  name: z.string().trim().min(2, "Team member name must be at least 2 characters.").max(120),
  email: z.string().trim().email("Please enter a valid team member email address."),
  college: z.string().trim().min(2, "Team member college must be at least 2 characters.").max(160),
  phone: z.string().trim().min(10, "Team member phone number must be at least 10 digits.").max(20),
});

export const registerForEventSchema = z
  .object({
    eventId: z.string().uuid().optional(),
    eventSlug: z.string().trim().min(1, "Event slug is required when event ID is missing.").optional(),
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters.").max(120),
    email: z.string().trim().email("Please enter a valid email address."),
    phone: z.string().trim().min(10, "Phone number must be at least 10 digits.").max(20),
    collegeName: z.string().trim().min(2, "College name must be at least 2 characters.").max(160),
    department: z.string().trim().max(120).optional(),
    year: z.string().trim().min(1, "Please select your year of study.").max(60),
    teamName: z.string().trim().min(2, "Please enter a team name.").max(120),
    githubUrl: z.union([z.string().trim().url("Please enter a valid GitHub URL."), z.literal("")]).optional(),
    linkedinUrl: z.union([z.string().trim().url("Please enter a valid LinkedIn URL."), z.literal("")]).optional(),
    problemTrack: z.string().trim().min(2, "Please choose a hackathon track.").max(120),
    projectIdea: z.string().trim().max(1500).optional(),
    tshirtSize: z
      .enum(["xs", "s", "m", "l", "xl", "xxl"], {
        message: "Please select a T-shirt size.",
      })
      .optional(),
    dietary: z.string().trim().max(80).optional(),
    source: z.string().trim().max(80).optional(),
    updates: z.boolean().optional().default(false),
    teamMembers: z.array(teamMemberSchema).max(3, "You can add up to 3 extra team members only.").optional().default([]),
  })
  .superRefine((value, ctx) => {
    if (!value.eventId && !value.eventSlug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either eventId or eventSlug is required.",
        path: ["eventId"],
      });
    }
  });

export const approveParticipantSchema = z.object({
  participantId: z.string().uuid(),
});

export const resendParticipantQrSchema = z.object({
  participantId: z.string().uuid(),
});

export const rejectParticipantSchema = z.object({
  participantId: z.string().uuid(),
  reason: z.string().trim().min(5).max(500),
});

export const approveTeamSchema = z.object({
  teamId: z.string().uuid(),
});

export const eventIdQuerySchema = z.object({
  eventId: z.string().uuid(),
});

export const bulkApproveSchema = z.object({
  eventId: z.string().uuid(),
  participantIds: z.array(z.string().uuid()).min(1).max(100),
});

export const bulkApproveTeamsSchema = z.object({
  eventId: z.string().uuid(),
  teamIds: z.array(z.string().uuid()).min(1).max(50),
});

export const updateEventSettingsSchema = z.object({
  eventId: z.string().uuid(),
  title: z.string().trim().min(2).max(160).optional(),
  venue: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  start_date: z.string().trim().optional().nullable(),
  end_date: z.string().trim().optional().nullable(),
  registration_open: z.boolean().optional(),
  status: z.enum(["draft", "published", "live", "completed"]).optional(),
});

export const serviceControlSchema = z.object({
  eventId: z.string().uuid(),
  serviceId: z.string().uuid(),
  is_active: z.boolean().optional(),
  name: z.string().trim().min(2).max(80).optional(),
  start_time: z.string().trim().optional().nullable(),
  end_time: z.string().trim().optional().nullable(),
});

export const createServiceSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  type: z.enum(["entry", "breakfast", "lunch", "snacks", "dinner", "kit", "certificate"]),
  is_active: z.boolean().optional().default(true),
  start_time: z.string().trim().optional().nullable(),
  end_time: z.string().trim().optional().nullable(),
});

export const volunteerManageSchema = z.object({
  eventId: z.string().uuid(),
  email: z.string().trim().email().optional(),
  userId: z.string().uuid().optional(),
  duty_name: z.string().trim().max(120).optional().nullable(),
  assigned_service_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional(),
}).refine((v) => v.email || v.userId, { message: "Either email or userId is required." });

export const auditLogQuerySchema = z.object({
  eventId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type RegisterForEventInput = z.infer<typeof registerForEventSchema>;
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
