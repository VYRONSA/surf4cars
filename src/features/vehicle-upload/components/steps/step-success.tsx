"use client";

import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import {
  CheckCircle2,
  Eye,
  Image,
  Plus,
  Share2,
  Sparkles,
  TrendingUp,
} from "@/components/ui/icons/registry";
import { uploadPolish } from "@/features/vehicle-upload/config/upload-shared";
import { useUploadWizard } from "@/features/vehicle-upload/context/upload-context";
import { buildPreviewListing } from "@/features/vehicle-upload/utils/upload-preview";
import { cn } from "@/utils";

const NEXT_ACTIONS = [
  { id: "photos", label: "Add more photos", icon: Image },
  { id: "boost", label: "Boost listing", icon: TrendingUp, href: "/dealer/marketing/campaigns" },
  { id: "share", label: "Share listing", icon: Share2 },
  { id: "view", label: "View live listing", icon: Eye, href: "/search" },
  { id: "new", label: "Create another listing", icon: Plus },
] as const;

export function StepSuccess() {
  const { publishScores, data, startNewListing } = useUploadWizard();
  const listing = buildPreviewListing(data);
  const scores = publishScores ?? { listingScore: 82, qualityScore: 78 };

  return (
    <div
      className={cn(uploadPolish.stepPanel, uploadPolish.stepTransition, "mx-auto max-w-2xl text-center")}
      role="status"
      aria-live="polite"
    >
      <div className="relative mx-auto mb-8 flex size-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-[var(--color-success-muted)]/50 motion-pulse" aria-hidden />
        <span className="relative flex size-24 items-center justify-center rounded-full bg-[var(--color-success-muted)] shadow-[var(--shadow-md)]">
          <Icon icon={CheckCircle2} size="xl" tone="success" aria-hidden />
        </span>
        <Icon icon={Sparkles} size="md" tone="accent" className="absolute -right-1 -top-1" aria-hidden />
      </div>

      <h2 className="text-[length:var(--text-h2)] font-semibold tracking-[var(--tracking-heading)]">
        Vehicle Published
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[length:var(--text-body-md)] leading-[var(--leading-relaxed)] text-[var(--color-muted-foreground)]">
        <span className="font-medium text-[var(--color-foreground)]">{listing.title}</span> is now live across
        your enabled SURF4CARS channels.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className={cn(uploadPolish.reviewCard, "text-left")}>
          <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
            Listing Score
          </p>
          <p className="mt-1 text-[length:var(--text-h2)] font-semibold text-[var(--color-primary)]">
            {scores.listingScore}%
          </p>
        </div>
        <div className={cn(uploadPolish.reviewCard, "text-left")}>
          <p className="text-[length:var(--text-overline)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
            AI Quality Score
          </p>
          <p className="mt-1 text-[length:var(--text-h2)] font-semibold text-[var(--color-secondary)]">
            {scores.qualityScore}%
          </p>
        </div>
      </div>

      <div className="mt-8 text-left">
        <p className="mb-3 text-[length:var(--text-body-sm)] font-semibold">Recommended next steps</p>
        <ul className="space-y-2">
          {NEXT_ACTIONS.map((action) => {
            const inner = (
              <>
                <Icon icon={action.icon} size="sm" tone="primary" aria-hidden />
                <span className="text-[length:var(--text-body-sm)] font-medium">{action.label}</span>
              </>
            );
            const cardClass = cn(
              uploadPolish.reviewCard,
              "flex items-center gap-3 px-4 py-3 text-left motion-hover hover:border-[var(--color-primary)]/30",
            );

            if (action.id === "new") {
              return (
                <li key={action.id}>
                  <button type="button" onClick={startNewListing} className={cn(cardClass, "w-full")}>
                    {inner}
                  </button>
                </li>
              );
            }

            if ("href" in action && action.href) {
              return (
                <li key={action.id}>
                  <Link href={action.href} className={cardClass}>
                    {inner}
                  </Link>
                </li>
              );
            }

            return (
              <li key={action.id}>
                <div className={cn(cardClass, "opacity-75")}>{inner}</div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/dealer/inventory" className={uploadPolish.primaryButton}>
          Return to Inventory
        </Link>
        <button type="button" onClick={startNewListing} className={uploadPolish.secondaryButton}>
          Create Another Listing
        </button>
      </div>
    </div>
  );
}
