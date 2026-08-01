import type { OnboardingCompletionResult, OnboardingFormData } from "@/features/dealer-onboarding/types/onboarding.types";
import { createAuthenticatedHeaders } from "@/features/authentication";

export interface OnboardingDraftPayload {
  readonly data: OnboardingFormData;
  readonly currentStepIndex: number;
}

interface ApiErrorPayload {
  readonly error?: string;
}

interface CompleteResponse {
  readonly dealershipId: string;
  readonly primaryBranchId: string;
  readonly ownerMembershipId: string;
}

function sanitizePayload(payload: OnboardingFormData): OnboardingFormData {
  return {
    ...payload,
    branding: {
      ...payload.branding,
      // Keep enough data to indicate an uploaded asset exists without pushing full base64 blobs through the API.
      logoPreview: payload.branding.logoPreview ? payload.branding.logoPreview.slice(0, 256) : null,
      coverPreview: payload.branding.coverPreview ? payload.branding.coverPreview.slice(0, 256) : null,
    },
  };
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as ApiErrorPayload).error === "string"
  ) {
    return (payload as ApiErrorPayload).error!;
  }

  return fallback;
}

export async function saveDraftToApi(payload: OnboardingDraftPayload): Promise<void> {
  const headers = await createAuthenticatedHeaders({
    "Content-Type": "application/json",
  });

  const response = await fetch("/api/v1/dealer/onboarding/draft", {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...payload,
      data: sanitizePayload(payload.data),
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    throw new Error(getErrorMessage(body, "Failed to save onboarding draft."));
  }
}

export async function completeOnboardingInApi(
  payload: OnboardingFormData,
  accessToken?: string,
): Promise<OnboardingCompletionResult> {
  const headers = await createAuthenticatedHeaders({
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  });

  const response = await fetch("/api/v1/dealer/onboarding/complete", {
    method: "POST",
    headers,
    body: JSON.stringify(sanitizePayload(payload)),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    throw new Error(getErrorMessage(body, "Failed to complete onboarding."));
  }

  const body = (await response.json()) as CompleteResponse;
  return {
    dealershipId: body.dealershipId,
    primaryBranchId: body.primaryBranchId,
    ownerMembershipId: body.ownerMembershipId,
  };
}
