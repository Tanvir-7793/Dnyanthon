import { jsonError, jsonOk, getRequestIp } from "@/lib/http";
import { registerForEvent } from "@/lib/backend/registration";
import { requireAuthenticatedUser } from "@/lib/security/permissions";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    await enforceRateLimit({
      bucket: "register-event",
      key: `${user.userId}:${getRequestIp(request)}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });

    const body = await request.json();
    const result = await registerForEvent(body, user);

    return jsonOk(result, { status: 201 });
  } catch (error) {
    return jsonError(error, "Unable to register for the event.");
  }
}
