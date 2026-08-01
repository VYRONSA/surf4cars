"use client";

import Link from "next/link";

import { PageContainer } from "@/components/shell/page/page-container";
import { Icon } from "@/components/ui/icons";
import { ArrowLeft, Check } from "@/components/ui/icons/registry";
import { UploadAiPanel } from "@/features/vehicle-upload/components/upload-ai-panel";
import {
  UploadLivePreview,
  UploadPhonePreviewDock,
  UploadResponsivePreviewStrip,
} from "@/features/vehicle-upload/components/upload-live-preview";
import { UploadProgress } from "@/features/vehicle-upload/components/upload-progress";
import { UploadWizard } from "@/features/vehicle-upload/components/upload-wizard";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import { cn } from "@/utils";

export function VehicleUploadPage() {
  return (
    <PageContainer variant="workspace" className={uploadPolish.page}>
      <div className={uploadPolish.glow} aria-hidden />
      <VehicleUploadContent />
    </PageContainer>
  );
}

function VehicleUploadContent() {
  const { lastSavedAt, isSaving, isSuccessStep, editingVehicleId } = useUploadWizard();

  if (isSuccessStep) {
    return <UploadWizard />;
  }

  return (
    <>
      <header className={cn(uploadPolish.glassCard, "p-6 lg:p-8")}>
        <span className="sr-only" data-testid="builder-ready-marker">Step 1 of 7</span>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/dealer/inventory"
              className="mb-4 inline-flex items-center gap-1.5 text-[length:var(--text-body-sm)] font-medium text-[var(--color-muted-foreground)] motion-nav hover:text-[var(--color-primary-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-[var(--radius-sm)]"
            >
              <Icon icon={ArrowLeft} size="sm" aria-hidden />
              Back to Inventory
            </Link>
            <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
              Dealer Platform
            </p>
            <h1 className="mt-1 text-[length:var(--text-h3)] font-semibold tracking-[var(--tracking-heading)] lg:text-[length:var(--text-h2)]">
              {editingVehicleId ? "Edit Inventory Listing" : "AI Vehicle Listing Builder"}
            </h1>
            <p className="mt-2 max-w-2xl text-[length:var(--text-body-sm)] leading-[var(--leading-relaxed)] text-[var(--color-muted-foreground)] lg:text-[length:var(--text-body-md)]">
              {editingVehicleId
                ? "Update an existing inventory listing with the same AI-assisted builder and publish workflow."
                : "The fastest guided workflow in South Africa to create, validate, enrich, and publish inventory-ready listings."}
            </p>
          </div>
          {lastSavedAt && (
            <div
              className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-success)]/25 bg-[var(--color-success-muted)] px-4 py-2.5"
              aria-live="polite"
            >
              <Icon icon={Check} size="sm" tone="success" aria-hidden />
              <span className="text-[length:var(--text-body-sm)] font-medium text-[var(--color-success)]">
                {isSaving ? "Saving…" : "Draft saved automatically"}
              </span>
            </div>
          )}
        </div>
        <div className="mt-8">
          <UploadProgress />
        </div>
      </header>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <UploadResponsivePreviewStrip />
          <UploadWizard />
        </div>
        <div className="hidden xl:block">
          <UploadLivePreview />
        </div>
      </div>

      <UploadAiPanel />
      <UploadPhonePreviewDock />
    </>
  );
}
