import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import { parseDealershipIdFromUrl } from "@/features/dealership/server/dealership-management.request";
import { getDealershipBranches } from "@/features/dealership/server/dealership-management.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dealershipId = parseDealershipIdFromUrl(url);

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:branches:view"],
    });

    const payload = await getDealershipBranches(dealershipId, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to load dealership branches.");
  }
}
