import { NextResponse } from "next/server";

import {
  authorizeOperationsApiRequest,
  buildOperationsAuthorizationErrorResponse,
} from "@/features/authentication/server/operations-api-authorization";
import { parseDealerIntelligenceReviewUpdate } from "@/features/operations/server/dealer-intelligence.request";
import {
  getDealerIntelligenceWorkspaceData,
  updateDealerIntelligenceReview,
} from "@/features/operations/server/dealer-intelligence.service";

export async function GET(request: Request) {
  try {
    await authorizeOperationsApiRequest(request, {
      permissions: ["operations:view"],
    });

    const payload = await getDealerIntelligenceWorkspaceData();
    return NextResponse.json(payload);
  } catch (error) {
    return buildOperationsAuthorizationErrorResponse(error, "Failed to load dealer intelligence workspace.");
  }
}

export async function PATCH(request: Request) {
  try {
    await authorizeOperationsApiRequest(request, {
      permissions: ["operations:edit"],
    });

    const input = await parseDealerIntelligenceReviewUpdate(request);
    await updateDealerIntelligenceReview(input);

    return NextResponse.json({ success: true });
  } catch (error) {
    return buildOperationsAuthorizationErrorResponse(error, "Failed to update dealer intelligence review.");
  }
}
