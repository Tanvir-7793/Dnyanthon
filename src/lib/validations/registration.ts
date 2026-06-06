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

export type RegisterForEventInput = z.infer<typeof registerForEventSchema>;
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
