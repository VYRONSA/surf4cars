import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import {
  parseDealershipIdFromUrl,
  parseTeamInviteRequest,
} from "@/features/dealership/server/dealership-management.request";
import {
  getDealershipTeam,
  inviteDealershipTeamMember,
} from "@/features/dealership/server/dealership-management.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dealershipId = parseDealershipIdFromUrl(url);

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:team:view"],
    });

    const payload = await getDealershipTeam(dealershipId, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to load team members.");
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const dealershipId = parseDealershipIdFromUrl(url);

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:team:manage"],
    });

    const payload = await parseTeamInviteRequest(request);
    const created = await inviteDealershipTeamMember(dealershipId, payload, access.accessToken);
    return NextResponse.json(created);
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to invite team member.");
  }
}
