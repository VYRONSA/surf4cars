"use client";

import { ONBOARDING_STEPS } from "@/features/dealer-onboarding/config/onboarding-config";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import { cn } from "@/utils";

export function OnboardingProgress() {
  const { currentStepIndex, isSuccessStep } = useOnboarding();

  if (isSuccessStep) return null;

  const formSteps = ONBOARDING_STEPS.filter((s) => s.id !== "success");
  const progress = ((currentStepIndex + 1) / formSteps.length) * 100;

  return (
    <div className="w-full" aria-label="Onboarding progress">
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-[length:var(--text-caption)] font-medium text-[var(--color-muted-foreground)]">
          Step {Math.min(currentStepIndex + 1, formSteps.length)} of {formSteps.length}
        </span>
        <span className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          {ONBOARDING_STEPS[currentStepIndex]?.label}
        </span>
      </div>

      {/*
        One progress indicator, not two.
        ===============================
        This rendered a continuous bar *and* a segmented one, stacked four pixels apart — two red
        lines of different thickness both reporting the same number. On the first screen a dealership
        sees, it read as a rendering fault.

        The segments survive because they carry more: they show how many steps there are and which
        are done, which is what "Step 1 of 7" above them is already promising. The continuous bar
        could only repeat the percentage.
      */}
      <div
        className="flex gap-2"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Step ${Math.min(currentStepIndex + 1, formSteps.length)} of ${formSteps.length}`}
      >
        {formSteps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isComplete = index < currentStepIndex;

          return (
            <div
              key={step.id}
              className={cn(
                "h-1.5 flex-1 rounded-[var(--radius-pill)] transition-colors duration-300",
                isActive && "bg-[var(--color-primary)]",
                isComplete && "bg-[var(--color-primary)]/60",
                !isActive && !isComplete && "bg-[var(--color-surface-sunken)]",
              )}
              aria-hidden
            />
          );
        })}
      </div>
    </div>
  );
}
