import { getEmailAnalytics } from "@/lib/backend/admin";
import { jsonError, jsonOk } from "@/lib/http";
import { requireAdminUser } from "@/lib/security/permissions";

export async function GET(request: Request) {
  try {
    const user = await requireAdminUser(request);
    const eventId = new URL(request.url).searchParams.get("eventId") ?? "";
    const result = await getEmailAnalytics({ eventId }, user);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, "Unable to fetch email analytics.");
  }
}
