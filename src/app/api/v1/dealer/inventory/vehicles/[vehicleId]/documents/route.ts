import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import { addVehicleDocument } from "@/features/inventory/server/inventory-intelligence.service";
import {
  parseDocumentCreateRequest,
} from "@/features/inventory/server/inventory-request";

export async function POST(
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
      permissions: ["dealer:documents:manage"],
    });
    const payload = await parseDocumentCreateRequest(request);

    await addVehicleDocument(dealershipId, vehicleId, payload, access.accessToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to add document.");
  }
}
