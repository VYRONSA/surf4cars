import { NextResponse } from "next/server";

import {
  authorizeBuyerApiRequest,
  buildBuyerAuthorizationErrorResponse,
} from "@/features/authentication/server/buyer-api-authorization";
import {
  parseAlertCreateRequest,
  parseBuyerIdFromUrl,
} from "@/features/buyer-intelligence/server/buyer-intelligence.request";
import {
  createBuyerAlert,
  listBuyerAlerts,
} from "@/features/buyer-intelligence/server/buyer-intelligence.service";

export async function GET(request: Request) {
  try {
    const buyerId = parseBuyerIdFromUrl(request);
    const access = await authorizeBuyerApiRequest(request, {
      buyerId,
      permissions: ["buyer:searches:manage"],
    });
    const payload = await listBuyerAlerts(access.buyerId, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildBuyerAuthorizationErrorResponse(error, "Failed to load alerts.");
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseAlertCreateRequest(request);
    const access = await authorizeBuyerApiRequest(request, {
      buyerId: input.buyerId,
      permissions: ["buyer:searches:manage"],
    });
    const payload = await createBuyerAlert(input, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildBuyerAuthorizationErrorResponse(error, "Failed to create alert.");
  }
}
