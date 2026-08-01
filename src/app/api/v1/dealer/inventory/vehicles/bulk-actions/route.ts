import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import { applyBulkInventoryAction } from "@/features/inventory/server/inventory-intelligence.service";
import { parseBulkActionRequest } from "@/features/inventory/server/inventory-request";

export async function POST(request: Request) {
  try {
    const payload = await parseBulkActionRequest(request);
    const access = await authorizeDealerApiRequest(request, {
      dealershipId: payload.dealershipId,
      permissions: ["dealer:inventory:write", "dealer:inventory:publish"],
    });

    await applyBulkInventoryAction(payload, access.accessToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to apply bulk action.");
  }
}
