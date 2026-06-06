import { renderEmailLayout, text } from "@/lib/email/templates/email-layout";

type RejectionEmailProps = {
  participantName: string;
  eventTitle: string;
  reason: string;
};

export function renderRejectionEmail({
  participantName,
  eventTitle,
  reason,
}: RejectionEmailProps) {
  return renderEmailLayout({
    preview: `Update on your ${eventTitle} registration`,
    title: "Registration Update",
    content: `
      <p style="margin:0 0 18px;color:rgba(232,234,240,0.86);font-size:16px;line-height:1.7;">Hi ${text(participantName)},</p>
      <p style="margin:0 0 20px;color:rgba(232,234,240,0.72);font-size:15px;line-height:1.8;">
        Thank you for your interest in <strong style="color:#ffffff;">${text(eventTitle)}</strong>. After reviewing the current applications, we are unable to move your registration forward this time.
      </p>
      <div style="border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:20px 22px;margin-bottom:22px;">
        <p style="margin:0 0 8px;color:#ffffff;font-weight:700;">Reviewer Note</p>
        <p style="margin:0;color:rgba(232,234,240,0.7);line-height:1.8;">${text(reason)}</p>
      </div>
      <p style="margin:0;color:rgba(232,234,240,0.7);font-size:15px;line-height:1.8;">
        We appreciate the effort you put into your application and hope to see you in future editions of Dnyanothon.
      </p>
    `,
  });
}
