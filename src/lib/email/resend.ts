import "server-only";

import { Resend } from "resend";
import type { Attachment } from "resend";

import { getResendEnv } from "@/lib/env";
import { renderApprovalPassEmail } from "@/lib/email/templates/approval-pass";
import { renderRegistrationConfirmationEmail } from "@/lib/email/templates/registration-confirmation";
import { renderRejectionEmail } from "@/lib/email/templates/rejection";
import { AppError } from "@/lib/http";

type SendEmailArgs = {
  to: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  attachments?: Attachment[];
};

type RegistrationEmailArgs = {
  recipientEmail: string;
  participantName: string;
  teamName: string;
  track: string;
  eventTitle: string;
  eventDateLabel: string;
  venue: string;
};

type ApprovalEmailArgs = {
  recipientEmail: string | string[];
  bcc?: string | string[];
  greetingName: string;
  teamName: string;
  eventTitle: string;
  eventDateLabel: string;
  venue: string;
  members: Array<{
    participantName: string;
    teamName: string;
    qrInlineContentId: string;
    qrPayload: string;
    qrPngBase64: string;
    validForLabels: string[];
  }>;
};

type RejectionEmailArgs = {
  recipientEmail: string;
  participantName: string;
  eventTitle: string;
  reason: string;
};

function getResendClient() {
  return new Resend(getResendEnv().RESEND_API_KEY);
}

async function sendEmail({ to, bcc, subject, html, attachments }: SendEmailArgs) {
  const resend = getResendClient();
  const env = getResendEnv();

  const response = await resend.emails.send({
    from: env.FROM_EMAIL,
    to,
    bcc,
    subject,
    html,
    attachments,
  });

  if (response.error) {
    throw new AppError(502, response.error.message || "Resend could not deliver the email.");
  }

  return response;
}

export async function sendRegistrationConfirmationEmail(args: RegistrationEmailArgs) {
  return sendEmail({
    to: args.recipientEmail,
    subject: "Registration Received - Dnyanothsav 2026",
    html: renderRegistrationConfirmationEmail({
      participantName: args.participantName,
      teamName: args.teamName,
      track: args.track,
      eventTitle: args.eventTitle,
      eventDateLabel: args.eventDateLabel,
      venue: args.venue,
    }),
  });
}

export async function sendCouponEmail(args: ApprovalEmailArgs) {
  return sendEmail({
    to: args.recipientEmail,
    bcc: args.bcc,
    subject: args.members.length > 1 ? "You're Approved - Dnyanothsav 2026 Team QR Passes" : "You're Approved - Dnyanothsav 2026 QR Pass",
    html: renderApprovalPassEmail({
      greetingName: args.greetingName,
      teamName: args.teamName,
      eventTitle: args.eventTitle,
      eventDateLabel: args.eventDateLabel,
      venue: args.venue,
      members: args.members.map((member) => ({
        participantName: member.participantName,
        teamName: member.teamName,
        qrInlineContentId: member.qrInlineContentId,
        qrPayload: member.qrPayload,
        validForLabels: member.validForLabels,
      })),
    }),
    attachments: args.members.map(
      (member): Attachment => ({
        filename: `${member.participantName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-qr.png`,
        content: member.qrPngBase64,
        contentType: "image/png",
        inlineContentId: member.qrInlineContentId,
      }),
    ),
  });
}

export async function sendApprovalPassEmail(args: ApprovalEmailArgs) {
  return sendCouponEmail(args);
}

export async function sendRejectionEmail(args: RejectionEmailArgs) {
  return sendEmail({
    to: args.recipientEmail,
    subject: "Registration Update - Dnyanothsav 2026",
    html: renderRejectionEmail({
      participantName: args.participantName,
      eventTitle: args.eventTitle,
      reason: args.reason,
    }),
  });
}
