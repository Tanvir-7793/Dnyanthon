import { rejectParticipant } from "@/lib/backend/admin";
import { jsonError, jsonOk, getRequestIp } from "@/lib/http";
import { requireAdminUser } from "@/lib/security/permissions";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser(request);
    await enforceRateLimit({
      bucket: "admin-reject",
      key: `${user.userId}:${getRequestIp(request)}`,
      limit: 30,
      windowMs: 10 * 60 * 1000,
    });

    const body = await request.json();
    const result = await rejectParticipant(body, user);

    return jsonOk(result);
  } catch (error) {
    return jsonError(error, "Unable to reject participant.");
  }
}
