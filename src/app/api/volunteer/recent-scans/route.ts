import { getVolunteerRecentScans } from "@/lib/backend/volunteer";
import { corsPreflight, jsonCorsError, jsonCorsOk } from "@/lib/http";
import { requireAuthenticatedUser } from "@/lib/security/permissions";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const result = await getVolunteerRecentScans(user);

    return jsonCorsOk({ recentScans: result }, request);
  } catch (error) {
    return jsonCorsError(request, error, "Unable to fetch volunteer scan history.");
  }
}

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}
