import type { ReactNode } from "react";

import { cn } from "@/utils";

export interface SectionProps {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly id?: string;
}

export interface SectionHeaderProps {
  readonly titleSlot?: ReactNode;
  readonly descriptionSlot?: ReactNode;
  readonly actionsSlot?: ReactNode;
  readonly className?: string;
}

export function SectionHeader({
  titleSlot,
  descriptionSlot,
  actionsSlot,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {titleSlot ?? (
          <div className="h-8 w-48 max-w-full rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
        )}
        {descriptionSlot ?? (
          <div className="h-4 w-72 max-w-full rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
        )}
      </div>
      {actionsSlot}
    </div>
  );
}

export function HeroSection({ children, className, id }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative overflow-hidden border-b border-[var(--color-border-subtle)]",
        className,
      )}
      aria-label="Hero"
    >
      <div className="mx-auto max-w-[var(--container-2xl)] px-4 py-12 lg:px-6 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="space-y-6">
            <div className="h-12 w-full max-w-lg rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
            <div className="h-5 w-full max-w-md rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
            <div className="h-5 w-3/4 max-w-sm rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
          </div>
          <div className="min-h-[240px] rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/50">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturedGridSection({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("py-10 lg:py-16", className)} aria-label="Featured grid">
      <div className="mx-auto max-w-[var(--container-2xl)] px-4 lg:px-6">
        <SectionHeader />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {children ?? Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/30"
              aria-hidden
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function CollectionsSection({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("py-10 lg:py-16", className)} aria-label="Collections">
      <div className="mx-auto max-w-[var(--container-2xl)] px-4 lg:px-6">
        <SectionHeader />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children ?? Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[16/9] rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/30"
              aria-hidden
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function DealerShowcaseSection({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("py-10 lg:py-16", className)} aria-label="Dealer showcase">
      <div className="mx-auto max-w-[var(--container-2xl)] px-4 lg:px-6">
        <SectionHeader />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children ?? Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/30"
              aria-hidden
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function LatestVehiclesSection({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("py-10 lg:py-16", className)} aria-label="Latest vehicles">
      <div className="mx-auto max-w-[var(--container-2xl)] px-4 lg:px-6">
        <SectionHeader />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {children ?? Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[16/10] rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/30"
              aria-hidden
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function NewsSection({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("py-10 lg:py-16", className)} aria-label="News">
      <div className="mx-auto max-w-[var(--container-2xl)] px-4 lg:px-6">
        <SectionHeader />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children ?? Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-56 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/30"
              aria-hidden
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function MarketingBannerSection({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("py-6 lg:py-8", className)} aria-label="Marketing banner">
      <div className="mx-auto max-w-[var(--container-2xl)] px-4 lg:px-6">
        <div className="min-h-[120px] rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/40 lg:min-h-[160px]">
          {children}
        </div>
      </div>
    </section>
  );
}

export function CallToActionSection({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("py-10 lg:py-16", className)} aria-label="Call to action">
      <div className="mx-auto max-w-[var(--container-2xl)] px-4 lg:px-6">
        <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-6 py-12 text-center lg:px-12 lg:py-16">
          <div className="mx-auto max-w-xl space-y-4">
            <div className="mx-auto h-8 w-64 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
            <div className="mx-auto h-4 w-full rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
            <div className="flex justify-center gap-3 pt-2">
              <div className="h-10 w-28 rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
              <div className="h-10 w-28 rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
            </div>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

export function NewsletterSection({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("py-10 lg:py-16", className)} aria-label="Newsletter">
      <div className="mx-auto max-w-[var(--container-xl)] px-4 lg:px-6">
        <div className="rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/30 px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-md space-y-4 text-center">
            <div className="mx-auto h-6 w-40 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
            <div className="mx-auto h-10 w-full rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

export function FooterSection({ children, className }: SectionProps) {
  return (
    <div className={cn("mt-auto", className)}>
      {children}
    </div>
  );
}
