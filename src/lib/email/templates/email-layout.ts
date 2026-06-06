function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function text(value: string) {
  return escapeHtml(value);
}

type EmailLayoutArgs = {
  preview: string;
  title: string;
  content: string;
};

export function renderEmailLayout({ preview, title, content }: EmailLayoutArgs) {
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#050a14;font-family:Inter,Arial,sans-serif;color:#e8eaf0;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#050a14;padding:32px 16px;">
      <tbody>
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:linear-gradient(180deg, rgba(10,15,30,1) 0%, rgba(10,15,30,0.96) 100%);border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">
              <tbody>
                <tr>
                  <td style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.08);">
                    <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.28);color:#a5b4fc;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                      Dnyanothon 2026
                    </div>
                    <h1 style="margin:20px 0 0;font-size:30px;line-height:1.2;font-weight:800;color:#ffffff;">
                      ${escapeHtml(title)}
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">${content}</td>
                </tr>
                <tr>
                  <td style="padding:24px 32px 32px;border-top:1px solid rgba(255,255,255,0.08);color:rgba(232,234,240,0.68);font-size:13px;line-height:1.7;">
                    DIET Satara, Maharashtra<br />
                    Contact: support@dnyanothon.in<br />
                    Please do not share QR passes publicly.
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;
}
