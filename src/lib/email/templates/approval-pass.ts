import { renderEmailLayout, text } from "@/lib/email/templates/email-layout";

type ApprovalPassMember = {
  participantName: string;
  teamName: string;
  qrInlineContentId: string;
  qrPayload: string;
  validForLabels: string[];
};

type ApprovalPassEmailProps = {
  greetingName: string;
  teamName: string;
  eventTitle: string;
  eventDateLabel: string;
  venue: string;
  members: ApprovalPassMember[];
};

export function renderApprovalPassEmail({
  greetingName,
  teamName,
  eventTitle,
  eventDateLabel,
  venue,
  members,
}: ApprovalPassEmailProps) {
  const memberCards = members
    .map(
      (member) => `
        <div style="border-radius:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:24px;margin-bottom:18px;">
          <div style="text-align:center;margin-bottom:18px;">
            <img src="cid:${text(member.qrInlineContentId)}" alt="${text(member.participantName)} QR Pass" width="240" height="240" style="width:240px;max-width:100%;border-radius:16px;background:#ffffff;padding:16px;" />
            <p style="margin:18px 0 0;color:#ffffff;font-weight:700;font-size:18px;">${text(member.participantName)}</p>
            <p style="margin:8px 0 0;color:rgba(232,234,240,0.6);font-size:13px;">Team ${text(member.teamName)}</p>
          </div>
          <p style="margin:0 0 10px;color:#ffffff;font-weight:700;">Valid For</p>
          <p style="margin:0 0 14px;color:rgba(232,234,240,0.72);font-size:14px;line-height:1.8;">
            ${member.validForLabels.map((label) => text(label)).join(" | ")}
          </p>
          <p style="margin:0;color:rgba(232,234,240,0.68);font-size:13px;line-height:1.8;">
            Backup payload: <span style="word-break:break-all;color:#a5b4fc;">${text(member.qrPayload)}</span>
          </p>
        </div>
      `,
    )
    .join("");

  return renderEmailLayout({
    preview: members.length > 1 ? "Your team QR passes are ready" : "Your Dnyanothon 2026 QR pass is ready",
    title: "You're Approved",
    content: `
      <p style="margin:0 0 18px;color:rgba(232,234,240,0.86);font-size:16px;line-height:1.7;">Hi ${text(greetingName)},</p>
      <p style="margin:0 0 24px;color:rgba(232,234,240,0.72);font-size:15px;line-height:1.8;">
        Congratulations. Your registration for <strong style="color:#ffffff;">${text(eventTitle)}</strong> has been approved. Each approved member below has a unique QR pass that works for entry, meals, kit collection, and certificate access.
      </p>
      ${memberCards}
      <div style="border-radius:18px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.22);padding:18px 20px;margin-bottom:24px;">
        <p style="margin:0 0 10px;color:#ffffff;font-weight:700;">Event Details</p>
        <p style="margin:0 0 8px;color:rgba(232,234,240,0.7);">Date: <strong style="color:#ffffff;">${text(eventDateLabel)}</strong></p>
        <p style="margin:0 0 8px;color:rgba(232,234,240,0.7);">Venue: <strong style="color:#ffffff;">${text(venue)}</strong></p>
        <p style="margin:0;color:rgba(232,234,240,0.7);">
          Team: <strong style="color:#ffffff;">${text(teamName)}</strong><br />
          Bring the matching member QR at each checkpoint. Duplicate meal claims are automatically blocked after a successful scan.
        </p>
      </div>
      <p style="margin:0 0 10px;color:#ffffff;font-weight:700;">Usage Instructions</p>
      <p style="margin:0 0 14px;color:rgba(232,234,240,0.7);font-size:15px;line-height:1.8;">
        One member gets one QR. The same QR for that member covers entry, breakfast, lunch, snacks, dinner, kit collection, and certificate access. Present it only when a volunteer asks to scan it.
      </p>
      <p style="margin:0;color:#fcd34d;font-size:13px;line-height:1.7;">
        Keep this email private. Anyone with this QR can attempt to redeem your pass.
      </p>
    `,
  });
}
