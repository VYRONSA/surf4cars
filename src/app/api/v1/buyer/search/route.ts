import { NextResponse } from "next/server";

import {
  authorizeBuyerApiRequest,
  buildBuyerAuthorizationErrorResponse,
} from "@/features/authentication/server/buyer-api-authorization";
import { parseBuyerSearchRequest } from "@/features/buyer-intelligence/server/buyer-intelligence.request";
import { searchBuyerVehicles } from "@/features/buyer-intelligence/server/buyer-intelligence.service";

export async function POST(request: Request) {
  try {
    const input = await parseBuyerSearchRequest(request);
    const access = await authorizeBuyerApiRequest(request, {
      buyerId: input.buyerId,
      permissions: ["buyer:dashboard:view"],
    });
    const payload = await searchBuyerVehicles({ ...input, buyerId: access.buyerId }, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildBuyerAuthorizationErrorResponse(error, "Failed buyer search.");
  }
}
