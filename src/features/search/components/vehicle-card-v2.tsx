"use client";

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import {
  Bot,
  Calendar,
  Fuel,
  Gauge,
  GitCompare,
  Heart,
  MapPin,
  Share2,
  Store,
} from "@/components/ui/icons/registry";
import { Button } from "@/components/ui/button";
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

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-2xl)]",
        "border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/80",
        "motion-card hover:-translate-y-1 hover:border-[var(--color-border)] hover:shadow-[var(--shadow-hover)]",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-surface-sunken)]">
        {imageSlot ?? <CardMediaPlaceholder />}
        <CardBadges featured={featured} reducedPrice={reducedPrice} />
        <CardActions />
        <div className="absolute bottom-3 left-3 z-10">
          {dealerBadgeSlot ?? <DealerBadgePlaceholder />}
        </div>
      </div>

      <div className="space-y-3.5 p-5">
        {aiMatchSlot ?? <AiMatchPlaceholder />}
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
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            {aiMatchSlot ?? <AiMatchPlaceholder />}
            {titleSlot ?? <TextPlaceholder className="h-5 w-2/3" />}
            {dealerBadgeSlot ?? <DealerBadgePlaceholder inline />}
          </div>
          <CardActions compact />
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

function CardActions({ compact }: { readonly compact?: boolean }) {
  return (
    <div
      className={cn(
        "absolute flex gap-1",
        compact ? "relative z-10 shrink-0" : "right-3 top-3 z-10",
      )}
    >
      <CardIconButton icon={Heart} label="Favourite" />
      <CardIconButton icon={GitCompare} label="Compare" />
      <CardIconButton icon={Share2} label="Share" />
    </div>
  );
}

function CardIconButton({
  icon,
  label,
}: {
  readonly icon: typeof Heart;
  readonly label: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled
      aria-label={label}
      className="glass-subtle size-9 border border-[var(--color-glass-border)] bg-[var(--color-glass)]/80"
    >
      <Icon icon={icon} size="sm" tone="muted" />
    </Button>
  );
}

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

function AiMatchPlaceholder() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-secondary-muted)] px-2.5 py-1">
      <Icon icon={Bot} size="xs" tone="primary" aria-hidden />
      <span className="text-[length:var(--text-caption)] font-medium text-[var(--color-secondary)]">
        AI Match
      </span>
      <span className="h-3 w-8 rounded-[var(--radius-sm)] bg-[var(--color-secondary)]/20 motion-pulse-sfc" aria-hidden />
    </div>
  );
}

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
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
      <SpecItem icon={Calendar} slot={yearSlot} />
      <SpecItem icon={Gauge} slot={mileageSlot} />
      <SpecItem icon={Fuel} slot={fuelSlot} />
      <SpecItem icon={Gauge} slot={transmissionSlot} label="Transmission" />
    </div>
  );
}

function SpecItem({
  icon,
  slot,
  label,
}: {
  readonly icon: typeof Calendar;
  readonly slot?: ReactNode;
  readonly label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon icon={icon} size="xs" tone="muted" aria-hidden />
      {slot ?? (
        <span
          className="h-3 w-12 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc"
          aria-label={label}
        />
      )}
    </span>
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
