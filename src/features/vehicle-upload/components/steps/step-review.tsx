"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/icons";
import { FormField, Input } from "@/components/ui/form";
import { ArrowRight, CheckCircle2, Upload } from "@/components/ui/icons/registry";
import { UploadStepLayout } from "@/features/vehicle-upload/components/upload-step-layout";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import { countListingPhotos, resolveListingRegistration, resolveListingTitle } from "@/features/vehicle-upload/utils/listing-summary";
import { evaluatePublishReadiness } from "@/features/vehicle-upload/utils/publish-readiness";
import { cn } from "@/utils";

function Section({ title, value }: { readonly title: string; readonly value: string }) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
      <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
        {title}
      </p>
      <p className="mt-1 text-[length:var(--text-body-md)] font-semibold">{value}</p>
    </article>
  );
}

export function StepReview() {
  const {
    data,
    editingVehicleId,
    isBusy,
    markStepComplete,
    publishListing,
    saveDraft,
    updateDescriptionBuilder,
  } = useUploadWizard();

  const [error, setError] = useState<string | null>(null);

  const title = resolveListingTitle(data);
  const photoCount = countListingPhotos(data);

  async function handleSaveDraft() {
    setError(null);
    try {
      markStepComplete();
      await saveDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft.");
    }
  }

  async function handlePublishNow() {
    setError(null);

    const readiness = evaluatePublishReadiness(data);
    if (!readiness.isReady) {
      setError(readiness.blockingIssues[0] ?? "Listing is not ready to publish.");
      return;
    }

    try {
      markStepComplete();
      await publishListing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish listing.");
    }
  }

  async function handleInventoryDraft() {
    setError(null);
    try {
      markStepComplete();
      await publishListing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save inventory draft.");
    }
  }

  return (
    <UploadStepLayout stepId="review">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Section title="Title" value={title || "Not set"} />
          <Section title="Selling Price" value={data.pricing.sellingPrice || "Not set"} />
          <Section title="Photos" value={`${photoCount}`} />
          <Section title="VIN" value={data.identification.vin || "Not set"} />
          <Section title="Registration" value={resolveListingRegistration(data) || "Not set"} />
          <Section title="Quality Score" value={`${data.intelligenceReview.qualityScore}/100`} />
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5">
          <FormField label="Listing Title (Quick Edit)" htmlFor="builder-title">
            <Input
              id="builder-title"
              value={data.descriptionBuilder.title}
              onChange={(event) => updateDescriptionBuilder({ title: event.target.value })}
              placeholder="2024 BMW X5 xDrive40i M Sport"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/35 p-5">
          <p className="text-[length:var(--text-body-md)] font-semibold">Publish Target</p>
          <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            Publish writes directly into Inventory Intelligence tables and lifecycle workflow.
          </p>
        </div>

        {error && (
          <p className={uploadPolish.validationBanner} role="alert">
            {error}
          </p>
        )}

        {data.publishResult.status !== "idle" && (
          <p className={cn(uploadPolish.validationBanner, data.publishResult.status === "published" && "border-[var(--color-success)]/30 text-[var(--color-success)]")} role="status">
            {data.publishResult.message}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 border-t border-[var(--color-border-subtle)] pt-8 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => void handleSaveDraft()} className={uploadPolish.secondaryButton} disabled={isBusy}>
            <Icon icon={Upload} size="sm" aria-hidden />
            Save Draft
          </button>
          <button type="button" onClick={() => void handleInventoryDraft()} className={uploadPolish.secondaryButton} disabled={isBusy}>
            <Icon icon={Upload} size="sm" aria-hidden />
            {editingVehicleId ? "Unpublish to Draft" : "Save as Inventory Draft"}
          </button>
          <button type="button" onClick={() => void handlePublishNow()} className={uploadPolish.primaryButton} disabled={isBusy}>
            <Icon icon={ArrowRight} size="sm" aria-hidden />
            {editingVehicleId ? "Republish Listing" : "Publish To Inventory"}
          </button>
        </div>

        <p className="text-center text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          <Icon icon={CheckCircle2} size="xs" aria-hidden /> All AI interactions route through SURF Intelligence APIs.
        </p>
      </div>
    </UploadStepLayout>
  );
}
