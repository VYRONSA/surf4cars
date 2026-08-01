"use client";

import { Icon } from "@/components/ui/icons";
import { Check } from "@/components/ui/icons/registry";
import { UPLOAD_STEPS } from "@/features/vehicle-upload/types/upload.types";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import { cn } from "@/utils";

export function UploadProgress() {
  const { currentStepIndex, completedSteps, goToStep } = useUploadWizard();
  const progress = ((currentStepIndex + 1) / UPLOAD_STEPS.length) * 100;

  return (
    <nav className="w-full" aria-label="Upload wizard progress">
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)]">
          Step {currentStepIndex + 1} of {UPLOAD_STEPS.length}
        </span>
        <span className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          {UPLOAD_STEPS[currentStepIndex]?.label}
        </span>
      </div>

      <div
        className="relative h-2 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)]"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${Math.round(progress)} percent complete`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-[var(--radius-pill)] bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary)] to-[var(--color-secondary)] transition-[width] duration-700 ease-[var(--ease-premium)]"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 animate-shimmer-sfc bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ width: `${Math.min(progress, 100)}%` }}
          aria-hidden
        />
      </div>

      <ol className="mt-5 hidden gap-2 lg:grid lg:grid-cols-7">
        {UPLOAD_STEPS.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isComplete = completedSteps.includes(step.id);
          const isReachable = index <= currentStepIndex || isComplete;

          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!isReachable}
                onClick={() => isReachable && goToStep(step.id)}
                aria-current={isActive ? "step" : undefined}
                aria-label={`${step.label}${isComplete ? ", completed" : ""}${isActive ? ", current" : ""}`}
                className={cn(
                  "flex w-full flex-col items-center gap-2 rounded-[var(--radius-lg)] px-1 py-2",
                  "transition-all duration-300 ease-[var(--ease-premium)]",
                  isReachable && "cursor-pointer hover:bg-[var(--color-hover)]",
                  !isReachable && "cursor-default opacity-50",
                  isActive && "bg-[var(--color-primary-muted)]/50 ring-1 ring-[var(--color-primary)]/30",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-[length:var(--text-caption)] font-semibold transition-all duration-300",
                    isComplete && "bg-[var(--color-primary)] text-white",
                    isActive && !isComplete && "bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]",
                    !isActive && !isComplete && "bg-[var(--color-surface-sunken)] text-[var(--color-muted-foreground)]",
                  )}
                >
                  {isComplete ? (
                    <Icon icon={Check} size="xs" aria-hidden />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "truncate text-center text-[length:var(--text-caption)] font-medium",
                    isActive && "text-[var(--color-primary-text)]",
                    isComplete && !isActive && "text-[var(--color-foreground)]",
                    !isActive && !isComplete && "text-[var(--color-muted-foreground)]",
                  )}
                >
                  {step.shortLabel}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
