"use client";

import { useOnboarding } from "@/features/dealer-onboarding/context/onboarding-context";
import { Text } from "@/components/ui/typography";

export function BrandingPreviewCard() {
  const { data } = useOnboarding();
  const { branding, dealership } = data;
  const displayName = dealership.tradingName || dealership.businessName || "Your Dealership";

  return (
    <article
      className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-md)]"
      aria-label="Brand preview"
    >
      <div
        className="relative aspect-[21/9] overflow-hidden bg-[var(--color-surface-sunken)]"
        style={{
          backgroundColor: branding.secondaryColor,
          backgroundImage: branding.coverPreview
            ? `url(${branding.coverPreview})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!branding.coverPreview && (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`,
            }}
            aria-hidden
          />
        )}
      </div>

      <div className="relative bg-[var(--color-surface-raised)] p-5">
        <div className="absolute -top-8 left-5 flex size-16 items-center justify-center overflow-hidden rounded-[var(--radius-xl)] border-4 border-[var(--color-surface-raised)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
          {branding.logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoPreview}
              alt=""
              className="size-full object-contain p-1"
            />
          ) : (
            <span
              className="text-xl font-bold"
              style={{ color: branding.primaryColor }}
              aria-hidden
            >
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="pt-8">
          <Text variant="h5" as="h3">
            {displayName}
          </Text>
          <Text variant="body-sm" tone="muted" className="mt-1">
            {dealership.city && dealership.province
              ? `${dealership.city}, ${dealership.province}`
              : "Location preview"}
          </Text>

          <div className="mt-4 flex gap-2">
            <span
              className="h-2 w-12 rounded-[var(--radius-pill)]"
              style={{ backgroundColor: branding.primaryColor }}
              aria-label="Primary brand colour"
            />
            <span
              className="h-2 w-12 rounded-[var(--radius-pill)]"
              style={{ backgroundColor: branding.secondaryColor }}
              aria-label="Secondary brand colour"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
