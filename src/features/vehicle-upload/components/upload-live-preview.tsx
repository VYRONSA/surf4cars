"use client";

import { memo } from "react";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { LayoutDashboard, LayoutGrid, PanelLeft, Smartphone, Wand2 } from "@/components/ui/icons/registry";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import { buildPreviewListing } from "@/features/vehicle-upload/utils/upload-preview";

export const UploadLivePreview = memo(function UploadLivePreview() {
  const { data } = useUploadWizard();
  const listing = buildPreviewListing(data);
  const primary = listing.imageSrc;

  return (
    <aside className={uploadPolish.previewPanel} aria-label="Listing preview">
      <div className={uploadPolish.previewHeader}>
        <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
          Live Preview
        </p>
        <p className="mt-0.5 text-[length:var(--text-body-md)] font-semibold">AI Vehicle Listing Builder</p>
      </div>

      <div className="space-y-4 p-4">
        <PreviewFrame mode="desktop" title={listing.title} price={listing.price} mileage={listing.mileage} imageSrc={primary} />
        <PreviewFrame mode="tablet" title={listing.title} price={listing.price} mileage={listing.mileage} imageSrc={primary} />
        <PreviewFrame mode="phone" title={listing.title} price={listing.price} mileage={listing.mileage} imageSrc={primary} />

        <div className="grid grid-cols-2 gap-2 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-2">
            Quality: {data.intelligenceReview.qualityScore}/100
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-2">
            Photos: {data.media.length}
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-2">
            OCR: {data.licenceDisc.analysisStatus}
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-2">
            Pricing: {data.pricingWorkspace.confidence}
          </div>
        </div>
      </div>
    </aside>
  );
});

export const UploadResponsivePreviewStrip = memo(function UploadResponsivePreviewStrip() {
  const { data } = useUploadWizard();
  const listing = buildPreviewListing(data);

  return (
    <section className="grid gap-4 lg:grid-cols-2 xl:hidden" aria-label="Responsive listing previews">
      <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/80 p-4 shadow-[var(--shadow-sm)] backdrop-blur-sm md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Icon icon={PanelLeft} size="sm" tone="primary" aria-hidden />
          <div>
            <p className="text-[length:var(--text-body-sm)] font-semibold">Tablet Preview</p>
            <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Touch-first layout for showroom tablets.</p>
          </div>
        </div>
        <PreviewFrame mode="tablet" title={listing.title} price={listing.price} mileage={listing.mileage} imageSrc={listing.imageSrc} />
      </div>

      <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/80 p-4 shadow-[var(--shadow-sm)] backdrop-blur-sm md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Icon icon={Smartphone} size="sm" tone="primary" aria-hidden />
          <div>
            <p className="text-[length:var(--text-body-sm)] font-semibold">Phone Preview</p>
            <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Premium native-style buyer card and swipe gallery.</p>
          </div>
        </div>
        <PreviewFrame mode="phone" title={listing.title} price={listing.price} mileage={listing.mileage} imageSrc={listing.imageSrc} />
      </div>
    </section>
  );
});

export const UploadPhonePreviewDock = memo(function UploadPhonePreviewDock() {
  const { data } = useUploadWizard();
  const listing = buildPreviewListing(data);
  const photos = data.media.filter((item) => item.kind === "photo");

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 md:hidden">
      <details className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/95 shadow-[var(--shadow-floating)] backdrop-blur-xl">
        <summary className="flex list-none items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">Phone Preview</p>
            <p className="text-[length:var(--text-body-sm)] font-semibold">{listing.title || "Listing preview"}</p>
          </div>
          <Button type="button" size="sm" className="pointer-events-none gap-2">
            <Icon icon={Wand2} size="xs" aria-hidden />
            Open Preview
          </Button>
        </summary>
        <div className="space-y-4 border-t border-[var(--color-border-subtle)] px-4 py-4">
          <div className="flex snap-x gap-3 overflow-x-auto pb-1">
            {(photos.length > 0 ? photos : [{ id: "placeholder", previewUrl: listing.imageSrc, name: listing.title }]).map((item) => (
              <div key={item.id} className="relative aspect-[9/12] min-w-[72%] snap-center overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]">
                {item.previewUrl ? (
                  <Image src={item.previewUrl} alt={item.name} fill className="object-cover" unoptimized />
                ) : null}
              </div>
            ))}
          </div>
          <div className="rounded-[var(--radius-2xl)] bg-[var(--color-surface)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Icon icon={LayoutGrid} size="sm" tone="primary" aria-hidden />
              <p className="text-[length:var(--text-body-sm)] font-semibold">Premium Phone Presentation</p>
            </div>
            <p className="text-[length:var(--text-body-md)] font-semibold">{listing.title}</p>
            <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{listing.price} · {listing.mileage}</p>
          </div>
        </div>
      </details>
    </div>
  );
});

function PreviewFrame({
  mode,
  title,
  price,
  mileage,
  imageSrc,
}: {
  readonly mode: "desktop" | "tablet" | "phone";
  readonly title: string;
  readonly price: string;
  readonly mileage: string;
  readonly imageSrc: string;
}) {
  const icon = mode === "desktop" ? LayoutDashboard : mode === "tablet" ? PanelLeft : Smartphone;
  const aspect = mode === "phone" ? "aspect-[9/16]" : mode === "tablet" ? "aspect-[4/3]" : "aspect-[16/10]";

  return (
    <article className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon icon={icon} size="xs" tone="muted" aria-hidden />
        <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">{mode}</p>
      </div>
      <div className={`overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] ${aspect}`}>
        <div className="relative h-[58%] bg-[var(--color-surface-sunken)]">
          {imageSrc ? <Image src={imageSrc} alt={title} fill className="object-cover" unoptimized /> : null}
        </div>
        <div className="space-y-2 p-4">
          <p className="line-clamp-2 text-[length:var(--text-body-sm)] font-semibold">{title}</p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{price} · {mileage}</p>
          <div className="grid grid-cols-2 gap-2 text-[length:var(--text-caption)]">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] px-3 py-2">Finance ready</div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] px-3 py-2">AI enriched</div>
          </div>
        </div>
      </div>
    </article>
  );
}
