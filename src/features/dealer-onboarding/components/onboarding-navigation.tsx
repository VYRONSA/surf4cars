"use client";

import { Icon } from "@/components/ui/icons";
import { ArrowLeft, ArrowRight } from "@/components/ui/icons/registry";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import { cn } from "@/utils";

export interface OnboardingNavigationProps {
  readonly onContinue?: () => boolean | void;
  readonly continueLabel?: string;
  readonly showBack?: boolean;
  readonly className?: string;
}

export function OnboardingNavigation({
  onContinue,
  continueLabel = "Continue",
  showBack = true,
  className,
}: OnboardingNavigationProps) {
  const { prevStep, nextStep, isFirstStep, isSuccessStep } = useOnboarding();

  if (isSuccessStep) return null;

  function handleContinue() {
    const canProceed = onContinue?.();
    if (canProceed === false) return;
    nextStep();
  }

  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {showBack && !isFirstStep ? (
        <button type="button" onClick={prevStep} className={onboardingStyles.secondaryButton}>
          <Icon icon={ArrowLeft} size="sm" aria-hidden />
          Back
        </button>
      ) : (
        <div className="hidden sm:block" aria-hidden />
      )}

      <button type="button" onClick={handleContinue} className={cn(onboardingStyles.primaryButton, "w-full sm:w-auto sm:ml-auto")}>
        {continueLabel}
        <Icon icon={ArrowRight} size="sm" aria-hidden />
      </button>
    </div>
  );
}
