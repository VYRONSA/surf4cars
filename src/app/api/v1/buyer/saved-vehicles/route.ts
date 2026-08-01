import { NextResponse } from "next/server";

import {
  authorizeBuyerApiRequest,
  buildBuyerAuthorizationErrorResponse,
} from "@/features/authentication/server/buyer-api-authorization";
import {
  parseBuyerIdFromUrl,
  parseSavedVehicleCreateRequest,
  parseSavedVehicleDeleteRequest,
} from "@/features/buyer-intelligence/server/buyer-intelligence.request";
import {
  createSavedVehicle,
  deleteSavedVehicle,
  listSavedVehicles,
} from "@/features/buyer-intelligence/server/buyer-intelligence.service";

export async function GET(request: Request) {
  try {
    const buyerId = parseBuyerIdFromUrl(request);
    const access = await authorizeBuyerApiRequest(request, {
      buyerId,
      permissions: ["buyer:saved:manage"],
    });
    const payload = await listSavedVehicles(access.buyerId, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildBuyerAuthorizationErrorResponse(error, "Failed to load saved vehicles.");
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseSavedVehicleCreateRequest(request);
    const access = await authorizeBuyerApiRequest(request, {
      buyerId: input.buyerId,
      permissions: ["buyer:saved:manage"],
    });
    const payload = await createSavedVehicle(input, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildBuyerAuthorizationErrorResponse(error, "Failed to save vehicle.");
  }
}

export async function DELETE(request: Request) {
  try {
    const input = await parseSavedVehicleDeleteRequest(request);
    const access = await authorizeBuyerApiRequest(request, {
      buyerId: input.buyerId,
      permissions: ["buyer:saved:manage"],
    });
    await deleteSavedVehicle(input, access.accessToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return buildBuyerAuthorizationErrorResponse(error, "Failed to delete saved vehicle.");
  }
}
