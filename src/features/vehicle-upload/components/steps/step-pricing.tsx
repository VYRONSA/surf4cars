"use client";

import { useState } from "react";

import { FormField, Input, Toggle } from "@/components/ui/form";
import { UploadNavigation } from "@/features/vehicle-upload/components/upload-navigation";
import { UploadStepLayout } from "@/features/vehicle-upload/components/upload-step-layout";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import { estimateProfit } from "@/features/vehicle-upload/utils/upload-preview";

function formatCurrency(value: number): string {
  return `R ${value.toLocaleString("en-ZA")}`;
}

export function StepPricing() {
  const { data, updatePricing, markStepComplete } = useUploadWizard();
  const { pricing } = data;
  const profit = estimateProfit(data);
  const [validationError, setValidationError] = useState<string | null>(null);

  function validate() {
    if (!pricing.sellingPrice.trim()) {
      setValidationError("Enter your list price — this is what buyers see on the marketplace.");
      return false;
    }
    setValidationError(null);
    markStepComplete();
    return true;
  }

  return (
    <UploadStepLayout stepId="pricing">
      <div className={uploadPolish.formStack}>
        <div className={uploadPolish.formGrid}>
          <FormField label="Purchase Price" htmlFor="purchase-price" helperText="What you paid — for internal profit reporting.">
            <Input
              id="purchase-price"
              inputSize="lg"
              value={pricing.purchasePrice}
              onChange={(e) => updatePricing({ purchasePrice: e.target.value })}
              placeholder="1,180,000"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Selling Price" htmlFor="selling-price" required helperText="Public list price on SURF4CARS.">
            <Input
              id="selling-price"
              inputSize="lg"
              value={pricing.sellingPrice}
              onChange={(e) => updatePricing({ sellingPrice: e.target.value })}
              placeholder="1,249,900"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Retail Price" htmlFor="retail-price" helperText="Optional — for comparison against list price.">
            <Input
              id="retail-price"
              inputSize="lg"
              value={pricing.retailPrice}
              onChange={(e) => updatePricing({ retailPrice: e.target.value })}
              placeholder="1,299,000"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Trade Price" htmlFor="trade-price" helperText="Internal trade-in valuation reference.">
            <Input
              id="trade-price"
              inputSize="lg"
              value={pricing.tradePrice}
              onChange={(e) => updatePricing({ tradePrice: e.target.value })}
              placeholder="1,150,000"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>

        {profit !== null && (
          <div className={uploadPolish.profitCard} role="status">
            <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-success)]">
              Estimated Gross Profit
            </p>
            <p className="mt-1 text-[length:var(--text-h2)] font-semibold text-[var(--color-success)]">
              {formatCurrency(profit)}
            </p>
            <p className="mt-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              Based on purchase vs selling price (dealer estimate only)
            </p>
          </div>
        )}

        <FormField label="Monthly Finance Estimate" htmlFor="finance-estimate" helperText="Displayed on listing cards — e.g. Est. R18,450 /mo">
          <Input
            id="finance-estimate"
            inputSize="lg"
            value={pricing.monthlyFinanceEstimate}
            onChange={(e) => updatePricing({ monthlyFinanceEstimate: e.target.value })}
            placeholder="Est. R18,450 /mo at 11.5% over 72 months"
            className={uploadPolish.inputClass}
          />
        </FormField>

        <div className="flex flex-col gap-5 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <Toggle
            id="finance-available"
            checked={pricing.financeAvailable}
            onChange={(e) => updatePricing({ financeAvailable: e.target.checked })}
            label="Finance available through dealer partners"
          />
          <Toggle
            id="trade-in"
            checked={pricing.tradeInAccepted}
            onChange={(e) => updatePricing({ tradeInAccepted: e.target.checked })}
            label="Trade-in accepted"
          />
        </div>
      </div>

      <UploadNavigation onContinue={validate} validationError={validationError} />
    </UploadStepLayout>
  );
}
