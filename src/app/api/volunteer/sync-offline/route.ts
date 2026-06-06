import { syncOfflineClaims } from "@/lib/backend/volunteer";
import { corsPreflight, getRequestIp, jsonCorsError, jsonCorsOk } from "@/lib/http";
import { requireVolunteerUser } from "@/lib/security/permissions";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await requireVolunteerUser(request);
    await enforceRateLimit({
      bucket: "volunteer-sync-offline",
      key: `${user.userId}:${getRequestIp(request)}`,
      limit: 30,
      windowMs: 10 * 60 * 1000,
    });

    const body = await request.json();
    const result = await syncOfflineClaims(body, user);

    return jsonCorsOk(result, request);
  } catch (error) {
    return jsonCorsError(request, error, "Unable to sync offline claims.");
  }
}

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}
