import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import {
  parseBranchUpdateRequest,
  parseDealershipIdFromUrl,
} from "@/features/dealership/server/dealership-management.request";
import { updateDealershipBranch } from "@/features/dealership/server/dealership-management.service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ branchId: string }> },
) {
  try {
    const url = new URL(request.url);
    const dealershipId = parseDealershipIdFromUrl(url);
    const { branchId } = await context.params;

    if (!branchId) {
      return NextResponse.json({ error: "branchId is required." }, { status: 400 });
    }

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:branches:manage"],
    });

    const payload = await parseBranchUpdateRequest(request);
    const updated = await updateDealershipBranch(dealershipId, branchId, payload, access.accessToken);

    return NextResponse.json(updated);
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to update branch.");
  }
}
