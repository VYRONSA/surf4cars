"use client";

import { FormField, Input, Select } from "@/components/ui/form";
import { Text } from "@/components/ui/typography";
import { OnboardingNavigation } from "@/features/dealer-onboarding/components/onboarding-navigation";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import {
  BUSINESS_TYPES,
  SA_PROVINCES,
} from "@/features/dealer-onboarding/config/onboarding-config";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import { cn } from "@/utils";

export function StepDealershipInfo() {
  const { data, updateDealership } = useOnboarding();
  const { dealership } = data;

  function validate() {
    if (!dealership.dealershipName.trim()) return false;
    if (!dealership.tradingName.trim()) return false;
    if (!dealership.businessType) return false;
    if (!dealership.province) return false;
    if (!dealership.city.trim()) return false;
    return true;
  }

  return (
    <div className={cn(onboardingStyles.panel, "animate-slide-up-sfc")}>
      <StepHeader
        title="Tell us about your dealership"
        description="This information helps us set up your premium presence on SURF FOR CARS."
      />

      <div className="mt-8 space-y-5">
        <FormField label="Dealership Name" htmlFor="dealership-name" required>
          <Input
            id="dealership-name"
            value={dealership.dealershipName}
            onChange={(e) => updateDealership({ dealershipName: e.target.value })}
            placeholder="e.g. Cape Motors"
            autoComplete="organization"
          />
        </FormField>

        <FormField label="Trading Name" htmlFor="trading-name" required>
          <Input
            id="trading-name"
            value={dealership.tradingName}
            onChange={(e) => updateDealership({ tradingName: e.target.value })}
            placeholder="Name displayed to buyers"
            autoComplete="organization"
          />
        </FormField>

        <FormField label="Business Type" htmlFor="business-type" required>
          <Select
            id="business-type"
            value={dealership.businessType}
            onChange={(e) =>
              updateDealership({
                businessType: e.target.value as typeof dealership.businessType,
              })
            }
          >
            <option value="">Select business type</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Province" htmlFor="province" required>
            <Select
              id="province"
              value={dealership.province}
              onChange={(e) => updateDealership({ province: e.target.value })}
            >
              <option value="">Select province</option>
              {SA_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="City" htmlFor="city" required>
            <Input
              id="city"
              value={dealership.city}
              onChange={(e) => updateDealership({ city: e.target.value })}
              placeholder="e.g. Cape Town"
              autoComplete="address-level2"
            />
          </FormField>
        </div>

        <FormField label="Website" htmlFor="website" helperText="Optional">
          <Input
            id="website"
            type="url"
            value={dealership.website}
            onChange={(e) => updateDealership({ website: e.target.value })}
            placeholder="https://"
            autoComplete="url"
          />
        </FormField>
      </div>

      <div className="mt-10">
        <OnboardingNavigation onContinue={validate} />
      </div>
    </div>
  );
}

function StepHeader({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <header>
      <Text variant="h3" as="h2">
        {title}
      </Text>
      <Text variant="body-sm" tone="muted" className="mt-2 leading-[var(--leading-relaxed)]">
        {description}
      </Text>
    </header>
  );
}
