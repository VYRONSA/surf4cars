"use client";

import { FormField, Input, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { MapPin } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { OnboardingNavigation } from "@/features/dealer-onboarding/components/onboarding-navigation";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import { cn } from "@/utils";

export function StepBranch() {
  const { data, updateBranch } = useOnboarding();
  const { branch } = data;

  function validate() {
    if (!branch.branchName.trim()) return false;
    if (!branch.physicalAddress.trim()) return false;
    if (!branch.contactNumber.trim()) return false;
    if (!branch.businessHours.trim()) return false;
    return true;
  }

  return (
    <div className={cn(onboardingStyles.panel, "animate-slide-up-sfc")}>
      <header>
        <Text variant="h3" as="h2">
          Set up your first branch
        </Text>
        <Text variant="body-sm" tone="muted" className="mt-2 leading-[var(--leading-relaxed)]">
          Multi-branch support arrives in a future release. Start with your primary location.
        </Text>
      </header>

      <div className="mt-8 space-y-5">
        <FormField label="Branch Name" htmlFor="branch-name" required>
          <Input
            id="branch-name"
            value={branch.branchName}
            onChange={(e) => updateBranch({ branchName: e.target.value })}
            placeholder="e.g. Main Showroom"
          />
        </FormField>

        <FormField label="Physical Address" htmlFor="physical-address" required>
          <Textarea
            id="physical-address"
            value={branch.physicalAddress}
            onChange={(e) => updateBranch({ physicalAddress: e.target.value })}
            placeholder="Street address"
            rows={3}
          />
        </FormField>

        <FormField label="Contact Number" htmlFor="contact-number" required>
          <Input
            id="contact-number"
            type="tel"
            value={branch.contactNumber}
            onChange={(e) => updateBranch({ contactNumber: e.target.value })}
            placeholder="+27"
            autoComplete="tel"
          />
        </FormField>

        <FormField label="Business Hours" htmlFor="business-hours" required helperText="e.g. Mon–Fri 8:00–17:00">
          <Input
            id="business-hours"
            value={branch.businessHours}
            onChange={(e) => updateBranch({ businessHours: e.target.value })}
            placeholder="Mon–Fri 8:00–17:00, Sat 9:00–13:00"
          />
        </FormField>

        <div
          className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/50 p-6 text-center"
          aria-label="Map integration placeholder"
        >
          <Icon icon={MapPin} size="lg" tone="muted" aria-hidden />
          <Text variant="body-sm" tone="muted">
            Map integration — coming soon
          </Text>
        </div>
      </div>

      <div className="mt-10">
        <OnboardingNavigation onContinue={validate} />
      </div>
    </div>
  );
}
