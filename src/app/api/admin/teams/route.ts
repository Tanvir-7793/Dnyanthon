import { listTeams } from "@/lib/backend/admin";
import { jsonError, jsonOk } from "@/lib/http";
import { requireAdminUser } from "@/lib/security/permissions";

export async function GET(request: Request) {
  try {
    const user = await requireAdminUser(request);
    const searchParams = new URL(request.url).searchParams;
    const result = await listTeams(
      { eventId: searchParams.get("eventId") ?? "" },
      user,
    );

    return jsonOk({ teams: result });
  } catch (error) {
    return jsonError(error, "Unable to fetch teams.");
  }
}
