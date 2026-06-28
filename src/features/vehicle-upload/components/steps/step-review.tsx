"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Icon } from "@/components/ui/icons";
import {
  Car,
  CheckCircle2,
  Edit,
  Image as ImageIcon,
  Megaphone,
  Sparkles,
  Store,
  Tag,
} from "@/components/ui/icons/registry";
import { UploadStepLayout } from "@/features/vehicle-upload/components/upload-step-layout";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { UPLOAD_FEATURE_OPTIONS } from "@/features/vehicle-upload/config/upload-features";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import type { UploadStepId } from "@/features/vehicle-upload/types/upload.types";
import { buildPreviewListing, estimateProfit } from "@/features/vehicle-upload/utils/upload-preview";
import { cn } from "@/utils";

function formatCurrency(value: number): string {
  return `R ${value.toLocaleString("en-ZA")}`;
}

function ReviewRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--color-border-subtle)] py-2.5 last:border-0">
      <span className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{label}</span>
      <span className="text-right text-[length:var(--text-body-sm)] font-medium">{value}</span>
    </div>
  );
}

function ReviewCard({
  title,
  icon,
  stepId,
  onEdit,
  children,
}: {
  readonly title: string;
  readonly icon: typeof Car;
  readonly stepId: UploadStepId;
  readonly onEdit: (step: UploadStepId) => void;
  readonly children: ReactNode;
}) {
  return (
    <article className={uploadPolish.reviewCard}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary-muted)]">
            <Icon icon={icon} size="sm" tone="primary" aria-hidden />
          </span>
          <h4 className="text-[length:var(--text-body-md)] font-semibold">{title}</h4>
        </div>
        <button
          type="button"
          onClick={() => onEdit(stepId)}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] px-3 py-1.5 text-[length:var(--text-caption)] font-medium text-[var(--color-primary)] motion-hover hover:bg-[var(--color-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        >
          <Icon icon={Edit} size="xs" aria-hidden />
          Edit
        </button>
      </div>
      {children}
    </article>
  );
}

export function StepReview() {
  const router = useRouter();
  const { data, goToStep, saveDraft, completePublish, markStepComplete } = useUploadWizard();
  const listing = buildPreviewListing(data);
  const profit = estimateProfit(data);
  const primary = data.media.find((m) => m.isPrimary) ?? data.media[0];

  function handleSaveDraft() {
    markStepComplete();
    saveDraft();
    router.push("/dealer/inventory");
  }

  function handlePublish() {
    completePublish();
  }

  const vehicleTitle =
    [data.identification.year, data.identification.make, data.identification.model, data.identification.variant]
      .filter(Boolean)
      .join(" ") || "Your vehicle";

  return (
    <UploadStepLayout stepId="review">
      <div className="mb-8 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-gradient-to-br from-[var(--color-primary-muted)]/20 to-transparent p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="relative aspect-[16/10] w-full max-w-xs overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-sunken)] shadow-[var(--shadow-md)] lg:shrink-0">
            {primary ? (
              <Image src={primary.previewUrl} alt={vehicleTitle} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-[var(--color-muted-foreground)]">
                <Icon icon={ImageIcon} size="lg" tone="muted" aria-hidden />
                <span className="text-[length:var(--text-caption)]">No hero image</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-primary)]">
              Ready to publish
            </p>
            <h3 className="mt-1 text-[length:var(--text-h3)] font-semibold tracking-[var(--tracking-heading)]">
              {vehicleTitle}
            </h3>
            <p className="mt-2 text-[length:var(--text-h4)] font-semibold text-[var(--color-primary)]">{listing.price}</p>
            <p className="mt-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              Stock #{data.identification.stockNumber || "—"} · {data.specifications.mileage || "—"} km · {data.specifications.fuel}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ReviewCard title="Vehicle" icon={Car} stepId="identification" onEdit={goToStep}>
          <ReviewRow label="Make / Model" value={`${data.identification.make || "—"} ${data.identification.model || ""}`.trim()} />
          <ReviewRow label="Variant" value={data.identification.variant || "—"} />
          <ReviewRow label="Year" value={data.identification.year || "—"} />
          <ReviewRow label="Condition" value={data.identification.condition.replace(/-/g, " ")} />
          <ReviewRow label="VIN" value={data.identification.vin || "—"} />
        </ReviewCard>

        <ReviewCard title="Pricing" icon={Tag} stepId="pricing" onEdit={goToStep}>
          <ReviewRow label="List price" value={listing.price} />
          {profit !== null && <ReviewRow label="Est. profit" value={formatCurrency(profit)} />}
          <ReviewRow label="Finance" value={data.pricing.financeAvailable ? "Available" : "Not offered"} />
          <ReviewRow label="Trade-in" value={data.pricing.tradeInAccepted ? "Accepted" : "Not accepted"} />
        </ReviewCard>

        <ReviewCard title="Specifications" icon={Car} stepId="specifications" onEdit={goToStep}>
          <ReviewRow label="Mileage" value={`${data.specifications.mileage || "—"} km`} />
          <ReviewRow label="Transmission" value={data.specifications.transmission} />
          <ReviewRow label="Fuel" value={data.specifications.fuel} />
          <ReviewRow label="Body" value={data.specifications.bodyType} />
          <ReviewRow label="Colour" value={data.specifications.colour || "—"} />
        </ReviewCard>

        <ReviewCard title="Features" icon={Sparkles} stepId="features" onEdit={goToStep}>
          <p className="text-[length:var(--text-body-sm)] leading-[var(--leading-relaxed)] text-[var(--color-muted-foreground)]">
            {data.selectedFeatures.length === 0
              ? "No features selected yet"
              : data.selectedFeatures
                  .map((id) => UPLOAD_FEATURE_OPTIONS.find((f) => f.id === id)?.label ?? id)
                  .join(" · ")}
          </p>
        </ReviewCard>

        <ReviewCard title="Media" icon={ImageIcon} stepId="media" onEdit={goToStep}>
          <ReviewRow label="Photos uploaded" value={String(data.media.length)} />
          <ReviewRow label="Hero image" value={primary?.name ?? "Not set"} />
        </ReviewCard>

        <ReviewCard title="Publishing" icon={Megaphone} stepId="publishing" onEdit={goToStep}>
          <ReviewRow label="Mode" value={data.publishing.mode.replace(/-/g, " ")} />
          <ReviewRow
            label="Channels"
            value={
              [
                data.publishing.marketplace && "Marketplace",
                data.publishing.dealerWebsite && "Dealer Website",
                data.publishing.featuredListing && "Featured",
              ]
                .filter(Boolean)
                .join(", ") || "None selected"
            }
          />
        </ReviewCard>

        <ReviewCard title="Dealer" icon={Store} stepId="identification" onEdit={goToStep}>
          <ReviewRow label="Stock number" value={data.identification.stockNumber || "—"} />
          <ReviewRow label="Registration" value={data.identification.registration || "—"} />
        </ReviewCard>
      </div>

      {data.description && (
        <div className={cn(uploadPolish.reviewCard, "mt-4")}>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-[length:var(--text-body-md)] font-semibold">Description</h4>
            <button type="button" onClick={() => goToStep("description")} className="text-[length:var(--text-caption)] font-medium text-[var(--color-primary)]">
              Edit
            </button>
          </div>
          <p className="text-[length:var(--text-body-sm)] leading-[var(--leading-relaxed)] text-[var(--color-muted-foreground)] line-clamp-4">
            {data.description}
          </p>
        </div>
      )}

      <div className="mt-10 flex flex-col gap-3 border-t border-[var(--color-border-subtle)] pt-10 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={handleSaveDraft} className={uploadPolish.secondaryButton}>
          Save Draft
        </button>
        <button
          type="button"
          onClick={handlePublish}
          className={cn(uploadPolish.primaryButton, "gap-2 sm:ml-auto")}
        >
          <Icon icon={CheckCircle2} size="sm" aria-hidden />
          Publish Listing
        </button>
      </div>

      <p className="mt-6 text-center text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
        <Link href="/dealer/inventory" className="text-[var(--color-primary)] underline-offset-2 hover:underline">
          Return to inventory
        </Link>
        {" "}without publishing
      </p>
    </UploadStepLayout>
  );
}
