"use client";

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { MapPin, Store } from "@/components/ui/icons/registry";
import { cn } from "@/utils";

export interface VehicleCardV2Props {
  readonly imageSlot?: ReactNode;
  readonly dealerBadgeSlot?: ReactNode;
  readonly titleSlot?: ReactNode;
  readonly priceSlot?: ReactNode;
  readonly yearSlot?: ReactNode;
  readonly mileageSlot?: ReactNode;
  readonly transmissionSlot?: ReactNode;
  readonly fuelSlot?: ReactNode;
  readonly locationSlot?: ReactNode;
  readonly aiMatchSlot?: ReactNode;
  readonly featured?: boolean;
  readonly reducedPrice?: boolean;
  readonly layout?: "grid" | "list";
  readonly className?: string;
}

export function VehicleCardV2({
  imageSlot,
  dealerBadgeSlot,
  titleSlot,
  priceSlot,
  yearSlot,
  mileageSlot,
  transmissionSlot,
  fuelSlot,
  locationSlot,
  aiMatchSlot,
  featured,
  reducedPrice,
  layout = "grid",
  className,
}: VehicleCardV2Props) {
  if (layout === "list") {
    return (
      <VehicleCardV2List
        imageSlot={imageSlot}
        dealerBadgeSlot={dealerBadgeSlot}
        titleSlot={titleSlot}
        priceSlot={priceSlot}
        yearSlot={yearSlot}
        mileageSlot={mileageSlot}
        transmissionSlot={transmissionSlot}
        fuelSlot={fuelSlot}
        locationSlot={locationSlot}
        aiMatchSlot={aiMatchSlot}
        featured={featured}
        reducedPrice={reducedPrice}
        className={className}
      />
    );
  }

  /*
    Borderless.
    ==========
    Three cards across, each drawn as a bordered, raised, hover-lifting box, is what made a catalogue
    of real photography read as a grid of tiles. The border was doing no work the photograph's own
    edge does not do better — a 16:10 image on a dark page is already unambiguously an object — and
    twenty-four of them stacked into visible column rules down the page.
  */
  return (
    <article className={cn("group relative", className)}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-sunken)]">
        {imageSlot ?? <CardMediaPlaceholder />}
        <CardBadges featured={featured} reducedPrice={reducedPrice} />
        {/*
          The badge's width is bounded here, against the photograph, rather than by a `max-width` on
          the pill itself. A percentage max-width inside a shrink-to-fit absolute box resolves against
          a containing block whose width the pill is itself deciding, and the browser settles it by
          clipping: "Sunward Cars" measured 81px of text into a 72.7px box, so every dealership on the
          page was rendered mid-name — "Sunward …", "Crown Motor Comp…". Giving the wrapper a definite
          band and letting the pill fill it removes the circularity, and most names now fit whole.
        */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex">
          {dealerBadgeSlot ?? <DealerBadgePlaceholder />}
        </div>
      </div>

      <div className="space-y-2 pt-4">
        {aiMatchSlot}
        {titleSlot ?? <TextPlaceholder className="h-5 w-3/4" />}
        {priceSlot ?? <TextPlaceholder className="h-6 w-1/3" />}
        <SpecRow
          yearSlot={yearSlot}
          mileageSlot={mileageSlot}
          transmissionSlot={transmissionSlot}
          fuelSlot={fuelSlot}
        />
        {locationSlot ?? (
          <div className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
            <Icon icon={MapPin} size="xs" tone="muted" aria-hidden />
            <TextPlaceholder className="h-3 w-1/2" />
          </div>
        )}
      </div>
    </article>
  );
}

function VehicleCardV2List({
  imageSlot,
  dealerBadgeSlot,
  titleSlot,
  priceSlot,
  yearSlot,
  mileageSlot,
  transmissionSlot,
  fuelSlot,
  locationSlot,
  aiMatchSlot,
  featured,
  reducedPrice,
  className,
}: VehicleCardV2Props) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-[var(--radius-2xl)] sm:flex-row",
        "border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/60",
        "motion-card hover:border-[var(--color-border)] hover:shadow-[var(--shadow-hover)]",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[var(--color-surface-sunken)] sm:aspect-auto sm:w-72 lg:w-80">
        {imageSlot ?? <CardMediaPlaceholder />}
        <CardBadges featured={featured} reducedPrice={reducedPrice} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 lg:p-5">
        <div className="mb-3 min-w-0 flex-1 space-y-2">
          {aiMatchSlot}
          {titleSlot ?? <TextPlaceholder className="h-5 w-2/3" />}
          {dealerBadgeSlot ?? <DealerBadgePlaceholder inline />}
        </div>

        {priceSlot ?? <TextPlaceholder className="mb-3 h-6 w-1/4" />}
        <SpecRow
          yearSlot={yearSlot}
          mileageSlot={mileageSlot}
          transmissionSlot={transmissionSlot}
          fuelSlot={fuelSlot}
        />
        {locationSlot ?? (
          <div className="mt-3 flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
            <Icon icon={MapPin} size="xs" tone="muted" aria-hidden />
            <TextPlaceholder className="h-3 w-1/3" />
          </div>
        )}
      </div>
    </article>
  );
}

function CardBadges({
  featured,
  reducedPrice,
}: {
  readonly featured?: boolean;
  readonly reducedPrice?: boolean;
}) {
  if (!featured && !reducedPrice) return null;

  return (
    <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
      {featured && <Badge variant="primary">Featured</Badge>}
      {reducedPrice && <Badge variant="success">Reduced Price</Badge>}
    </div>
  );
}

/*
  Favourite, Compare and Share are gone from the card.
  ===================================================
  All three rendered `disabled`, in a glass pill, in the top-right corner of every photograph — the
  corner where a car's roofline usually is. Twenty-four listings meant seventy-two dead buttons on one
  page, each one an invitation the page then refused.

  Favouriting is real and it lives on the vehicle page, where a buyer has decided the car is worth
  keeping. Sharing is real and lives there too. Compare is not built. None of them belong on a tile
  whose only job is to make somebody want to click it.
*/

function DealerBadgePlaceholder({ inline }: { readonly inline?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)]",
        "border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/90 px-2.5 py-1",
        "text-[length:var(--text-caption)] text-[var(--color-muted-foreground)] backdrop-blur-sm",
        inline && "w-fit",
      )}
    >
      <Icon icon={Store} size="xs" tone="muted" aria-hidden />
      <span className="h-3 w-16 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
    </span>
  );
}

/**
 * Year, distance, fuel, transmission — as one line of type.
 *
 * Four pictograms in a row of four short facts is the densest thing on the card, and it was not even
 * an accurate legend: transmission was drawn with the speedometer icon already used for mileage, so
 * two different facts carried the same symbol. The icons were never doing the reading anyway —
 * "21 690 km" says mileage on its own, and "Automatic" says transmission.
 *
 * Slash separators instead, matching the homepage's editorial card, so the two card families finally
 * speak the same language where they show the same facts.
 */
function SpecRow({
  yearSlot,
  mileageSlot,
  transmissionSlot,
  fuelSlot,
}: {
  readonly yearSlot?: ReactNode;
  readonly mileageSlot?: ReactNode;
  readonly transmissionSlot?: ReactNode;
  readonly fuelSlot?: ReactNode;
}) {
  const items = [yearSlot, mileageSlot, fuelSlot, transmissionSlot].filter(Boolean);

  if (items.length === 0) {
    return <TextPlaceholder className="h-3 w-2/3" />;
  }

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
      {items.map((item, index) => (
        <span key={index} className="inline-flex items-center gap-2">
          {index > 0 && (
            <span aria-hidden className="text-[var(--color-border-strong)]">
              /
            </span>
          )}
          {item}
        </span>
      ))}
    </p>
  );
}

function CardMediaPlaceholder() {
  return (
    <div className="size-full bg-gradient-to-br from-[var(--color-surface-sunken)] to-[var(--color-surface)]" aria-hidden />
  );
}

function TextPlaceholder({ className }: { readonly className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc",
        className,
      )}
      aria-hidden
    />
  );
}
