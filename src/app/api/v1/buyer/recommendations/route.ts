import { NextResponse } from "next/server";

import {
  authorizeBuyerApiRequest,
  buildBuyerAuthorizationErrorResponse,
} from "@/features/authentication/server/buyer-api-authorization";
import { parseBuyerIdFromUrl } from "@/features/buyer-intelligence/server/buyer-intelligence.request";
import { getBuyerRecommendations } from "@/features/buyer-intelligence/server/buyer-intelligence.service";

export async function GET(request: Request) {
  try {
    const buyerId = parseBuyerIdFromUrl(request);
    const access = await authorizeBuyerApiRequest(request, {
      buyerId,
      permissions: ["buyer:dashboard:view"],
    });
    const payload = await getBuyerRecommendations(access.buyerId, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildBuyerAuthorizationErrorResponse(error, "Failed to load recommendations.");
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { readonly buyerId?: string };
    if (!body.buyerId?.trim()) {
      throw new Error("buyerId is required.");
    }
    const access = await authorizeBuyerApiRequest(request, {
      buyerId: body.buyerId,
      permissions: ["buyer:dashboard:view"],
    });
    const payload = await getBuyerRecommendations(access.buyerId, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildBuyerAuthorizationErrorResponse(error, "Failed to load recommendations.");
  }
}
