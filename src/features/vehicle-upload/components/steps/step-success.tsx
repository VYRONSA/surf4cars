"use client";

import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { CheckCircle2, Plus } from "@/components/ui/icons/registry";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import { resolveListingTitle } from "@/features/vehicle-upload/utils/listing-summary";
import { cn } from "@/utils";

export function StepSuccess() {
  const { publishScores, data, startNewListing } = useUploadWizard();
  const scores = publishScores ?? { listingScore: 0, qualityScore: 0 };

  const title = resolveListingTitle(data) || "Vehicle listing";

  return (
    <div
      className={cn(uploadPolish.stepPanel, uploadPolish.stepTransition, "mx-auto max-w-2xl text-center")}
      role="status"
      aria-live="polite"
    >
      <div className="relative mx-auto mb-8 flex size-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-[var(--color-success-muted)]/50" aria-hidden />
        <span className="relative flex size-24 items-center justify-center rounded-full bg-[var(--color-success-muted)] shadow-[var(--shadow-md)]">
          <Icon icon={CheckCircle2} size="xl" tone="success" aria-hidden />
        </span>
      </div>

      <h2 className="text-[length:var(--text-h2)] font-semibold tracking-[var(--tracking-heading)]">
        Listing Workflow Complete
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[length:var(--text-body-md)] leading-[var(--leading-relaxed)] text-[var(--color-muted-foreground)]">
        <span className="font-medium text-[var(--color-foreground)]">{title}</span> has been processed through
        AI Vehicle Listing Builder and written into Inventory Intelligence.
      </p>

      <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
        {data.publishResult.message}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className={cn(uploadPolish.reviewCard, "text-left")}>
          <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
            Listing Score
          </p>
          <p className="mt-1 text-[length:var(--text-h2)] font-semibold text-[var(--color-primary-text)]">
            {scores.listingScore}%
          </p>
        </div>
        <div className={cn(uploadPolish.reviewCard, "text-left")}>
          <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
            Quality Score
          </p>
          <p className="mt-1 text-[length:var(--text-h2)] font-semibold text-[var(--color-secondary)]">
            {scores.qualityScore}%
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/dealer/inventory" className={uploadPolish.primaryButton}>
          Return to Inventory
        </Link>
        <button type="button" onClick={startNewListing} className={uploadPolish.secondaryButton}>
          <Icon icon={Plus} size="sm" aria-hidden />
          Create Another Listing
        </button>
      </div>
    </div>
  );
}
