"use client";

import { Icon } from "@/components/ui/icons";
import { ArrowLeft, ArrowRight, Download } from "@/components/ui/icons/registry";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import { cn } from "@/utils";

export interface UploadNavigationProps {
  readonly onContinue?: () => boolean | void;
  readonly continueLabel?: string;
  readonly showBack?: boolean;
  readonly validationError?: string | null;
  readonly className?: string;
}

export function UploadNavigation({
  onContinue,
  continueLabel = "Continue",
  showBack = true,
  validationError,
  className,
}: UploadNavigationProps) {
  const { prevStep, nextStep, isFirstStep, isLastStep, saveDraft, isSaving } = useUploadWizard();

  function handleContinue() {
    const canProceed = onContinue?.();
    if (canProceed === false) return;
    nextStep();
  }

  return (
    <div className={cn("mt-10 space-y-4", className)}>
      {validationError && (
        <p className={uploadPolish.validationBanner} role="alert">
          {validationError}
        </p>
      )}
      <div
        className={cn(
          "flex flex-col-reverse gap-3 border-t border-[var(--color-border-subtle)] pt-8 sm:flex-row sm:items-center sm:justify-between",
        )}
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {showBack && !isFirstStep && (
            <button type="button" onClick={prevStep} className={uploadPolish.secondaryButton}>
              <Icon icon={ArrowLeft} size="sm" aria-hidden />
              Previous
            </button>
          )}
          <button type="button" onClick={saveDraft} className={uploadPolish.secondaryButton}>
            <Icon icon={Download} size="sm" aria-hidden />
            {isSaving ? "Saving…" : "Save Draft"}
          </button>
        </div>

        {!isLastStep && (
          <button
            type="button"
            onClick={handleContinue}
            className={cn(uploadPolish.primaryButton, "w-full sm:w-auto sm:ml-auto")}
          >
            {continueLabel}
            <Icon icon={ArrowRight} size="sm" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
