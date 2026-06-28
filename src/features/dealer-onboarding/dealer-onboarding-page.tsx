"use client";

import { OnboardingShell } from "@/features/dealer-onboarding/components/onboarding-shell";
import { OnboardingWizard } from "@/features/dealer-onboarding/components/onboarding-wizard";
import { OnboardingProvider } from "@/features/dealer-onboarding/context/onboarding-context";

export function DealerOnboardingPage() {
  return (
    <OnboardingProvider>
      <OnboardingShell>
        <OnboardingWizard />
      </OnboardingShell>
    </OnboardingProvider>
  );
}
