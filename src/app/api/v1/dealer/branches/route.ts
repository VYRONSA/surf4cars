import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import {
  parseBranchUpdateRequest,
  parseDealershipIdFromUrl,
} from "@/features/dealership/server/dealership-management.request";
import {
  createDealershipBranch,
  getDealershipBranches,
} from "@/features/dealership/server/dealership-management.service";

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

/** Opening a branch. Contact details are optional and stay "Not provided" until supplied. */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const dealershipId = parseDealershipIdFromUrl(url);

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:branches:manage"],
    });

    const payload = await parseBranchUpdateRequest(request);
    const branch = await createDealershipBranch(dealershipId, payload, access.accessToken);
    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to create the branch.");
  }
}
