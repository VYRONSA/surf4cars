"use client";

import { DisplayMedium, Text } from "@/components/ui/typography";
import { Icon } from "@/components/ui/icons";
import { CheckCircle2, Sparkles } from "@/components/ui/icons/registry";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import { cn } from "@/utils";

export function StepSuccess() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className={cn(onboardingStyles.panel, "animate-slide-up-sfc text-center")}>
        <div className="relative mx-auto mb-8 flex size-20 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full bg-[var(--color-success-muted)]/40 animate-pulse"
            aria-hidden
          />
          <span className="relative flex size-20 items-center justify-center rounded-full bg-[var(--color-success-muted)]">
            <Icon icon={CheckCircle2} size="xl" tone="success" aria-hidden />
          </span>
          <Icon
            icon={Sparkles}
            size="sm"
            tone="accent"
            className="absolute -right-1 -top-1"
            aria-hidden
          />
        </div>

        <DisplayMedium as="h1" className="text-balance">
          Your dealership is ready to grow.
        </DisplayMedium>

        <Text
          variant="body-lg"
          tone="muted"
          className="mx-auto mt-6 max-w-md text-pretty leading-[var(--leading-relaxed)]"
        >
          Welcome to SURF FOR CARS. Your onboarding is complete — the next milestone is
          building your Dealer Command Centre.
        </Text>

        <div className="mt-8 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/50 p-5">
          <Text variant="label" tone="primary" className="mb-1 block">
            What&apos;s next
          </Text>
          <Text variant="body-sm" tone="muted" className="leading-[var(--leading-relaxed)]">
            Next we&apos;ll build your Dealer Command Centre — your central hub for growth,
            marketing, and operations.
          </Text>
        </div>

        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Dealer Command Centre coming soon"
          className={cn(onboardingStyles.primaryButton, "mt-10 w-full sm:mx-auto sm:w-auto")}
        >
          Enter SURF Command Centre
        </button>

        <Text variant="caption" tone="muted" className="mt-3 block">
          Navigation will be enabled in a future release.
        </Text>
      </div>
    </div>
  );
}
