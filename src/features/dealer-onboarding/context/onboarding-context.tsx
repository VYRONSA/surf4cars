"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ONBOARDING_STEPS } from "@/features/dealer-onboarding/config/onboarding-config";
import {
  INITIAL_ONBOARDING_DATA,
  type BrandingInfo,
  type BranchInfo,
  type DealershipInfo,
  type OnboardingFormData,
  type OnboardingStepId,
  type SubscriptionPackageId,
  type TeamInfo,
} from "@/features/dealer-onboarding/types/onboarding.types";

export interface OnboardingContextValue {
  readonly currentStep: OnboardingStepId;
  readonly currentStepIndex: number;
  readonly totalSteps: number;
  readonly data: OnboardingFormData;
  readonly isFirstStep: boolean;
  readonly isLastFormStep: boolean;
  readonly isSuccessStep: boolean;
  readonly goToStep: (step: OnboardingStepId) => void;
  readonly nextStep: () => void;
  readonly prevStep: () => void;
  readonly updateDealership: (values: Partial<DealershipInfo>) => void;
  readonly updateBranding: (values: Partial<BrandingInfo>) => void;
  readonly updateBranch: (values: Partial<BranchInfo>) => void;
  readonly updateTeam: (values: Partial<TeamInfo>) => void;
  readonly setSubscriptionPackage: (pkg: SubscriptionPackageId) => void;
  readonly completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const STEP_IDS = ONBOARDING_STEPS.map((s) => s.id);

export function OnboardingProvider({ children }: { readonly children: ReactNode }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState<OnboardingFormData>(INITIAL_ONBOARDING_DATA);

  const currentStep = STEP_IDS[currentStepIndex] ?? "welcome";

  const goToStep = useCallback((step: OnboardingStepId) => {
    const index = STEP_IDS.indexOf(step);
    if (index >= 0) setCurrentStepIndex(index);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, STEP_IDS.length - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const updateDealership = useCallback((values: Partial<DealershipInfo>) => {
    setData((prev) => ({
      ...prev,
      dealership: { ...prev.dealership, ...values },
    }));
  }, []);

  const updateBranding = useCallback((values: Partial<BrandingInfo>) => {
    setData((prev) => ({
      ...prev,
      branding: { ...prev.branding, ...values },
    }));
  }, []);

  const updateBranch = useCallback((values: Partial<BranchInfo>) => {
    setData((prev) => ({
      ...prev,
      branch: { ...prev.branch, ...values },
    }));
  }, []);

  const updateTeam = useCallback((values: Partial<TeamInfo>) => {
    setData((prev) => ({
      ...prev,
      team: { ...prev.team, ...values },
    }));
  }, []);

  const setSubscriptionPackage = useCallback((pkg: SubscriptionPackageId) => {
    setData((prev) => ({ ...prev, subscriptionPackage: pkg }));
  }, []);

  const completeOnboarding = useCallback(() => {
    goToStep("success");
  }, [goToStep]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      currentStep,
      currentStepIndex,
      totalSteps: ONBOARDING_STEPS.length,
      data,
      isFirstStep: currentStepIndex === 0,
      isLastFormStep: currentStep === "review",
      isSuccessStep: currentStep === "success",
      goToStep,
      nextStep,
      prevStep,
      updateDealership,
      updateBranding,
      updateBranch,
      updateTeam,
      setSubscriptionPackage,
      completeOnboarding,
    }),
    [
      currentStep,
      currentStepIndex,
      data,
      goToStep,
      nextStep,
      prevStep,
      updateDealership,
      updateBranding,
      updateBranch,
      updateTeam,
      setSubscriptionPackage,
      completeOnboarding,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
