import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import {
  parseDealershipIdFromUrl,
  parseDealershipProfileUpdateRequest,
} from "@/features/dealership/server/dealership-management.request";
import {
  getDealershipProfile,
  updateDealershipProfile,
} from "@/features/dealership/server/dealership-management.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dealershipId = parseDealershipIdFromUrl(url);

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:profile:manage"],
    });

    const payload = await getDealershipProfile(dealershipId, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to load dealership profile.");
  }
}

export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const dealershipId = parseDealershipIdFromUrl(url);

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:profile:manage"],
    });

    const payload = await parseDealershipProfileUpdateRequest(request);
    const updated = await updateDealershipProfile(dealershipId, payload, access.accessToken);
    return NextResponse.json(updated);
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to update dealership profile.");
  }
}
