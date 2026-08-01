"use client";

import { useState } from "react";

import { FormField, Input, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { MapPin, Plus, Trash2 } from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { OnboardingNavigation } from "@/features/dealer-onboarding/components/onboarding-navigation";
import { onboardingStyles } from "@/features/dealer-onboarding/components/onboarding-shared";
import { SA_PROVINCES } from "@/features/dealer-onboarding/config/onboarding-config";
import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import { validateBranches } from "@/features/dealer-onboarding/utils/onboarding-validators";
import { cn } from "@/utils";

export function StepBranch() {
  const { data, addBranch, updateBranch, removeBranch, clearError } = useOnboarding();
  const [validationError, setValidationError] = useState<string | null>(null);

  function validate() {
    const result = validateBranches(data);
    setValidationError(result.valid ? null : (result.message ?? "Please complete this step."));
    return result.valid;
  }

  function update(branchId: string, values: Parameters<typeof updateBranch>[1]) {
    clearError();
    setValidationError(null);
    updateBranch(branchId, values);
  }

  return (
    <div className={cn(onboardingStyles.panel, "animate-slide-up-sfc")}>
      <header>
        <Text variant="h3" as="h2">
          Add your branches
        </Text>
        <Text variant="body-sm" tone="muted" className="mt-2 leading-[var(--leading-relaxed)]">
          Every branch should include contact details, business hours, and an accountable manager.
        </Text>
      </header>

      <div className="mt-8 space-y-6">
        {data.branches.map((branch, index) => (
          <section
            key={branch.id}
            className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/30 p-5"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <Text variant="h6" as="h3">
                Branch {index + 1}
              </Text>
              {data.branches.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBranch(branch.id)}
                  className={cn(onboardingStyles.ghostButton, "text-[var(--color-danger)] hover:text-[var(--color-danger)]")}
                >
                  <Icon icon={Trash2} size="sm" aria-hidden />
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-5">
              <FormField label="Branch Name" htmlFor={`branch-name-${branch.id}`} required>
                <Input
                  id={`branch-name-${branch.id}`}
                  value={branch.branchName}
                  onChange={(e) => update(branch.id, { branchName: e.target.value })}
                  placeholder="e.g. Main Showroom"
                />
              </FormField>

              <FormField label="Address" htmlFor={`branch-address-${branch.id}`} required>
                <Textarea
                  id={`branch-address-${branch.id}`}
                  value={branch.address}
                  onChange={(e) => update(branch.id, { address: e.target.value })}
                  placeholder="Street address"
                  rows={3}
                />
              </FormField>

              <div className="grid gap-5 sm:grid-cols-3">
                <FormField label="Province" htmlFor={`branch-province-${branch.id}`} required>
                  <select
                    id={`branch-province-${branch.id}`}
                    value={branch.province}
                    onChange={(e) => update(branch.id, { province: e.target.value })}
                    className="h-10 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 text-[length:var(--text-body-sm)]"
                  >
                    <option value="">Select province</option>
                    {SA_PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="City" htmlFor={`branch-city-${branch.id}`} required>
                  <Input
                    id={`branch-city-${branch.id}`}
                    value={branch.city}
                    onChange={(e) => update(branch.id, { city: e.target.value })}
                    placeholder="City"
                  />
                </FormField>

                <FormField label="Postal Code" htmlFor={`branch-postal-${branch.id}`} required>
                  <Input
                    id={`branch-postal-${branch.id}`}
                    value={branch.postalCode}
                    onChange={(e) => update(branch.id, { postalCode: e.target.value })}
                    placeholder="Postal code"
                  />
                </FormField>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <FormField label="Telephone" htmlFor={`branch-phone-${branch.id}`} required>
                  <Input
                    id={`branch-phone-${branch.id}`}
                    type="tel"
                    value={branch.telephone}
                    onChange={(e) => update(branch.id, { telephone: e.target.value })}
                    placeholder="+27"
                  />
                </FormField>

                <FormField label="WhatsApp" htmlFor={`branch-whatsapp-${branch.id}`} required>
                  <Input
                    id={`branch-whatsapp-${branch.id}`}
                    type="tel"
                    value={branch.whatsapp}
                    onChange={(e) => update(branch.id, { whatsapp: e.target.value })}
                    placeholder="+27"
                  />
                </FormField>

                <FormField label="Email" htmlFor={`branch-email-${branch.id}`} required>
                  <Input
                    id={`branch-email-${branch.id}`}
                    type="email"
                    value={branch.email}
                    onChange={(e) => update(branch.id, { email: e.target.value })}
                    placeholder="branch@dealership.co.za"
                  />
                </FormField>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Business Hours"
                  htmlFor={`branch-hours-${branch.id}`}
                  required
                  helperText="e.g. Mon–Fri 8:00–17:00, Sat 9:00–13:00"
                >
                  <Input
                    id={`branch-hours-${branch.id}`}
                    value={branch.businessHours}
                    onChange={(e) => update(branch.id, { businessHours: e.target.value })}
                    placeholder="Business hours"
                  />
                </FormField>

                <FormField label="Branch Manager" htmlFor={`branch-manager-${branch.id}`} required>
                  <Input
                    id={`branch-manager-${branch.id}`}
                    value={branch.branchManager}
                    onChange={(e) => update(branch.id, { branchManager: e.target.value })}
                    placeholder="Manager name"
                  />
                </FormField>
              </div>
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={addBranch}
          className={cn(onboardingStyles.secondaryButton, "w-full")}
        >
          <Icon icon={Plus} size="sm" aria-hidden />
          Add Branch
        </button>

        <div
          className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/50 p-6 text-center"
          aria-label="Map integration placeholder"
        >
          <Icon icon={MapPin} size="lg" tone="muted" aria-hidden />
          <Text variant="body-sm" tone="muted">
            GPS map placement will use this branch data after onboarding.
          </Text>
        </div>

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
