"use client";

import { StepBranch } from "@/features/dealer-onboarding/components/steps/step-branch";
import { StepBranding } from "@/features/dealer-onboarding/components/steps/step-branding";
import { StepDealershipInfo } from "@/features/dealer-onboarding/components/steps/step-dealership-info";
import { StepReview } from "@/features/dealer-onboarding/components/steps/step-review";
import { StepSubscription } from "@/features/dealer-onboarding/components/steps/step-subscription";
import { StepSuccess } from "@/features/dealer-onboarding/components/steps/step-success";
import { StepTeam } from "@/features/dealer-onboarding/components/steps/step-team";
import { StepWelcome } from "@/features/dealer-onboarding/components/steps/step-welcome";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import { cn } from "@/utils";

const STEP_COMPONENTS = {
  welcome: StepWelcome,
  dealership: StepDealershipInfo,
  branding: StepBranding,
  branch: StepBranch,
  team: StepTeam,
  subscription: StepSubscription,
  review: StepReview,
  success: StepSuccess,
} as const;

export function OnboardingWizard() {
  const { currentStep } = useOnboarding();
  const StepComponent = STEP_COMPONENTS[currentStep];

  return (
    <div
      key={currentStep}
      className={cn("flex flex-1 flex-col motion-page")}
      role="region"
      aria-live="polite"
      aria-label={`Onboarding step: ${currentStep}`}
    >
      <StepComponent />
    </div>
  );
}
