"use client";

import * as iconRegistry from "@/components/ui/icons/registry";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Sparkles } from "@/components/ui/icons/registry";
import { UploadNavigation } from "@/features/vehicle-upload/components/upload-navigation";
import { UPLOAD_FEATURE_OPTIONS } from "@/features/vehicle-upload/config/upload-features";
import { UploadStepLayout } from "@/features/vehicle-upload/components/upload-step-layout";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";

export function StepFeatures() {
  const {
    data,
    markStepComplete,
    runSurfIntelligenceReview,
    toggleFeature,
  } = useUploadWizard();

  const isSurfReviewBusy = data.intelligenceReview.status === "pending";

  const featureGroups = UPLOAD_FEATURE_OPTIONS.reduce<Record<string, typeof UPLOAD_FEATURE_OPTIONS>>((groups, option) => {
    const current = groups[option.category] ?? [];
    groups[option.category] = [...current, option];
    return groups;
  }, {});

  function validate() {
    markStepComplete();
    return true;
  }

  return (
    <UploadStepLayout stepId="features">
      <div className={uploadPolish.formStack}>
        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[length:var(--text-body-md)] font-semibold">Features & Options</p>
              <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                Select buyer-facing features that should flow into description, readiness, and preview quality.
              </p>
            </div>
            <p className="rounded-[var(--radius-pill)] bg-[var(--color-primary-muted)]/30 px-3 py-1 text-[length:var(--text-caption)] font-medium text-[var(--color-primary-text)]">
              {data.selectedFeatures.length} selected
            </p>
          </div>

          <div className="mt-5 space-y-5">
            {Object.entries(featureGroups).map(([category, options]) => (
              <div key={category} className="space-y-3">
                <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
                  {category}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {options.map((option) => {
                    const RegistryIcon = iconRegistry[option.icon as keyof typeof iconRegistry];
                    const selected = data.selectedFeatures.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleFeature(option.id)}
                        className={`flex items-start gap-3 rounded-[var(--radius-lg)] border px-4 py-3 text-left transition-colors ${
                          selected
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)]/25 text-[var(--color-primary-text)]"
                            : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:border-[var(--color-border)] hover:bg-[var(--color-hover)]"
                        }`}
                      >
                        {RegistryIcon ? <Icon icon={RegistryIcon} size="sm" tone={selected ? "primary" : "muted"} aria-hidden /> : null}
                        <span>
                          <span className="block text-[length:var(--text-body-sm)] font-medium">{option.label}</span>
                          <span className="mt-1 block text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                            Include this in the buyer-facing listing output.
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/35 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[length:var(--text-body-md)] font-semibold">SURF Intelligence Review</p>
              <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                Listing quality, missing information, missing photos, and dealer recommendations.
              </p>
            </div>
            <Button type="button" onClick={() => void runSurfIntelligenceReview()} disabled={isSurfReviewBusy}>
              <Icon icon={Sparkles} size="xs" aria-hidden />
              {isSurfReviewBusy ? "Running Review..." : "Run SURF Review"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
              Listing Quality
            </p>
            <p className="mt-1 text-[length:var(--text-h4)] font-semibold">
              {data.intelligenceReview.qualityScore}/100
            </p>
          </article>

          <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
              Review Status
            </p>
            <p className="mt-1 text-[length:var(--text-body-md)] font-medium">
              {data.intelligenceReview.status === "complete" ? "Complete" : "Awaiting AI analysis"}
            </p>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <h4 className="text-[length:var(--text-body-md)] font-semibold">Missing Information</h4>
            <ul className="mt-2 space-y-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              {data.intelligenceReview.missingInformation.length === 0 ? (
                <li>None detected.</li>
              ) : (
                data.intelligenceReview.missingInformation.map((item) => <li key={item}>{item}</li>)
              )}
            </ul>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <h4 className="text-[length:var(--text-body-md)] font-semibold">Missing Photos</h4>
            <ul className="mt-2 space-y-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              {data.intelligenceReview.missingPhotos.length === 0 ? (
                <li>No missing angles detected.</li>
              ) : (
                data.intelligenceReview.missingPhotos.map((item) => <li key={item}>{item}</li>)
              )}
            </ul>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
            <h4 className="text-[length:var(--text-body-md)] font-semibold">Recommended Improvements</h4>
            <ul className="mt-2 space-y-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              {data.intelligenceReview.suggestedImprovements.length === 0 ? (
                <li>Awaiting AI analysis</li>
              ) : (
                data.intelligenceReview.suggestedImprovements.map((item) => <li key={item}>{item}</li>)
              )}
            </ul>
          </section>
        </div>
      </div>

      <UploadNavigation onContinue={validate} continueLabel="Continue to Description Builder" />
    </UploadStepLayout>
  );
}
