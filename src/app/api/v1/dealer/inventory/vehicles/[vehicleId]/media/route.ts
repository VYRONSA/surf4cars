import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import {
  addVehicleMedia,
  reorderVehicleMedia,
  setPrimaryMedia,
} from "@/features/inventory/server/inventory-intelligence.service";
import {
  parseMediaCreateRequest,
  parseMediaReorderRequest,
  parsePrimaryMediaRequest,
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

    const payload = await parseMediaCreateRequest(request);
    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:media:manage"],
    });

    await addVehicleMedia(dealershipId, vehicleId, payload, access.accessToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to add media.");
  }
}

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

    const mode = url.searchParams.get("mode") ?? "reorder";
    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:media:manage"],
    });

    if (mode === "primary") {
      const payload = await parsePrimaryMediaRequest(request);
      await setPrimaryMedia(dealershipId, vehicleId, payload.mediaId, access.accessToken);
      return NextResponse.json({ ok: true });
    }

    const payload = await parseMediaReorderRequest(request);
    await reorderVehicleMedia(dealershipId, vehicleId, payload.mediaIds, access.accessToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to update media.");
  }
}
