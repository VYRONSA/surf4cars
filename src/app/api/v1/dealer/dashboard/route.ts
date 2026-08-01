import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import { getDealerDashboardData } from "@/features/dealer-command-centre/server/dealer-dashboard.service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dealershipId = url.searchParams.get("dealershipId")?.trim();

    if (!dealershipId) {
      return NextResponse.json({ error: "dealershipId is required." }, { status: 400 });
    }

    const access = await authorizeDealerApiRequest(request, {
      dealershipId,
      permissions: ["dealer:dashboard:view"],
    });

    const payload = await getDealerDashboardData(dealershipId, access.accessToken);
    return NextResponse.json(payload);
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to load dealer dashboard.");
  }
}