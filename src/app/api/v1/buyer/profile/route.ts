import { NextResponse } from "next/server";

import {
  authorizeBuyerApiRequest,
  buildBuyerAuthorizationErrorResponse,
} from "@/features/authentication/server/buyer-api-authorization";
import {
  parseBuyerIdFromUrl,
  parseBuyerProfileUpsertRequest,
} from "@/features/buyer-intelligence/server/buyer-intelligence.request";
import {
  getBuyerProfile,
  upsertBuyerProfile,
} from "@/features/buyer-intelligence/server/buyer-intelligence.service";

export async function GET(request: Request) {
  try {
    const buyerId = parseBuyerIdFromUrl(request);
    const access = await authorizeBuyerApiRequest(request, {
      buyerId,
      permissions: ["buyer:profile:manage"],
    });
    const payload = await getBuyerProfile(access.buyerId, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildBuyerAuthorizationErrorResponse(error, "Failed to load buyer profile.");
  }
}

export async function PUT(request: Request) {
  try {
    const input = await parseBuyerProfileUpsertRequest(request);
    const access = await authorizeBuyerApiRequest(request, {
      buyerId: input.buyerId,
      permissions: ["buyer:profile:manage"],
    });
    const payload = await upsertBuyerProfile(input, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildBuyerAuthorizationErrorResponse(error, "Failed to save buyer profile.");
  }
}
