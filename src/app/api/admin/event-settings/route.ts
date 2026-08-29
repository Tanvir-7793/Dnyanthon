import { getEventForAdmin, updateEventSettings } from "@/lib/backend/admin";
import { jsonError, jsonOk } from "@/lib/http";
import { requireAdminUser } from "@/lib/security/permissions";

export async function GET(request: Request) {
  try {
    const user = await requireAdminUser(request);
    const eventId = new URL(request.url).searchParams.get("eventId") ?? "";
    const event = await getEventForAdmin(eventId, user);
    return jsonOk({ event });
  } catch (error) {
    return jsonError(error, "Unable to fetch event settings.");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAdminUser(request);
    const body = await request.json();
    const updated = await updateEventSettings(body, user);
    return jsonOk({ event: updated });
  } catch (error) {
    return jsonError(error, "Unable to update event settings.");
  }
}
