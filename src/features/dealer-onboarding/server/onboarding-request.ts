import type { OnboardingFormData } from "@/features/dealer-onboarding/types/onboarding.types";
import { parseAuthBearerToken } from "@/features/authentication";
import { validateForCompletion } from "@/features/dealer-onboarding/utils/onboarding-validators";

interface DraftRequestPayload {
  readonly data: OnboardingFormData;
  readonly currentStepIndex: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseDraftPayload(input: unknown): DraftRequestPayload {
  if (!isObject(input) || !isObject(input.data) || typeof input.currentStepIndex !== "number") {
    throw new Error("Invalid onboarding draft payload.");
  }

  return {
    data: input.data as unknown as OnboardingFormData,
    currentStepIndex: input.currentStepIndex,
  };
}

export function parseCompletionPayload(input: unknown): OnboardingFormData {
  if (!isObject(input)) {
    throw new Error("Invalid onboarding completion payload.");
  }

  const payload = input as unknown as OnboardingFormData;
  const result = validateForCompletion(payload);
  if (!result.valid) {
    throw new Error(result.message ?? "Onboarding payload failed validation.");
  }

  return payload;
}

export const parseBearerToken = parseAuthBearerToken;
