"use client";

import { DisplayMedium, Text } from "@/components/ui/typography";
import { Icon } from "@/components/ui/icons";
import { ArrowRight } from "@/components/ui/icons/registry";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import { cn } from "@/utils";

export function StepWelcome() {
  const { nextStep } = useOnboarding();

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className={cn(onboardingStyles.panel, "animate-slide-up-sfc text-center")}>
        <Text variant="overline" tone="primary" className="mb-4 block">
          Dealer Onboarding
        </Text>

        <DisplayMedium as="h1" className="text-balance">
          Welcome to the future of dealership growth.
        </DisplayMedium>

        <Text
          variant="body-lg"
          tone="muted"
          className="mx-auto mt-6 max-w-lg text-pretty leading-[var(--leading-relaxed)]"
        >
          SURF FOR CARS helps you market your vehicles, grow your business, and
          reach more buyers — with technology built for ambitious dealerships.
        </Text>

        <button
          type="button"
          onClick={nextStep}
          className={cn(onboardingStyles.primaryButton, "mt-10 w-full sm:mx-auto sm:w-auto")}
        >
          Let&apos;s Build Your Dealership
          <Icon icon={ArrowRight} size="sm" aria-hidden />
        </button>
      </div>
    </div>
  );
}
