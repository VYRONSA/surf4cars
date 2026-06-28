"use client";

import { memo } from "react";

import { Icon } from "@/components/ui/icons";
import { Sparkles } from "@/components/ui/icons/registry";
import { VehicleListingCard } from "@/features/search/components/vehicle-listing-card";
import { UPLOAD_FEATURE_OPTIONS } from "@/features/vehicle-upload/config/upload-features";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import { buildPreviewListing } from "@/features/vehicle-upload/utils/upload-preview";
import { cn } from "@/utils";

export const UploadLivePreview = memo(function UploadLivePreview() {
  const { data } = useUploadWizard();
  const listing = buildPreviewListing(data);

  return (
    <aside className={uploadPolish.previewPanel} aria-label="Live marketplace listing preview">
      <div className={uploadPolish.previewHeader}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
              Live Preview
            </p>
            <p className="mt-0.5 text-[length:var(--text-body-md)] font-semibold text-[var(--color-foreground)]">
              Marketplace listing
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-success)]/25 bg-[var(--color-success-muted)] px-3 py-1.5">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--color-success)] opacity-40" />
              <span className="relative inline-flex size-2 rounded-full bg-[var(--color-success)]" />
            </span>
            <span className="text-[length:var(--text-caption)] font-semibold text-[var(--color-success)]">Live</span>
          </div>
        </div>
        <p className="mt-2 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          Updates as you type — identical to search results
        </p>
      </div>

      <div className={cn(uploadPolish.previewBody, "transition-opacity duration-500")}>
        <VehicleListingCard listing={listing} className="shadow-[var(--shadow-floating)]" />

        {data.selectedFeatures.length > 0 && (
          <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4">
            <p className="mb-2 text-[length:var(--text-caption)] font-medium uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
              Selected features
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.selectedFeatures.slice(0, 5).map((id) => (
                <span
                  key={id}
                  className="rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)] px-2.5 py-1 text-[length:var(--text-caption)] text-[var(--color-foreground)]"
                >
                  {UPLOAD_FEATURE_OPTIONS.find((f) => f.id === id)?.label ?? id.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-secondary-muted)]/40 px-3 py-2">
          <Icon icon={Sparkles} size="xs" tone="primary" aria-hidden />
          <span className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
            AI Match {listing.aiMatchScore}% · Preview only
          </span>
        </div>
      </div>
    </aside>
  );
});
