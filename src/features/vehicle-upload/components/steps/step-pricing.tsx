"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { TrendingUp } from "@/components/ui/icons/registry";
import { UploadNavigation } from "@/features/vehicle-upload/components/upload-navigation";
import { UploadStepLayout } from "@/features/vehicle-upload/components/upload-step-layout";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";

function formatCurrencyCents(value: number | null): string {
  if (value === null) return "Awaiting live market data";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export function StepPricing() {
  const {
    data,
    markStepComplete,
    runPricingWorkspace,
    updatePricing,
  } = useUploadWizard();

  const isPricingBusy = data.pricingWorkspace.status === "pending";

  const [validationError, setValidationError] = useState<string | null>(null);

  function validate() {
    if (!data.pricing.sellingPrice.trim()) {
      setValidationError("Set your selling price before continuing.");
      return false;
    }

    setValidationError(null);
    markStepComplete();
    return true;
  }

  return (
    <UploadStepLayout stepId="pricing">
      <div className={uploadPolish.formStack}>
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/35 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[length:var(--text-body-md)] font-semibold">Pricing Intelligence Workspace</p>
              <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                Recommended price, confidence and market position from SURF Intelligence.
              </p>
            </div>
            <Button type="button" onClick={() => void runPricingWorkspace()} disabled={isPricingBusy}>
              <Icon icon={TrendingUp} size="xs" aria-hidden />
              {isPricingBusy ? "Running Pricing Intelligence..." : "Run Pricing Intelligence"}
            </Button>
          </div>
          <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            {data.pricingWorkspace.statusMessage || "Awaiting live market data"}
          </p>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Selling Price (ZAR)" htmlFor="selling-price" required>
            <Input
              id="selling-price"
              value={data.pricing.sellingPrice}
              onChange={(event) => updatePricing({ sellingPrice: event.target.value })}
              placeholder="1249900"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Retail Price (ZAR)" htmlFor="retail-price">
            <Input
              id="retail-price"
              value={data.pricing.retailPrice}
              onChange={(event) => updatePricing({ retailPrice: event.target.value })}
              placeholder="1299900"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Purchase Price (ZAR)" htmlFor="purchase-price">
            <Input
              id="purchase-price"
              value={data.pricing.purchasePrice}
              onChange={(event) => updatePricing({ purchasePrice: event.target.value })}
              placeholder="1180000"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="Trade Price (ZAR)" htmlFor="trade-price">
            <Input
              id="trade-price"
              value={data.pricing.tradePrice}
              onChange={(event) => updatePricing({ tradePrice: event.target.value })}
              placeholder="1215000"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>

        <div className={uploadPolish.formGrid}>
          <FormField label="Monthly Finance Estimate" htmlFor="monthly-finance-estimate">
            <Input
              id="monthly-finance-estimate"
              value={data.pricing.monthlyFinanceEstimate}
              onChange={(event) => updatePricing({ monthlyFinanceEstimate: event.target.value })}
              placeholder="R 21,450 / month"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => updatePricing({ financeAvailable: !data.pricing.financeAvailable })}
              className={`rounded-[var(--radius-lg)] border px-4 py-3 text-left text-[length:var(--text-body-sm)] transition-colors ${
                data.pricing.financeAvailable
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)]/30 text-[var(--color-primary-text)]"
                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)]"
              }`}
            >
              <span className="block font-medium">Finance Available</span>
              <span className="mt-1 block text-[length:var(--text-caption)]">{data.pricing.financeAvailable ? "Enabled" : "Disabled"}</span>
            </button>
            <button
              type="button"
              onClick={() => updatePricing({ tradeInAccepted: !data.pricing.tradeInAccepted })}
              className={`rounded-[var(--radius-lg)] border px-4 py-3 text-left text-[length:var(--text-body-sm)] transition-colors ${
                data.pricing.tradeInAccepted
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)]/30 text-[var(--color-primary-text)]"
                  : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)]"
              }`}
            >
              <span className="block font-medium">Trade-In Accepted</span>
              <span className="mt-1 block text-[length:var(--text-caption)]">{data.pricing.tradeInAccepted ? "Enabled" : "Disabled"}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
              Recommended Price
            </p>
            <p className="mt-1 text-[length:var(--text-body-md)] font-semibold">
              {formatCurrencyCents(data.pricingWorkspace.recommendedPriceCents)}
            </p>
          </article>

          <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
              Confidence
            </p>
            <p className="mt-1 text-[length:var(--text-body-md)] font-semibold">
              {data.pricingWorkspace.confidence || "pending-live-market-data"}
            </p>
          </article>

          <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
              Market Position
            </p>
            <p className="mt-1 text-[length:var(--text-body-md)] font-semibold">
              {data.pricingWorkspace.marketPosition || "Awaiting live market data"}
            </p>
          </article>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
              Market Comparison
            </p>
            <p className="mt-1 text-[length:var(--text-body-md)] font-semibold">Awaiting live market data</p>
            <p className="mt-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              Real competitor benchmarking will appear here once live market feeds are connected.
            </p>
          </article>

          <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
              AI Price Guidance
            </p>
            <p className="mt-1 text-[length:var(--text-body-md)] font-semibold">
              {data.pricingWorkspace.status === "complete" ? "Ready" : "Awaiting AI analysis"}
            </p>
            <p className="mt-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              {data.pricingWorkspace.statusMessage || "Run Pricing Intelligence to generate dealer-facing price guidance."}
            </p>
          </article>
        </div>
      </div>

      <UploadNavigation onContinue={validate} validationError={validationError} continueLabel="Continue to Review & Publish" />
    </UploadStepLayout>
  );
}
