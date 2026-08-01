"use client";

import type { ReactNode } from "react";

import { UPLOAD_STEP_COPY } from "@/features/vehicle-upload/config/upload-step-copy";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import { UPLOAD_STEPS } from "@/features/vehicle-upload/types/upload.types";
import { cn } from "@/utils";

export interface UploadStepLayoutProps {
  readonly stepId?: keyof typeof UPLOAD_STEP_COPY;
  readonly title?: string;
  readonly description?: string;
  readonly why?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export function UploadStepLayout({
  stepId,
  title,
  description,
  why,
  children,
  className,
}: UploadStepLayoutProps) {
  const { currentStepIndex } = useUploadWizard();
  const copy = stepId ? UPLOAD_STEP_COPY[stepId] : null;
  const resolvedTitle = title ?? copy?.title ?? "";
  const resolvedDescription = description ?? copy?.description;
  const resolvedWhy = why ?? copy?.why;

  return (
    <div
      className={cn(uploadPolish.stepPanel, uploadPolish.stepTransition, className)}
      aria-labelledby="upload-step-title"
    >
      <header className="border-b border-[var(--color-border-subtle)] pb-8">
        <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-primary-text)]">
          Step {currentStepIndex + 1} of {UPLOAD_STEPS.length}
        </p>
        <h2 id="upload-step-title" className={cn(uploadPolish.stepHero, "mt-2")}>
          {resolvedTitle}
        </h2>
        {resolvedDescription && (
          <p className={uploadPolish.stepDescription}>{resolvedDescription}</p>
        )}
        {resolvedWhy && (
          <p className={uploadPolish.stepWhy}>
            <span className="font-medium text-[var(--color-primary-text)]">Why this matters — </span>
            {resolvedWhy}
          </p>
        )}
      </header>
      <div className="mt-8 lg:mt-10">{children}</div>
    </div>
  );
}
