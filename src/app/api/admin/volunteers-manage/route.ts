import { manageVolunteer } from "@/lib/backend/admin";
import { jsonError, jsonOk } from "@/lib/http";
import { requireAdminUser } from "@/lib/security/permissions";

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser(request);
    const body = await request.json();
    const result = await manageVolunteer(body, user, "add");
    return jsonOk({ volunteer: result });
  } catch (error) {
    return jsonError(error, "Unable to add volunteer.");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAdminUser(request);
    const body = await request.json();
    const result = await manageVolunteer(body, user, "update");
    return jsonOk({ volunteer: result });
  } catch (error) {
    return jsonError(error, "Unable to update volunteer.");
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAdminUser(request);
    const body = await request.json();
    const result = await manageVolunteer(body, user, "remove");
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, "Unable to remove volunteer.");
  }
}
