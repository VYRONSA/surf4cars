import type { ReactNode } from "react";

import { PublicPageFrame } from "@/components/public/layout/public-layout";
import {
  CallToActionSection,
  CollectionsSection,
  DealerShowcaseSection,
  FeaturedGridSection,
  HeroSection,
  LatestVehiclesSection,
  MarketingBannerSection,
  NewsSection,
  NewsletterSection,
} from "@/components/public/sections/public-sections";
import { cn } from "@/utils";

export interface HomepageTemplateProps {
  readonly heroSlot?: ReactNode;
  readonly featuredSlot?: ReactNode;
  readonly collectionsSlot?: ReactNode;
  readonly dealersSlot?: ReactNode;
  readonly vehiclesSlot?: ReactNode;
  readonly newsSlot?: ReactNode;
  readonly bannerSlot?: ReactNode;
  readonly ctaSlot?: ReactNode;
  readonly newsletterSlot?: ReactNode;
  readonly className?: string;
}

export function HomepageTemplate({
  heroSlot,
  featuredSlot,
  collectionsSlot,
  dealersSlot,
  vehiclesSlot,
  newsSlot,
  bannerSlot,
  ctaSlot,
  newsletterSlot,
  className,
}: HomepageTemplateProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <HeroSection>{heroSlot}</HeroSection>
      <FeaturedGridSection>{featuredSlot}</FeaturedGridSection>
      <CollectionsSection>{collectionsSlot}</CollectionsSection>
      <DealerShowcaseSection>{dealersSlot}</DealerShowcaseSection>
      <LatestVehiclesSection>{vehiclesSlot}</LatestVehiclesSection>
      <MarketingBannerSection>{bannerSlot}</MarketingBannerSection>
      <NewsSection>{newsSlot}</NewsSection>
      <CallToActionSection>{ctaSlot}</CallToActionSection>
      <NewsletterSection>{newsletterSlot}</NewsletterSection>
    </div>
  );
}

export interface SearchResultsTemplateProps {
  readonly breadcrumbsSlot?: ReactNode;
  readonly searchSlot?: ReactNode;
  readonly filtersSlot?: ReactNode;
  readonly toolbarSlot?: ReactNode;
  readonly resultsSlot?: ReactNode;
  readonly paginationSlot?: ReactNode;
  readonly emptySlot?: ReactNode;
  readonly className?: string;
}

export function SearchResultsTemplate({
  breadcrumbsSlot,
  searchSlot,
  filtersSlot,
  toolbarSlot,
  resultsSlot,
  paginationSlot,
  emptySlot,
  className,
}: SearchResultsTemplateProps) {
  return (
    <PublicPageFrame width="wide" className={className}>
      {breadcrumbsSlot}
      {searchSlot}
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr] xl:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          {filtersSlot ?? (
            <div className="sticky top-24 space-y-4 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] p-4">
              <div className="h-4 w-20 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
              <div className="h-32 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)]" aria-hidden />
            </div>
          )}
        </aside>
        <div className="min-w-0 space-y-6">
          {toolbarSlot}
          {resultsSlot ?? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[16/10] rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/30"
                  aria-hidden
                />
              ))}
            </div>
          )}
          {emptySlot}
          {paginationSlot}
        </div>
      </div>
    </PublicPageFrame>
  );
}

export interface VehicleDetailsTemplateProps {
  readonly breadcrumbsSlot?: ReactNode;
  readonly gallerySlot?: ReactNode;
  readonly detailsSlot?: ReactNode;
  readonly sidebarSlot?: ReactNode;
  readonly relatedSlot?: ReactNode;
  readonly className?: string;
}

export function VehicleDetailsTemplate({
  breadcrumbsSlot,
  gallerySlot,
  detailsSlot,
  sidebarSlot,
  relatedSlot,
  className,
}: VehicleDetailsTemplateProps) {
  return (
    <PublicPageFrame width="wide" className={className}>
      {breadcrumbsSlot}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
        <div className="min-w-0 space-y-6">
          {gallerySlot ?? (
            <div className="aspect-[16/10] rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/30" aria-hidden />
          )}
          {detailsSlot ?? (
            <div className="space-y-4 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
              ))}
            </div>
          )}
        </div>
        <aside className="space-y-4">
          {sidebarSlot ?? (
            <div className="sticky top-24 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] p-6">
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
      {relatedSlot && <div className="mt-12">{relatedSlot}</div>}
    </PublicPageFrame>
  );
}

export interface DealerProfileTemplateProps {
  readonly breadcrumbsSlot?: ReactNode;
  readonly headerSlot?: ReactNode;
  readonly aboutSlot?: ReactNode;
  readonly inventorySlot?: ReactNode;
  readonly reviewsSlot?: ReactNode;
  readonly contactSlot?: ReactNode;
  readonly className?: string;
}

export function DealerProfileTemplate({
  breadcrumbsSlot,
  headerSlot,
  aboutSlot,
  inventorySlot,
  reviewsSlot,
  contactSlot,
  className,
}: DealerProfileTemplateProps) {
  return (
    <PublicPageFrame width="wide" className={className}>
      {breadcrumbsSlot}
      {headerSlot ?? (
        <div className="mb-8 h-48 rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/30 lg:h-56" aria-hidden />
      )}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          {aboutSlot}
          {inventorySlot}
          {reviewsSlot}
        </div>
        <aside>
          {contactSlot ?? (
            <div className="sticky top-24 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] p-6">
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </PublicPageFrame>
  );
}

export interface ContentPageTemplateProps {
  readonly breadcrumbsSlot?: ReactNode;
  readonly headerSlot?: ReactNode;
  readonly contentSlot?: ReactNode;
  readonly sidebarSlot?: ReactNode;
  readonly className?: string;
}

export function ContentPageTemplate({
  breadcrumbsSlot,
  headerSlot,
  contentSlot,
  sidebarSlot,
  className,
}: ContentPageTemplateProps) {
  return (
    <PublicPageFrame className={className}>
      {breadcrumbsSlot}
      {headerSlot}
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <article className="min-w-0">
          {contentSlot ?? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
              ))}
            </div>
          )}
        </article>
        {sidebarSlot && (
          <aside className="hidden lg:block" aria-label="Related content">
            {sidebarSlot}
          </aside>
        )}
      </div>
    </PublicPageFrame>
  );
}

export interface ArticleTemplateProps {
  readonly breadcrumbsSlot?: ReactNode;
  readonly heroSlot?: ReactNode;
  readonly metaSlot?: ReactNode;
  readonly contentSlot?: ReactNode;
  readonly relatedSlot?: ReactNode;
  readonly className?: string;
}

export function ArticleTemplate({
  breadcrumbsSlot,
  heroSlot,
  metaSlot,
  contentSlot,
  relatedSlot,
  className,
}: ArticleTemplateProps) {
  return (
    <PublicPageFrame width="narrow" className={className}>
      {breadcrumbsSlot}
      <article>
        {heroSlot ?? (
          <div className="mb-6 aspect-[21/9] rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-sunken)]/30" aria-hidden />
        )}
        {metaSlot ?? (
          <div className="mb-6 flex gap-3">
            <div className="h-4 w-24 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
            <div className="h-4 w-32 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
          </div>
        )}
        {contentSlot ?? (
          <div className="space-y-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-4 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
            ))}
          </div>
        )}
      </article>
      {relatedSlot && <div className="mt-12">{relatedSlot}</div>}
    </PublicPageFrame>
  );
}

export interface StaticPageTemplateProps {
  readonly breadcrumbsSlot?: ReactNode;
  readonly titleSlot?: ReactNode;
  readonly contentSlot?: ReactNode;
  readonly className?: string;
}

export function StaticPageTemplate({
  breadcrumbsSlot,
  titleSlot,
  contentSlot,
  className,
}: StaticPageTemplateProps) {
  return (
    <PublicPageFrame width="narrow" className={className}>
      {breadcrumbsSlot}
      {titleSlot ?? (
        <div className="mb-8 h-10 w-64 max-w-full rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
      )}
      {contentSlot ?? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
          ))}
        </div>
      )}
    </PublicPageFrame>
  );
}

export interface AuthenticationTemplateProps {
  readonly brandingSlot?: ReactNode;
  readonly formSlot?: ReactNode;
  readonly footerSlot?: ReactNode;
  readonly className?: string;
}

export function AuthenticationTemplate({
  brandingSlot,
  formSlot,
  footerSlot,
  className,
}: AuthenticationTemplateProps) {
  return (
    <PublicPageFrame width="full" className={cn("flex min-h-[calc(100dvh-4rem)] items-center justify-center py-12", className)}>
      <div className="grid w-full max-w-5xl gap-8 px-4 lg:grid-cols-2 lg:gap-12 lg:px-6">
        <div className="hidden flex-col justify-center lg:flex">
          {brandingSlot ?? (
            <div className="space-y-4">
              <div className="h-10 w-48 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
              <div className="h-4 w-full max-w-sm rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
              <div className="h-4 w-3/4 max-w-xs rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
            </div>
          )}
        </div>
        <div className="mx-auto w-full max-w-md">
          {formSlot ?? (
            <div className="rounded-[var(--radius-2xl)] border border-dashed border-[var(--color-border)] p-8">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)] motion-pulse-sfc" aria-hidden />
                ))}
              </div>
            </div>
          )}
          {footerSlot}
        </div>
      </div>
    </PublicPageFrame>
  );
}
