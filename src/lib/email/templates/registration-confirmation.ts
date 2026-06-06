import { renderEmailLayout, text } from "@/lib/email/templates/email-layout";

type RegistrationConfirmationEmailProps = {
  participantName: string;
  teamName: string;
  track: string;
  eventTitle: string;
  eventDateLabel: string;
  venue: string;
};

export function renderRegistrationConfirmationEmail({
  participantName,
  teamName,
  track,
  eventTitle,
  eventDateLabel,
  venue,
}: RegistrationConfirmationEmailProps) {
  return renderEmailLayout({
    preview: `Registration received for ${eventTitle}`,
    title: "Registration Received",
    content: `
      <p style="margin:0 0 18px;color:rgba(232,234,240,0.86);font-size:16px;line-height:1.7;">Hi ${text(participantName)},</p>
      <p style="margin:0 0 22px;color:rgba(232,234,240,0.7);font-size:15px;line-height:1.8;">
        Your registration for <strong style="color:#ffffff;">${text(eventTitle)}</strong> has been received successfully. Your application is now under admin review.
      </p>
      <div style="border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:20px 22px;margin-bottom:24px;">
        <p style="margin:0 0 10px;color:#ffffff;font-weight:700;">Registration Summary</p>
        <p style="margin:0 0 8px;color:rgba(232,234,240,0.7);">Team: <strong style="color:#ffffff;">${text(teamName)}</strong></p>
        <p style="margin:0 0 8px;color:rgba(232,234,240,0.7);">Track: <strong style="color:#ffffff;">${text(track)}</strong></p>
        <p style="margin:0 0 8px;color:rgba(232,234,240,0.7);">Date: <strong style="color:#ffffff;">${text(eventDateLabel)}</strong></p>
        <p style="margin:0;color:rgba(232,234,240,0.7);">Venue: <strong style="color:#ffffff;">${text(venue)}</strong></p>
      </div>
      <p style="margin:0 0 14px;color:rgba(232,234,240,0.7);font-size:15px;line-height:1.8;">
        Once approved, you will receive your secure QR-based participant pass and meal coupon instructions by email.
      </p>
      <p style="margin:0;color:#a5b4fc;font-size:14px;font-weight:600;">
        Next step: wait for the approval email from the Dnyanothon 2026 team.
      </p>
    `,
  });
}
