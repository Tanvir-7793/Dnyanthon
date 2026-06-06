import { exportParticipantsCsv } from "@/lib/backend/admin";
import { jsonError } from "@/lib/http";
import { requireAdminUser } from "@/lib/security/permissions";

export async function GET(request: Request) {
  try {
    const user = await requireAdminUser(request);
    const searchParams = new URL(request.url).searchParams;
    const csv = await exportParticipantsCsv(
      { eventId: searchParams.get("eventId") ?? "" },
      user,
    );

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="participants.csv"',
      },
    });
  } catch (error) {
    return jsonError(error, "Unable to export participant CSV.");
  }
}
