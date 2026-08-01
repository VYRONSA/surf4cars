import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import { getVehicleWorkspace } from "@/features/inventory/server/inventory-intelligence.service";

export async function GET(
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

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:inventory:read"],
    });

    const payload = await getVehicleWorkspace(dealershipId, vehicleId, access.accessToken);

    return NextResponse.json(payload);
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to load vehicle workspace.");
  }
}
