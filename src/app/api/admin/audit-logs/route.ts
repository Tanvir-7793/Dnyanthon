import { getAuditLogs } from "@/lib/backend/admin";
import { jsonError, jsonOk } from "@/lib/http";
import { requireAdminUser } from "@/lib/security/permissions";

export async function GET(request: Request) {
  try {
    const user = await requireAdminUser(request);
    const params = new URL(request.url).searchParams;
    const result = await getAuditLogs({ eventId: params.get("eventId") ?? "", limit: Number(params.get("limit") ?? 30) }, user);
    return jsonOk({ logs: result });
  } catch (error) {
    return jsonError(error, "Unable to fetch audit logs.");
  }
}
