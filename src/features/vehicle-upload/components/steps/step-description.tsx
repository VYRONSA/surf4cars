"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Sparkles } from "@/components/ui/icons/registry";
import { UploadNavigation } from "@/features/vehicle-upload/components/upload-navigation";
import { UploadStepLayout } from "@/features/vehicle-upload/components/upload-step-layout";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";

export function StepDescription() {
  const {
    data,
    markStepComplete,
    runDescriptionBuilder,
    updateDescription,
    updateDescriptionBuilder,
  } = useUploadWizard();

  const isDescriptionBusy = data.descriptionBuilder.generationStatus === "pending";

  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const hasManualCompletion = Boolean(
      data.descriptionBuilder.title.trim()
      && data.descriptionBuilder.description.trim()
      && data.descriptionBuilder.seoTitle.trim()
      && data.descriptionBuilder.seoDescription.trim(),
    );

    if (!hasManualCompletion || data.descriptionBuilder.generationStatus === "complete") {
      return;
    }

    updateDescriptionBuilder({
      generationStatus: "complete",
      generationMessage: "Description Builder completed with manual enrichment.",
    });
  }, [
    data.descriptionBuilder.description,
    data.descriptionBuilder.generationStatus,
    data.descriptionBuilder.seoDescription,
    data.descriptionBuilder.seoTitle,
    data.descriptionBuilder.title,
    updateDescriptionBuilder,
  ]);

  function validate() {
    if (!data.descriptionBuilder.title.trim()) {
      setValidationError("Add a listing title before continuing.");
      return false;
    }

    if (!data.descriptionBuilder.description.trim()) {
      setValidationError("Add a listing description before continuing.");
      return false;
    }

    setValidationError(null);
    markStepComplete();
    return true;
  }

  return (
    <UploadStepLayout stepId="description">
      <div className={uploadPolish.formStack}>
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/35 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[length:var(--text-body-md)] font-semibold">Description Builder Interface</p>
              <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                AI provider contract is ready. Content generation currently reports explicit pending states.
              </p>
            </div>
            <Button type="button" onClick={() => void runDescriptionBuilder()} disabled={isDescriptionBusy}>
              <Icon icon={Sparkles} size="xs" aria-hidden />
              {isDescriptionBusy ? "Running Builder..." : "Run Description Builder"}
            </Button>
          </div>
          <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            {data.descriptionBuilder.generationMessage || "Awaiting AI analysis"}
          </p>
        </div>

        <FormField label="Title" htmlFor="builder-title" required>
          <Input
            id="builder-title"
            value={data.descriptionBuilder.title}
            onChange={(event) => updateDescriptionBuilder({ title: event.target.value })}
            placeholder="2024 BMW X5 xDrive40i M Sport"
            className={uploadPolish.inputClass}
          />
        </FormField>

        <FormField label="Description" htmlFor="builder-description" required>
          <Textarea
            id="builder-description"
            value={data.descriptionBuilder.description}
            onChange={(event) => {
              updateDescriptionBuilder({ description: event.target.value });
              updateDescription(event.target.value);
            }}
            placeholder="Awaiting AI analysis"
            rows={7}
          />
        </FormField>

        <FormField label="Highlights (one per line)" htmlFor="builder-highlights">
          <Textarea
            id="builder-highlights"
            value={data.descriptionBuilder.highlights.join("\n")}
            onChange={(event) => {
              const highlights = event.target.value
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean);
              updateDescriptionBuilder({ highlights });
            }}
            placeholder="Awaiting AI analysis"
            rows={4}
          />
        </FormField>

        <div className={uploadPolish.formGrid}>
          <FormField label="SEO Title" htmlFor="builder-seo-title">
            <Input
              id="builder-seo-title"
              value={data.descriptionBuilder.seoTitle}
              onChange={(event) => updateDescriptionBuilder({ seoTitle: event.target.value })}
              placeholder="Awaiting AI analysis"
              className={uploadPolish.inputClass}
            />
          </FormField>
          <FormField label="SEO Description" htmlFor="builder-seo-description">
            <Input
              id="builder-seo-description"
              value={data.descriptionBuilder.seoDescription}
              onChange={(event) => updateDescriptionBuilder({ seoDescription: event.target.value })}
              placeholder="Awaiting AI analysis"
              className={uploadPolish.inputClass}
            />
          </FormField>
        </div>
      </div>

      <UploadNavigation
        onContinue={validate}
        validationError={validationError}
        continueLabel="Continue to Pricing Workspace"
      />
    </UploadStepLayout>
  );
}
