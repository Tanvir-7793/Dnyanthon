import { resendParticipantQrEmail } from "@/lib/backend/admin";
import { getRequestIp, jsonError, jsonOk } from "@/lib/http";
import { requireAdminUser } from "@/lib/security/permissions";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser(request);
    await enforceRateLimit({
      bucket: "admin-resend-qr",
      key: `${user.userId}:${getRequestIp(request)}`,
      limit: 30,
      windowMs: 10 * 60 * 1000,
    });

    const body = await request.json();
    const result = await resendParticipantQrEmail(body, user);

    return jsonOk(result);
  } catch (error) {
    return jsonError(error, "Unable to resend the QR email.");
  }
}
