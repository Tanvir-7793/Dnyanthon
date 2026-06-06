import { verifyQrAndClaimService } from "@/lib/backend/volunteer";
import { corsPreflight, getRequestIp, jsonCorsError, jsonCorsOk } from "@/lib/http";
import { requireVolunteerUser } from "@/lib/security/permissions";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await requireVolunteerUser(request);
    await enforceRateLimit({
      bucket: "volunteer-scan",
      key: `${user.userId}:${getRequestIp(request)}`,
      limit: 180,
      windowMs: 5 * 60 * 1000,
    });

    const body = await request.json();
    const result = await verifyQrAndClaimService(body, user);

    return jsonCorsOk(result, request);
  } catch (error) {
    return jsonCorsError(request, error, "Unable to verify QR code.");
  }
}

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}
