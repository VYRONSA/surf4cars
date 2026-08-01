import { NextResponse } from "next/server";

import {
  authorizeDealerApiRequest,
  buildDealerAuthorizationErrorResponse,
} from "@/features/authentication/server/dealer-api-authorization";
import { parseDraftPayload } from "@/features/dealer-onboarding/server/onboarding-request";
import { saveOnboardingDraft } from "@/features/dealer-onboarding/server/onboarding-persistence";

export async function POST(request: Request) {
  try {
    await authorizeDealerApiRequest(request, {
      permissions: ["dealer:dashboard:view"],
    });

    const body = await request.json();
    const payload = parseDraftPayload(body);
    await saveOnboardingDraft(payload.data, payload.currentStepIndex);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return buildDealerAuthorizationErrorResponse(error, "Failed to save onboarding draft.");
  }
}
