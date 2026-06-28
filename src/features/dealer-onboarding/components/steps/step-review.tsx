"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icons";
import { Edit } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { BrandingPreviewCard } from "@/features/dealer-onboarding/components/branding-preview-card";
import { OnboardingNavigation } from "@/features/dealer-onboarding/components/onboarding-navigation";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import {
  BUSINESS_TYPES,
  SUBSCRIPTION_PACKAGES,
} from "@/features/dealer-onboarding/config/onboarding-config";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import type { OnboardingStepId } from "@/features/dealer-onboarding/types/onboarding.types";
import { cn } from "@/utils";

export function StepReview() {
  const { data, goToStep, completeOnboarding } = useOnboarding();
  const { dealership, branch, team, subscriptionPackage } = data;

  const businessTypeLabel =
    BUSINESS_TYPES.find((t) => t.id === dealership.businessType)?.label ?? "—";

  const packageLabel =
    SUBSCRIPTION_PACKAGES.find((p) => p.id === subscriptionPackage)?.name ?? "—";

  function handleComplete() {
    completeOnboarding();
    return false;
  }

  return (
    <div className={cn(onboardingStyles.widePanel, "animate-slide-up-sfc")}>
      <header>
        <Text variant="h3" as="h2">
          Review your setup
        </Text>
        <Text variant="body-sm" tone="muted" className="mt-2 leading-[var(--leading-relaxed)]">
          Confirm everything looks right. You can go back to any step to make changes.
        </Text>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ReviewSection title="Dealership" stepId="dealership" onEdit={goToStep}>
          <ReviewRow label="Dealership Name" value={dealership.dealershipName} />
          <ReviewRow label="Trading Name" value={dealership.tradingName} />
          <ReviewRow label="Business Type" value={businessTypeLabel} />
          <ReviewRow
            label="Location"
            value={
              dealership.city && dealership.province
                ? `${dealership.city}, ${dealership.province}`
                : "—"
            }
          />
          {dealership.website && (
            <ReviewRow label="Website" value={dealership.website} />
          )}
        </ReviewSection>

        <ReviewSection title="Branding" stepId="branding" onEdit={goToStep}>
          <BrandingPreviewCard />
        </ReviewSection>

        <ReviewSection title="Branch" stepId="branch" onEdit={goToStep}>
          <ReviewRow label="Branch Name" value={branch.branchName} />
          <ReviewRow label="Address" value={branch.physicalAddress} />
          <ReviewRow label="Contact" value={branch.contactNumber} />
          <ReviewRow label="Business Hours" value={branch.businessHours} />
        </ReviewSection>

        <ReviewSection title="Team" stepId="team" onEdit={goToStep}>
          <ReviewRow label="Full Name" value={team.fullName} />
          <ReviewRow label="Position" value={team.position} />
          <ReviewRow label="Email" value={team.email} />
          <ReviewRow label="Password" value="••••••••" />
        </ReviewSection>

        <ReviewSection
          title="Subscription"
          stepId="subscription"
          onEdit={goToStep}
          className="lg:col-span-2"
        >
          <ReviewRow label="Selected Package" value={packageLabel} />
        </ReviewSection>
      </div>

      <div className="mt-10">
        <OnboardingNavigation
          onContinue={handleComplete}
          continueLabel="Complete Setup"
        />
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  stepId,
  onEdit,
  className,
  children,
}: {
  readonly title: string;
  readonly stepId: OnboardingStepId;
  readonly onEdit: (step: OnboardingStepId) => void;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/40 p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <Text variant="h6" as="h3">
          {title}
        </Text>
        <button
          type="button"
          onClick={() => onEdit(stepId)}
          className={onboardingStyles.ghostButton}
        >
          <Icon icon={Edit} size="sm" aria-hidden />
          Edit
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ReviewRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <Text variant="body-sm" tone="muted">
        {label}
      </Text>
      <Text variant="body-sm" className="sm:text-right">
        {value || "—"}
      </Text>
    </div>
  );
}
