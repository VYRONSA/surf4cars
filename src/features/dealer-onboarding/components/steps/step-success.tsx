"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { DisplayMedium, Text } from "@/components/ui/typography";
import { Icon } from "@/components/ui/icons";
import { CheckCircle2, Sparkles } from "@/components/ui/icons/registry";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import { cn } from "@/utils";

function resolveDealerTargetPath(input: string | null): string {
  if (!input) return "/dealer/dashboard";
  if (!input.startsWith("/")) return "/dealer/dashboard";
  if (input.startsWith("//")) return "/dealer/dashboard";
  if (input.startsWith("/auth/")) return "/dealer/dashboard";
  return input;
}

export function StepSuccess() {
  const { completion } = useOnboarding();
  const searchParams = useSearchParams();
  const nextHref = useMemo(
    () => resolveDealerTargetPath(searchParams.get("redirect")),
    [searchParams],
  );

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
          Welcome to SURF FOR CARS. Your onboarding is complete and your dealer workspace is now active.
        </Text>

        <div className="mt-8 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/50 p-5">
          <Text variant="label" tone="primary" className="mb-1 block">
            What&apos;s next
          </Text>
          <Text variant="body-sm" tone="muted" className="leading-[var(--leading-relaxed)]">
            Start in the Dealer Command Centre, then upload your first vehicles to begin receiving leads.
          </Text>

          {completion && (
            <Text variant="caption" tone="muted" className="mt-3 block">
              Dealership ID: {completion.dealershipId} | Primary Branch ID: {completion.primaryBranchId}
            </Text>
          )}
        </div>

        <Link
          href={nextHref}
          className={cn(onboardingStyles.primaryButton, "mt-10 w-full sm:mx-auto sm:w-auto")}
        >
          Enter Dealer Dashboard
        </Link>
      </div>
    </div>
  );
}
