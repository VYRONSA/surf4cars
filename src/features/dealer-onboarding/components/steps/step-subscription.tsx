"use client";

import { Icon } from "@/components/ui/icons";
import { Check } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { OnboardingNavigation } from "@/features/dealer-onboarding/components/onboarding-navigation";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import { SUBSCRIPTION_PACKAGES } from "@/features/dealer-onboarding/config/onboarding-config";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import type { SubscriptionPackageId } from "@/features/dealer-onboarding/types/onboarding.types";
import { cn } from "@/utils";
import { useState } from "react";

export function StepSubscription() {
  const { data, setSubscriptionPackage } = useOnboarding();
  const [showError, setShowError] = useState(false);

  function validate() {
    if (!data.subscriptionPackage) {
      setShowError(true);
      return false;
    }
    setShowError(false);
    return true;
  }

  function selectPackage(id: SubscriptionPackageId) {
    setSubscriptionPackage(id);
    setShowError(false);
  }

  return (
    <div className={cn(onboardingStyles.widePanel, "animate-slide-up-sfc")}>
      <header>
        <Text variant="h3" as="h2">
          Choose your package
        </Text>
        <Text variant="body-sm" tone="muted" className="mt-2 leading-[var(--leading-relaxed)]">
          Select the plan that fits your dealership. Payment integration comes later — no charges today.
        </Text>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-3" role="radiogroup" aria-label="Subscription package">
        {SUBSCRIPTION_PACKAGES.map((pkg) => {
          const isSelected = data.subscriptionPackage === pkg.id;

          return (
            <button
              key={pkg.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => selectPackage(pkg.id)}
              className={cn(
                "relative flex flex-col rounded-[var(--radius-xl)] border p-6 text-left motion-button",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)]/30 shadow-[var(--shadow-sm)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]/40 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-hover)]",
              )}
            >
              {"recommended" in pkg && pkg.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-3 py-0.5 text-[length:var(--text-caption)] font-medium text-white">
                  Recommended
                </span>
              )}

              <Text variant="h5" as="h3">
                {pkg.name}
              </Text>
              <Text variant="body-sm" tone="muted" className="mt-2 leading-[var(--leading-relaxed)]">
                {pkg.description}
              </Text>

              <ul className="mt-5 flex-1 space-y-2">
                {pkg.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex items-start gap-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]"
                  >
                    <Icon icon={Check} size="sm" tone="primary" className="mt-0.5 shrink-0" aria-hidden />
                    {highlight}
                  </li>
                ))}
              </ul>

              <div
                className={cn(
                  "mt-6 flex h-5 w-5 items-center justify-center rounded-full border-2",
                  isSelected
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                    : "border-[var(--color-border-strong)]",
                )}
                aria-hidden
              >
                {isSelected && <span className="size-2 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {showError && (
        <Text variant="body-sm" tone="danger" className="mt-4" role="alert">
          Please select a package to continue.
        </Text>
      )}

      <div className="mt-10">
        <OnboardingNavigation onContinue={validate} />
      </div>
    </div>
  );
}
