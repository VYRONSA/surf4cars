import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import { listInventoryVehicles } from "@/features/inventory/server/inventory-intelligence.service";
import { parseInventoryListQuery } from "@/features/inventory/server/inventory-request";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = parseInventoryListQuery(url.searchParams);
    const access = await authorizeDealerApiRequest(request, {
      dealershipId: query.dealershipId,
      permissions: ["dealer:inventory:read"],
    });

    const payload = await listInventoryVehicles(query, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to load vehicles.");
  }
}
