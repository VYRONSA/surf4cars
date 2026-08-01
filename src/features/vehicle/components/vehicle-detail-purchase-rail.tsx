import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight, BadgeCheck, MessageCircle, Phone } from "@/components/ui/icons/registry";
import { VehicleDetailSaveShare } from "@/features/vehicle/components/vehicle-detail-save-share";
import type { VehicleDetail } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

/**
 * The purchase rail.
 *
 * It replaces a 420px glass panel that carried the title, the price, six icon-labelled
 * specifications, availability, location, three enquiry-type tabs, four form fields, two call
 * buttons, a submit button and three action buttons — stacked beside the photograph, above the fold.
 *
 * The title, price and specification have moved into the photograph itself, where a buyer reads them
 * against the car rather than beside it. The enquiry form has moved to `#enquiry`, further down. What
 * a rail should hold is what a buyer wants at any point while scrolling: the price so they do not
 * lose it, who is selling, and the shortest path to a human. That is all this is.
 */

export interface VehicleDetailPurchaseRailProps {
  readonly vehicle: VehicleDetail;
  readonly className?: string;
}

export function VehicleDetailPurchaseRail({ vehicle, className }: VehicleDetailPurchaseRailProps) {
  const { dealer } = vehicle;

  return (
    <aside
      className={cn(
        "rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/60 p-6 backdrop-blur-md",
        className,
      )}
      aria-label="Purchase this vehicle"
    >
      {/*
        The price block is desktop-only.
        ===============================
        Below `lg` this panel sits directly under the showcase, which has just set the same price at
        display size against the photograph. Repeating it two hundred pixels later adds nothing and
        pushes the buttons — the reason the panel is there at all — below the fold on a phone.
      */}
      <div className="hidden lg:block">
        <p className="text-[length:var(--text-h3)] font-semibold tabular-nums tracking-[-0.02em] text-[var(--color-foreground)]">
          {vehicle.price}
        </p>
        <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          {vehicle.monthlyRepayment} / month · {vehicle.financeEstimate}
        </p>
      </div>

      <p className="text-[length:var(--text-body-sm)] text-[var(--color-success)] lg:mt-4">
        {vehicle.availability}
      </p>

      <div className="mt-6 space-y-2.5">
        <a
          href="#enquiry"
          className={cn(
            "motion-button flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)]",
            "bg-[var(--color-primary)] px-5 text-[length:var(--text-button)] font-semibold text-white",
            "hover:bg-[var(--color-primary-hover)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
          )}
        >
          Enquire about this vehicle
        </a>

        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={`tel:${dealer.phone}`}
            className="motion-button inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border-interactive)] text-[length:var(--text-body-sm)] font-medium hover:border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            <Icon icon={Phone} aria-hidden className="size-4" />
            Call
          </a>
          <a
            href={`https://wa.me/${dealer.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="motion-button inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border-interactive)] text-[length:var(--text-body-sm)] font-medium hover:border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            <Icon icon={MessageCircle} aria-hidden className="size-4" />
            WhatsApp
          </a>
        </div>
      </div>

      {/* Who is selling it, as a line rather than as a card. The full dealer section is below. */}
      <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5">
        <Link
          href={`/dealers/${dealer.slug}`}
          className="motion-nav group flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)]">
              <span className="truncate">{dealer.name}</span>
              {dealer.verified && (
                <Icon
                  icon={BadgeCheck}
                  aria-label="Verified dealer"
                  className="size-3.5 shrink-0 text-[var(--color-success)]"
                />
              )}
            </span>
            <span className="mt-0.5 block text-[length:var(--text-caption)] text-[var(--color-muted)]">
              {vehicle.location}
            </span>
          </span>
          <Icon
            icon={ArrowRight}
            aria-hidden
            className="size-4 shrink-0 text-[var(--color-muted)] transition-transform motion-hover group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <VehicleDetailSaveShare vehicle={vehicle} className="mt-5" />
    </aside>
  );
}
