"use client";

import type { ReactNode } from "react";

import { SurfWordmark } from "@/components/brand";
import { Text } from "@/components/ui/typography";
import { OnboardingProgress } from "@/features/dealer-onboarding/components/onboarding-progress";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import { cn } from "@/utils";

export interface OnboardingShellProps {
  readonly children: ReactNode;
}

export function OnboardingShell({ children }: OnboardingShellProps) {
  const { isSuccessStep, isSaving, lastSavedAt } = useOnboarding();

  return (
    <div className={onboardingStyles.shell}>
      <div className={onboardingStyles.shellGlow} aria-hidden />
      <div className={onboardingStyles.shellAccentGlow} aria-hidden />

      <header className="relative z-10 border-b border-[var(--color-border-subtle)] px-4 py-4 lg:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
          <SurfWordmark size="compact" />
          <div className="min-w-0">
            <Text variant="caption" tone="muted" className="block truncate">
              Dealer Onboarding
            </Text>
          </div>
          </div>

          {!isSuccessStep && (
            <Text variant="caption" tone="muted" className="shrink-0">
              {isSaving ? "Saving..." : lastSavedAt ? "Saved" : "Autosave on"}
            </Text>
          )}
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-4 py-8 lg:px-6 lg:py-12">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
          {!isSuccessStep && (
            <div className="mb-8 lg:mb-10">
              <OnboardingProgress />
            </div>
          )}

          <div className={cn("flex flex-1 flex-col", isSuccessStep && "items-center justify-center")}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
