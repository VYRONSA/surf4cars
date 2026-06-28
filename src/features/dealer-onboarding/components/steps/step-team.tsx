"use client";

import { FormField, Input } from "@/components/ui/form";
import { Text } from "@/components/ui/typography";
import { OnboardingNavigation } from "@/features/dealer-onboarding/components/onboarding-navigation";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import { cn } from "@/utils";

export function StepTeam() {
  const { data, updateTeam } = useOnboarding();
  const { team } = data;

  function validate() {
    if (!team.fullName.trim()) return false;
    if (!team.position.trim()) return false;
    if (!team.email.trim()) return false;
    if (team.password.length < 8) return false;
    return true;
  }

  return (
    <div className={cn(onboardingStyles.panel, "animate-slide-up-sfc")}>
      <header>
        <Text variant="h3" as="h2">
          Create your account
        </Text>
        <Text variant="body-sm" tone="muted" className="mt-2 leading-[var(--leading-relaxed)]">
          You&apos;ll be the first team member. Staff invitations will be available from your Command Centre.
        </Text>
      </header>

      <div className="mt-8 space-y-5">
        <FormField label="Full Name" htmlFor="full-name" required>
          <Input
            id="full-name"
            value={team.fullName}
            onChange={(e) => updateTeam({ fullName: e.target.value })}
            placeholder="Your full name"
            autoComplete="name"
          />
        </FormField>

        <FormField label="Position" htmlFor="position" required>
          <Input
            id="position"
            value={team.position}
            onChange={(e) => updateTeam({ position: e.target.value })}
            placeholder="e.g. Dealer Principal"
            autoComplete="organization-title"
          />
        </FormField>

        <FormField label="Email" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            value={team.email}
            onChange={(e) => updateTeam({ email: e.target.value })}
            placeholder="you@dealership.co.za"
            autoComplete="email"
          />
        </FormField>

        <FormField label="Password" htmlFor="password" required helperText="Minimum 8 characters">
          <Input
            id="password"
            type="password"
            value={team.password}
            onChange={(e) => updateTeam({ password: e.target.value })}
            placeholder="Create a secure password"
            autoComplete="new-password"
          />
        </FormField>
      </div>

      <div className="mt-10">
        <OnboardingNavigation onContinue={validate} />
      </div>
    </div>
  );
}
