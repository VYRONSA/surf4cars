"use client";

import { FormField, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Sparkles } from "@/components/ui/icons/registry";
import { UploadNavigation } from "@/features/vehicle-upload/components/upload-navigation";
import { UploadStepLayout } from "@/features/vehicle-upload/components/upload-step-layout";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import { buildPreviewListing } from "@/features/vehicle-upload/utils/upload-preview";
import { cn } from "@/utils";

const MIN_RECOMMENDED = 200;

export function StepDescription() {
  const { data, updateDescription, markStepComplete } = useUploadWizard();
  const listing = buildPreviewListing(data);
  const charCount = data.description.length;

  function validate() {
    markStepComplete();
    return true;
  }

  return (
    <UploadStepLayout stepId="description">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <FormField
            label="Vehicle Description"
            htmlFor="description"
            helperText="Describe condition, history, and standout features."
          >
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => updateDescription(e.target.value)}
              rows={12}
              placeholder="Single owner from new. Full dealer service history. M Sport package with panoramic roof…"
              className="min-h-[300px] text-[length:var(--text-body-md)] leading-[var(--leading-relaxed)]"
            />
          </FormField>

          <div className="mt-3 flex items-center justify-between">
            <span
              className={
                charCount < MIN_RECOMMENDED
                  ? "text-[length:var(--text-caption)] text-[var(--color-warning)]"
                  : "text-[length:var(--text-caption)] text-[var(--color-success)]"
              }
            >
              {charCount} characters {charCount < MIN_RECOMMENDED && `(aim for ${MIN_RECOMMENDED}+)`}
            </span>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] px-3 py-1.5 text-[length:var(--text-caption)] font-medium text-[var(--color-muted-foreground)]"
            >
              <Icon icon={Sparkles} size="xs" aria-hidden />
              Generate with AI (soon)
            </button>
          </div>
        </div>

        <div className={cn(uploadPolish.glassCard, "lg:col-span-2 p-5")}>
          <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
            Preview
          </p>
          <h3 className="mt-2 text-[length:var(--text-body-md)] font-semibold">{listing.title}</h3>
          <p className="mt-3 text-[length:var(--text-body-sm)] leading-[var(--leading-relaxed)] text-[var(--color-muted-foreground)]">
            {data.description || "Your description will appear here as buyers read your listing."}
          </p>
        </div>
      </div>

      <UploadNavigation onContinue={validate} />
    </UploadStepLayout>
  );
}
