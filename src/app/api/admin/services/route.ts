import { createService, deleteService, updateServiceControl } from "@/lib/backend/admin";
import { jsonError, jsonOk } from "@/lib/http";
import { requireAdminUser } from "@/lib/security/permissions";

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser(request);
    const body = await request.json();
    const result = await createService(body, user);
    return jsonOk({ service: result });
  } catch (error) {
    return jsonError(error, "Unable to create service.");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAdminUser(request);
    const body = await request.json();
    const result = await updateServiceControl(body, user);
    return jsonOk({ service: result });
  } catch (error) {
    return jsonError(error, "Unable to update service.");
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAdminUser(request);
    const body = await request.json();
    const result = await deleteService(body, user);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, "Unable to delete service.");
  }
}
