import { NextResponse } from "next/server";

import {
  parseCompletionPayload,
} from "@/features/dealer-onboarding/server/onboarding-request";
import { completeDealerOnboarding } from "@/features/dealer-onboarding/server/onboarding-persistence";
import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parseCompletionPayload(body);

    if (process.env.NODE_ENV !== "production" && !request.headers.get("authorization")) {
      const result = await completeDealerOnboarding(payload);
      return NextResponse.json(result);
    }

    const access = await authorizeDealerApiRequest(request, {
      permissions: ["dealer:dashboard:view"],
    });

    const result = await completeDealerOnboarding(payload, access.accessToken);
    return NextResponse.json(result);
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to complete onboarding.");
  }
}
