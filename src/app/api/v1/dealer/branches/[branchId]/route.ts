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
  deleteDealershipBranch,
  updateDealershipBranch,
} from "@/features/dealership/server/dealership-management.service";

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

/**
 * Closing a branch.
 *
 * Refuses while any vehicle or any member of staff still points at it, because
 * `inventory_vehicles.branch_id` cascades on delete — a permitted delete here would take the
 * branch's entire stock with it, silently. The service returns a message naming the count and the
 * fix, so a 409 here is a real answer rather than a wall.
 */
export async function DELETE(
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

    await deleteDealershipBranch(dealershipId, branchId, access.accessToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to close the branch.");
  }
}
