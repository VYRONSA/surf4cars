import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps,
} from "@/components/ui/card";
import { cn } from "@/utils";

function CardMediaSlot({
  aspect = "16/10",
  children,
  className,
}: {
  readonly aspect?: string;
  readonly children?: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden bg-[var(--color-surface-sunken)]",
        className,
      )}
      style={{ aspectRatio: aspect }}
    >
      {children ?? (
        <div className="size-full border border-dashed border-[var(--color-border)]" aria-hidden />
      )}
    </div>
  );
}

function CardTextSlot({
  width = "full",
  className,
}: {
  readonly width?: "full" | "3/4" | "2/3" | "1/2" | "1/3" | "1/4";
  readonly className?: string;
}) {
  const widthClass =
    width === "3/4"
      ? "w-3/4"
      : width === "2/3"
        ? "w-2/3"
        : width === "1/2"
          ? "w-1/2"
          : width === "1/3"
            ? "w-1/3"
            : width === "1/4"
              ? "w-1/4"
              : "w-full";

  return (
    <div
      className={cn(
        "h-4 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc",
        widthClass,
        className,
      )}
      aria-hidden
    />
  );
}

export interface PublicVehicleCardProps extends CardProps {
  readonly imageSlot?: ReactNode;
  readonly titleSlot?: ReactNode;
  readonly subtitleSlot?: ReactNode;
  readonly specsSlot?: ReactNode;
  readonly priceSlot?: ReactNode;
  readonly badgeSlot?: ReactNode;
  readonly footerSlot?: ReactNode;
}

export function PublicVehicleCard({
  imageSlot,
  titleSlot,
  subtitleSlot,
  specsSlot,
  priceSlot,
  badgeSlot,
  footerSlot,
  className,
  ...props
}: PublicVehicleCardProps) {
  return (
    <Card interactive padding="none" className={cn("overflow-hidden", className)} {...props}>
      <div className="relative">
        <CardMediaSlot>{imageSlot}</CardMediaSlot>
        {badgeSlot && <div className="absolute left-3 top-3">{badgeSlot}</div>}
      </div>
      <div className="p-4">
        <CardHeader className="space-y-2 pb-2">
          {titleSlot ?? <CardTextSlot width="3/4" className="h-5" />}
          {subtitleSlot ?? <CardTextSlot width="1/2" className="h-3" />}
        </CardHeader>
        <CardContent className="space-y-2 pb-2">
          {specsSlot ?? (
            <div className="flex gap-2">
              <CardTextSlot width="1/3" />
              <CardTextSlot width="1/3" />
            </div>
          )}
        </CardContent>
        {priceSlot ?? <CardTextSlot width="1/3" className="h-5 px-4 pb-2" />}
        {footerSlot && <CardFooter className="pt-2">{footerSlot}</CardFooter>}
      </div>
    </Card>
  );
}

export interface PublicDealerCardProps extends CardProps {
  readonly logoSlot?: ReactNode;
  readonly nameSlot?: ReactNode;
  readonly locationSlot?: ReactNode;
  readonly statsSlot?: ReactNode;
  readonly verifiedSlot?: ReactNode;
  readonly footerSlot?: ReactNode;
}

export function PublicDealerCard({
  logoSlot,
  nameSlot,
  locationSlot,
  statsSlot,
  verifiedSlot,
  footerSlot,
  className,
  ...props
}: PublicDealerCardProps) {
  return (
    <Card interactive className={className} {...props}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)]">
            {logoSlot ?? <div className="size-8 rounded-[var(--radius-md)] bg-[var(--color-border-subtle)]" aria-hidden />}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              {nameSlot ?? <CardTextSlot width="3/4" className="h-5" />}
              {verifiedSlot}
            </div>
            {locationSlot ?? <CardTextSlot width="1/2" className="h-3" />}
          </div>
        </div>
      </CardHeader>
      {statsSlot && <CardContent>{statsSlot}</CardContent>}
      {footerSlot && <CardFooter>{footerSlot}</CardFooter>}
    </Card>
  );
}

export interface PublicCollectionCardProps extends CardProps {
  readonly imageSlot?: ReactNode;
  readonly titleSlot?: ReactNode;
  readonly descriptionSlot?: ReactNode;
  readonly countSlot?: ReactNode;
}

export function PublicCollectionCard({
  imageSlot,
  titleSlot,
  descriptionSlot,
  countSlot,
  className,
  ...props
}: PublicCollectionCardProps) {
  return (
    <Card interactive padding="none" className={cn("overflow-hidden", className)} {...props}>
      <CardMediaSlot aspect="16/9">{imageSlot}</CardMediaSlot>
      <div className="p-4 space-y-2">
        {titleSlot ?? <CardTextSlot width="2/3" className="h-5" />}
        {descriptionSlot ?? <CardTextSlot width="full" />}
        {countSlot ?? <CardTextSlot width="1/4" className="h-3" />}
      </div>
    </Card>
  );
}

export interface PublicArticleCardProps extends CardProps {
  readonly imageSlot?: ReactNode;
  readonly categorySlot?: ReactNode;
  readonly titleSlot?: ReactNode;
  readonly excerptSlot?: ReactNode;
  readonly metaSlot?: ReactNode;
}

export function PublicArticleCard({
  imageSlot,
  categorySlot,
  titleSlot,
  excerptSlot,
  metaSlot,
  className,
  ...props
}: PublicArticleCardProps) {
  return (
    <Card interactive padding="none" className={cn("overflow-hidden", className)} {...props}>
      <CardMediaSlot aspect="16/10">{imageSlot}</CardMediaSlot>
      <div className="space-y-2 p-4">
        {categorySlot ?? <CardTextSlot width="1/4" className="h-3" />}
        {titleSlot ?? <CardTextSlot width="full" className="h-5" />}
        {excerptSlot ?? (
          <div className="space-y-1">
            <CardTextSlot width="full" />
            <CardTextSlot width="3/4" />
          </div>
        )}
        {metaSlot ?? <CardTextSlot width="1/3" className="h-3" />}
      </div>
    </Card>
  );
}

export interface PublicFeatureCardProps extends CardProps {
  readonly iconSlot?: ReactNode;
  readonly titleSlot?: ReactNode;
  readonly descriptionSlot?: ReactNode;
}

export function PublicFeatureCard({
  iconSlot,
  titleSlot,
  descriptionSlot,
  className,
  ...props
}: PublicFeatureCardProps) {
  return (
    <Card className={className} {...props}>
      <CardHeader className="space-y-3">
        <div className="flex size-10 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary-muted)]">
          {iconSlot ?? <div className="size-5 rounded-[var(--radius-sm)] bg-[var(--color-primary)]/30" aria-hidden />}
        </div>
        {titleSlot ?? <CardTextSlot width="2/3" className="h-5" />}
        {descriptionSlot ?? (
          <div className="space-y-1">
            <CardTextSlot width="full" />
            <CardTextSlot width="3/4" />
          </div>
        )}
      </CardHeader>
    </Card>
  );
}

export interface PublicReviewCardProps extends CardProps {
  readonly avatarSlot?: ReactNode;
  readonly authorSlot?: ReactNode;
  readonly ratingSlot?: ReactNode;
  readonly contentSlot?: ReactNode;
  readonly vehicleSlot?: ReactNode;
}

export function PublicReviewCard({
  avatarSlot,
  authorSlot,
  ratingSlot,
  contentSlot,
  vehicleSlot,
  className,
  ...props
}: PublicReviewCardProps) {
  return (
    <Card className={className} {...props}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)]">
            {avatarSlot ?? <div className="size-6 rounded-[var(--radius-pill)] bg-[var(--color-border-subtle)]" aria-hidden />}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            {authorSlot ?? <CardTextSlot width="1/2" className="h-4" />}
            {ratingSlot ?? <CardTextSlot width="1/3" className="h-3" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {contentSlot ?? (
          <div className="space-y-1">
            <CardTextSlot width="full" />
            <CardTextSlot width="full" />
            <CardTextSlot width="2/3" />
          </div>
        )}
        {vehicleSlot}
      </CardContent>
    </Card>
  );
}

export interface PublicCategoryCardProps extends CardProps {
  readonly imageSlot?: ReactNode;
  readonly labelSlot?: ReactNode;
  readonly countSlot?: ReactNode;
}

export function PublicCategoryCard({
  imageSlot,
  labelSlot,
  countSlot,
  className,
  ...props
}: PublicCategoryCardProps) {
  return (
    <Card interactive padding="none" className={cn("overflow-hidden", className)} {...props}>
      <CardMediaSlot aspect="1/1">{imageSlot}</CardMediaSlot>
      <div className="space-y-1 p-3 text-center">
        {labelSlot ?? <CardTextSlot width="2/3" className="mx-auto h-4" />}
        {countSlot ?? <CardTextSlot width="1/4" className="mx-auto h-3" />}
      </div>
    </Card>
  );
}

export {
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
