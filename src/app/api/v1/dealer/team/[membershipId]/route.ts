import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import {
  parseDealershipIdFromUrl,
  parseTeamMemberUpdateRequest,
} from "@/features/dealership/server/dealership-management.request";
import { updateDealershipTeamMember } from "@/features/dealership/server/dealership-management.service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ membershipId: string }> },
) {
  try {
    const url = new URL(request.url);
    const dealershipId = parseDealershipIdFromUrl(url);
    const { membershipId } = await context.params;

    if (!membershipId) {
      return NextResponse.json({ error: "membershipId is required." }, { status: 400 });
    }

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:team:manage"],
    });

    const payload = await parseTeamMemberUpdateRequest(request);
    const updated = await updateDealershipTeamMember(
      dealershipId,
      membershipId,
      payload,
      access.accessToken,
    );

    return NextResponse.json(updated);
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to update team member.");
  }
}
