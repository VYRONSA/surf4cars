import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import { updateVehicleLifecycleStatus } from "@/features/inventory/server/inventory-intelligence.service";
import { parseStatusUpdate } from "@/features/inventory/server/inventory-request";

export async function PATCH(
  request: Request,
  { params }: { readonly params: Promise<{ readonly vehicleId: string }> },
) {
  try {
    const { vehicleId } = await params;
    const url = new URL(request.url);
    const dealershipId = url.searchParams.get("dealershipId");

    if (!dealershipId) {
      return NextResponse.json({ error: "dealershipId is required." }, { status: 400 });
    }

    const status = await parseStatusUpdate(request);
    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:inventory:publish"],
    });

    await updateVehicleLifecycleStatus(dealershipId, vehicleId, status, access.accessToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to update lifecycle status.");
  }
}
