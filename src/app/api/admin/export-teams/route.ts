import { exportTeamsCsv } from "@/lib/backend/admin";
import { jsonError } from "@/lib/http";
import { requireAdminUser } from "@/lib/security/permissions";

export async function GET(request: Request) {
  try {
    const user = await requireAdminUser(request);
    const eventId = new URL(request.url).searchParams.get("eventId") ?? "";
    const csv = await exportTeamsCsv({ eventId }, user);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="teams.csv"',
      },
    });
  } catch (error) {
    return jsonError(error, "Unable to export teams CSV.");
  }
}
