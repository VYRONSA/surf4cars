"use client";

import { useState } from "react";

import { FormField, Input, Select } from "@/components/ui/form";
import { Text } from "@/components/ui/typography";
import { OnboardingNavigation } from "@/features/dealer-onboarding/components/onboarding-navigation";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import {
  BUSINESS_TYPES,
  SA_PROVINCES,
} from "@/features/dealer-onboarding/config/onboarding-config";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import { validateDealership } from "@/features/dealer-onboarding/utils/onboarding-validators";
import { cn } from "@/utils";

export function StepDealershipInfo() {
  const { data, updateDealership, clearError } = useOnboarding();
  const { dealership } = data;
  const [validationError, setValidationError] = useState<string | null>(null);

  function validate() {
    const result = validateDealership(data);
    setValidationError(result.valid ? null : (result.message ?? "Please complete this step."));
    return result.valid;
  }

  function update(values: Partial<typeof dealership>) {
    clearError();
    setValidationError(null);
    updateDealership(values);
  }

  return (
    <div className={cn(onboardingStyles.panel, "animate-slide-up-sfc")}>
      <StepHeader
        title="Tell us about your dealership"
        description="This information helps us set up your premium presence on SURF FOR CARS."
      />

      <div className="mt-8 space-y-5">
        <FormField label="Business Name" htmlFor="business-name" required>
          <Input
            id="business-name"
            value={dealership.businessName}
            onChange={(e) => update({ businessName: e.target.value })}
            placeholder="e.g. Cape Motors"
            autoComplete="organization"
          />
        </FormField>

        <FormField label="Trading Name" htmlFor="trading-name" required>
          <Input
            id="trading-name"
            value={dealership.tradingName}
            onChange={(e) => update({ tradingName: e.target.value })}
            placeholder="Name displayed to buyers"
            autoComplete="organization"
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Registration Number" htmlFor="registration-number" required>
            <Input
              id="registration-number"
              value={dealership.registrationNumber}
              onChange={(e) => update({ registrationNumber: e.target.value })}
              placeholder="Company registration"
            />
          </FormField>

          <FormField label="VAT Number" htmlFor="vat-number" required>
            <Input
              id="vat-number"
              value={dealership.vatNumber}
              onChange={(e) => update({ vatNumber: e.target.value })}
              placeholder="VAT registration"
            />
          </FormField>
        </div>

        <FormField label="Dealer Licence Number" htmlFor="dealer-licence" helperText="Optional">
          <Input
            id="dealer-licence"
            value={dealership.dealerLicenceNumber}
            onChange={(e) => update({ dealerLicenceNumber: e.target.value })}
            placeholder="Dealer licence number"
          />
        </FormField>

        <FormField label="Business Type" htmlFor="business-type" required>
          <Select
            id="business-type"
            value={dealership.businessType}
            onChange={(e) =>
              update({
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
              onChange={(e) => update({ province: e.target.value })}
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
              onChange={(e) => update({ city: e.target.value })}
              placeholder="e.g. Cape Town"
              autoComplete="address-level2"
            />
          </FormField>
        </div>

        <FormField label="Physical Address" htmlFor="physical-address" required>
          <Input
            id="physical-address"
            value={dealership.physicalAddress}
            onChange={(e) => update({ physicalAddress: e.target.value })}
            placeholder="Street address"
            autoComplete="street-address"
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Postal Code" htmlFor="postal-code" required>
            <Input
              id="postal-code"
              value={dealership.postalCode}
              onChange={(e) => update({ postalCode: e.target.value })}
              placeholder="Postal code"
              autoComplete="postal-code"
            />
          </FormField>

          <FormField label="Email" htmlFor="dealership-email" required>
            <Input
              id="dealership-email"
              type="email"
              value={dealership.email}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="dealer@dealership.co.za"
              autoComplete="email"
            />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Telephone" htmlFor="telephone" required>
            <Input
              id="telephone"
              type="tel"
              value={dealership.telephone}
              onChange={(e) => update({ telephone: e.target.value })}
              placeholder="+27"
              autoComplete="tel"
            />
          </FormField>

          <FormField label="WhatsApp" htmlFor="whatsapp" required>
            <Input
              id="whatsapp"
              type="tel"
              value={dealership.whatsapp}
              onChange={(e) => update({ whatsapp: e.target.value })}
              placeholder="+27"
            />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="GPS Latitude" htmlFor="gps-latitude" required>
            <Input
              id="gps-latitude"
              value={dealership.gps.latitude}
              onChange={(e) => update({ gps: { ...dealership.gps, latitude: e.target.value } })}
              placeholder="-33.9249"
            />
          </FormField>

          <FormField label="GPS Longitude" htmlFor="gps-longitude" required>
            <Input
              id="gps-longitude"
              value={dealership.gps.longitude}
              onChange={(e) => update({ gps: { ...dealership.gps, longitude: e.target.value } })}
              placeholder="18.4241"
            />
          </FormField>
        </div>

        <FormField label="Website" htmlFor="website" helperText="Optional">
          <Input
            id="website"
            type="url"
            value={dealership.website}
            onChange={(e) => update({ website: e.target.value })}
            placeholder="https://"
            autoComplete="url"
          />
        </FormField>

        {validationError && (
          <Text variant="body-sm" tone="danger" role="alert">
            {validationError}
          </Text>
        )}
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
